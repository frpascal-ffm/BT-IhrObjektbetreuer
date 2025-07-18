import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Employee Types
export interface Employee {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'cleaner';
  phone?: string;
  status: 'active' | 'inactive';
  firebaseUid?: string;
  createdAt?: any;
  updatedAt?: any;
  avatar?: string;
}

interface AuthContextType {
  currentUser: User | null;
  employee: Employee | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
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
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Hilfsfunktion zum Laden der Mitarbeiterdaten
  const loadEmployeeData = async (user: User) => {
    try {
      // Suche nach dem Mitarbeiter in allen User-Kollektionen
      // Da wir nicht wissen, zu welchem Unternehmen der Mitarbeiter gehört,
      // müssen wir alle User-Kollektionen durchsuchen
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const companyId = userDoc.id;
        
        // Suche in der User/-COMPANYID-/employees Kollektion
        const employeesQuery = query(
          collection(db, 'users', companyId, 'employees'),
          where('firebaseUid', '==', user.uid)
        );
        
        const employeesSnapshot = await getDocs(employeesQuery);
        
        if (!employeesSnapshot.empty) {
          const employeeDoc = employeesSnapshot.docs[0];
          const employeeData = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
          
          // Prüfe ob der Mitarbeiter aktiv ist
          if (employeeData.status === 'active') {
            setEmployee(employeeData);
            return;
          }
        }
      }
      
      // Mitarbeiter nicht gefunden oder inaktiv
      setEmployee(null);
    } catch (error) {
      console.error('Error loading employee data:', error);
      setEmployee(null);
    }
  };

  async function login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Mitarbeiterdaten laden
      await loadEmployeeData(user);
      
      if (!employee) {
        throw new Error('Mitarbeiter nicht gefunden oder inaktiv');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  function logout() {
    setEmployee(null);
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadEmployeeData(user);
      } else {
        setEmployee(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    employee,
    login,
    logout,
    resetPassword,
    loading,
    isAuthenticated: !!currentUser && !!employee
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 