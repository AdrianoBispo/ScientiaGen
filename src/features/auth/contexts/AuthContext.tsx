import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  User 
} from 'firebase/auth';
import { auth, googleProvider } from '../../../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to handle Google Login
  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  }

  // Function to handle Email/Password Login
  async function loginWithEmail(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Erro ao fazer login com e-mail:", error);
      throw error;
    }
  }

  // Function to handle Email/Password Registration
  // Checks if email is already linked to Google provider before creating
  async function registerWithEmail(email: string, password: string, displayName: string) {
    try {
      // Check if the email is already associated with Google provider
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.includes('google.com')) {
        const error = new Error('Este e-mail já está vinculado a uma conta Google.');
        (error as any).code = 'auth/email-exists-in-google-provider';
        throw error;
      }

      // Create the user with email and password (no truncation - Firebase handles full string)
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(credential.user, { displayName });
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      throw error;
    }
  }

  // Function to handle Logout
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  // Effect to track auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
