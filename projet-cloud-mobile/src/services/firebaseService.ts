import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

// Auth
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Propager l'erreur Firebase originale pour préserver la propriété 'code'
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Firestore Signalements (exemples basiques – on étendra plus tard)
export const addSignalement = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'signalements'), {
      ...data,
      userId: auth.currentUser?.uid,
      synced: true, // En ligne
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur ajout signalement:', error);
    throw error;
  }
};

export const getMesSignalements = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, 'signalements'),
    where('userId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};