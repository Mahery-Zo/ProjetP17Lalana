import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import type { Signalement, Entreprise } from '@/types/firebase.types';

// ==================== AUTH ====================

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// ==================== SIGNALEMENTS ====================

export const addSignalement = async (data: Omit<Signalement, 'id' | 'userId' | 'createdAt' | 'synced'>): Promise<{id: string}> => {
  if (!auth.currentUser) {
    throw new Error('Utilisateur non authentifié');
  }

  const signalement: Omit<Signalement, 'id'> = {
    ...data,
    userId: auth.currentUser.uid,
    synced: true,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, 'signalements'), signalement);
  return { id: docRef.id };
};

export const getMesSignalements = async (): Promise<Signalement[]> => {
  if (!auth.currentUser) return [];
  
  const q = query(
    collection(db, 'signalements'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Signalement));
};

export const getTousLesSignalements = async (): Promise<Signalement[]> => {
  const q = query(
    collection(db, 'signalements'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Signalement));
};

export const getSignalementById = async (id: string): Promise<Signalement | null> => {
  const docRef = doc(db, 'signalements', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Signalement;
  }
  return null;
};

export const updateSignalement = async (id: string, data: Partial<Signalement>): Promise<void> => {
  const docRef = doc(db, 'signalements', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSignalement = async (id: string): Promise<void> => {
  const docRef = doc(db, 'signalements', id);
  await deleteDoc(docRef);
};

// ==================== ENTREPRISES ====================

export const getEntreprises = async (): Promise<Entreprise[]> => {
  const q = query(
    collection(db, 'entreprises'),
    where('active', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Entreprise));
};

export const getEntrepriseById = async (id: string): Promise<Entreprise | null> => {
  const docRef = doc(db, 'entreprises', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Entreprise;
  }
  return null;
};