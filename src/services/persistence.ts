/**
 * Persistence Service
 * 
 * Handles data persistence with two strategies:
 * - Local Storage: For users not logged in
 * - Firestore: For authenticated users
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names in Firestore
export const COLLECTIONS = {
  USER_DATA: 'userData',
  FLASHCARD_SETS: 'flashcardSets',
  FLASHCARD_HISTORY: 'flashcardHistory',
  LEARN_HISTORY: 'learnHistory',
  LEARN_QUIZZES: 'savedLearnQuizzes',
  TEST_HISTORY: 'testHistory',
  TEST_QUIZZES: 'savedTestQuizzes',
  MATCH_HISTORY: 'matchHistory',
  MATCH_GAMES: 'savedMatchGames',
  MIXED_HISTORY: 'mixedHistory',
  MIXED_QUIZZES: 'savedMixedQuizzes',
  GUIDED_HISTORY: 'guidedHistory',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/**
 * Get data from localStorage
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Save data to localStorage
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
  }
}

/**
 * Get data from Firestore for a specific user
 */
export async function getFromFirestore<T>(
  userId: string, 
  collectionName: CollectionName, 
  defaultValue: T
): Promise<T> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_DATA, userId, collectionName, 'data');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().value as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading Firestore collection "${collectionName}":`, error);
    return defaultValue;
  }
}

/**
 * Save data to Firestore for a specific user
 */
export async function saveToFirestore<T>(
  userId: string, 
  collectionName: CollectionName, 
  value: T
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_DATA, userId, collectionName, 'data');
    await setDoc(docRef, { 
      value, 
      updatedAt: new Date().toISOString() 
    });
  } catch (error) {
    console.error(`Error writing to Firestore collection "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Delete data from Firestore for a specific user
 */
export async function deleteFromFirestore(
  userId: string, 
  collectionName: CollectionName
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_DATA, userId, collectionName, 'data');
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from Firestore collection "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Migrate local data to Firestore when user logs in
 */
export async function migrateLocalToFirestore(userId: string): Promise<void> {
  const localKeys = [
    { local: 'flashcardSets', firestore: COLLECTIONS.FLASHCARD_SETS },
    { local: 'flashcardHistory', firestore: COLLECTIONS.FLASHCARD_HISTORY },
    { local: 'learnHistory', firestore: COLLECTIONS.LEARN_HISTORY },
    { local: 'savedLearnQuizzes', firestore: COLLECTIONS.LEARN_QUIZZES },
    { local: 'testHistory', firestore: COLLECTIONS.TEST_HISTORY },
    { local: 'savedTestQuizzes', firestore: COLLECTIONS.TEST_QUIZZES },
    { local: 'matchHistory', firestore: COLLECTIONS.MATCH_HISTORY },
    { local: 'savedMatchGames', firestore: COLLECTIONS.MATCH_GAMES },
    { local: 'mixedHistory', firestore: COLLECTIONS.MIXED_HISTORY },
    { local: 'savedMixedQuizzes', firestore: COLLECTIONS.MIXED_QUIZZES },
    { local: 'guidedHistory', firestore: COLLECTIONS.GUIDED_HISTORY },
  ];

  for (const { local, firestore } of localKeys) {
    const localData = getFromLocalStorage<unknown[] | null>(local, null);
    
    if (localData !== null && Array.isArray(localData) && localData.length > 0) {
      try {
        // Get existing Firestore data
        const existingData = await getFromFirestore<unknown[]>(userId, firestore, []);
        
        // Merge local and Firestore data (avoiding duplicates by id)
        const mergedData = [...existingData];
        const existingIds = new Set(existingData.map((item: any) => item.id));
        
        for (const item of localData as any[]) {
          if (!existingIds.has(item.id)) {
            mergedData.push(item);
          }
        }
        
        // Save merged data to Firestore
        await saveToFirestore(userId, firestore, mergedData);
        
        // Clear local storage after successful migration
        removeFromLocalStorage(local);
        
        console.log(`Migrated ${local} to Firestore`);
      } catch (error) {
        console.error(`Error migrating ${local} to Firestore:`, error);
      }
    }
  }
}

/**
 * Get the mapping between localStorage keys and Firestore collection names
 */
export function getCollectionName(localStorageKey: string): CollectionName | null {
  const mapping: Record<string, CollectionName> = {
    'flashcardSets': COLLECTIONS.FLASHCARD_SETS,
    'flashcardHistory': COLLECTIONS.FLASHCARD_HISTORY,
    'learnHistory': COLLECTIONS.LEARN_HISTORY,
    'savedLearnQuizzes': COLLECTIONS.LEARN_QUIZZES,
    'testHistory': COLLECTIONS.TEST_HISTORY,
    'savedTestQuizzes': COLLECTIONS.TEST_QUIZZES,
    'matchHistory': COLLECTIONS.MATCH_HISTORY,
    'savedMatchGames': COLLECTIONS.MATCH_GAMES,
    'mixedHistory': COLLECTIONS.MIXED_HISTORY,
    'savedMixedQuizzes': COLLECTIONS.MIXED_QUIZZES,
    'guidedHistory': COLLECTIONS.GUIDED_HISTORY,
  };
  
  return mapping[localStorageKey] || null;
}
