import { Timestamp } from 'firebase/firestore';

export interface Signalement {
  id?: string;
  userId: string;
  latitude: number;
  longitude: number;
  description?: string;
  status: 'nouveau' | 'en_cours' | 'termine';
  surface_m2?: number;
  budget?: number;
  entrepriseId?: string;
  entreprise?: string;
  photoUrl?: string;
  photos?: string[];
  synced: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Entreprise {
  id?: string;
  nom: string;
  contact?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  active: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'visitor' | 'user' | 'manager';
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}
