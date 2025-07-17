import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Erweiterte Benutzer-Types für Unternehmensstruktur
export interface AppUser {
  uid: string;
  email: string;
  role: 'company' | 'employee';
  companyId?: string; // Nur für Mitarbeiter: UID des Unternehmens
  displayName: string;
  companyName?: string; // Nur für Unternehmen: Firmenname
  createdAt: any;
  lastLogin: any;
  isActive: boolean;
  permissions?: {
    canViewJobs: boolean;
    canEditJobs: boolean;
    canViewProperties: boolean;
    canEditProperties: boolean;
    canViewAppointments: boolean;
    canEditAppointments: boolean;
  };
}

interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isCompany: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hilfsfunktion zum Laden der App-Benutzerdaten
  const loadAppUser = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setAppUser({ uid: userDoc.id, ...userDoc.data() } as AppUser);
      } else {
        // Fallback: Benutzer existiert nicht in Firestore
        setAppUser(null);
      }
    } catch (error) {
      console.error('Error loading app user:', error);
      setAppUser(null);
    }
  };

  async function register(email: string, password: string, companyName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Unternehmen-Dokument in Firestore erstellen
    const appUserData: AppUser = {
      uid: user.uid,
      email: user.email!,
      role: 'company',
      displayName: companyName,
      companyName: companyName,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true
    };
    
    await setDoc(doc(db, 'users', user.uid), appUserData);
    setAppUser(appUserData);
  }

  async function login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // App-Benutzerdaten laden
    await loadAppUser(user);
    
    // LastLogin aktualisieren
    if (appUser) {
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
    }
  }

  function logout() {
    setAppUser(null);
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadAppUser(user);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    appUser,
    login,
    register,
    logout,
    resetPassword,
    loading,
    isCompany: appUser?.role === 'company',
    isEmployee: appUser?.role === 'employee'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 