import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../features/auth/contexts/AuthContext';
import {
  getFromLocalStorage,
  saveToLocalStorage,
  getFromFirestore,
  saveToFirestore,
  getCollectionName,
  migrateLocalToFirestore,
} from '../services/persistence';

/**
 * Hook for persistent data storage that automatically switches between
 * localStorage (for anonymous users) and Firestore (for authenticated users).
 * 
 * This is a drop-in replacement for useLocalStorage that adds cloud sync
 * capability when the user is logged in.
 * 
 * @param key - The storage key (used for both localStorage and Firestore collection mapping)
 * @param initialValue - The initial/default value
 * @returns A tuple of [value, setValue] similar to useState
 */
export function usePersistence<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const { currentUser } = useAuth();
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Store initialValue in a ref to avoid triggering useEffect on every render
  // when callers pass a new object/array reference (e.g. [])
  const initialValueRef = useRef(initialValue);

  // Keep track of whether we've done the initial load
  const initialLoadDone = useRef(false);
  const previousUserId = useRef<string | null>(null);

  // Load data on mount and when auth state changes
  useEffect(() => {
    let mounted = true;
    const initVal = initialValueRef.current;

    async function loadData() {
      setIsLoading(true);

      try {
        if (currentUser) {
          // User is logged in - use Firestore
          const collectionName = getCollectionName(key);
          
          if (collectionName) {
            // Check if this is a new login (user was previously null)
            if (previousUserId.current === null && initialLoadDone.current) {
              // Migrate local data to Firestore
              await migrateLocalToFirestore(currentUser.uid);
            }
            
            const firestoreData = await getFromFirestore<T>(
              currentUser.uid, 
              collectionName, 
              initVal
            );
            
            if (mounted) {
              setStoredValue(firestoreData);
            }
          }
        } else {
          // User is not logged in - use localStorage
          const localData = getFromLocalStorage<T>(key, initVal);
          if (mounted) {
            setStoredValue(localData);
          }
        }
      } catch (error) {
        console.error(`Error loading data for key "${key}":`, error);
        // Fallback to localStorage on error
        const localData = getFromLocalStorage<T>(key, initVal);
        if (mounted) {
          setStoredValue(localData);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          initialLoadDone.current = true;
          previousUserId.current = currentUser?.uid || null;
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentUser, key]);

  // Save function that handles both localStorage and Firestore
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);

        if (currentUser) {
          // User is logged in - save to Firestore
          const collectionName = getCollectionName(key);
          
          if (collectionName) {
            setIsSyncing(true);
            saveToFirestore(currentUser.uid, collectionName, valueToStore)
              .catch((error) => {
                console.error(`Error saving to Firestore for key "${key}":`, error);
                // Fallback: also save to localStorage as backup
                saveToLocalStorage(key, valueToStore);
              })
              .finally(() => {
                setIsSyncing(false);
              });
          }
        } else {
          // User is not logged in - save to localStorage
          saveToLocalStorage(key, valueToStore);
        }
      } catch (error) {
        console.error(`Error in setValue for key "${key}":`, error);
      }
    },
    [currentUser, key, storedValue]
  );

  return [storedValue, setValue, isLoading];
}

/**
 * Hook specifically for checking sync status
 * Useful for showing sync indicators in the UI
 */
export function useSyncStatus() {
  const { currentUser } = useAuth();
  
  return {
    isAuthenticated: !!currentUser,
    storageType: currentUser ? 'cloud' : 'local',
    userId: currentUser?.uid || null,
  };
}
