import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employeesService, type Employee } from './firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  employee: Employee | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  clearStoredData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in, fetch employee data from Firestore
        try {
          const foundEmployee = await employeesService.getByEmail(user.email!);
          if (foundEmployee && foundEmployee.status === 'active') {
            setEmployee(foundEmployee);
            // Store employee data in AsyncStorage
            await AsyncStorage.setItem('employee', JSON.stringify(foundEmployee));
          } else {
            // Employee not found or inactive, sign out
            await signOut(auth);
            setEmployee(null);
            await AsyncStorage.removeItem('employee');
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          await signOut(auth);
          setEmployee(null);
          await AsyncStorage.removeItem('employee');
        }
      } else {
        // User is signed out
        setEmployee(null);
        await AsyncStorage.removeItem('employee');
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting login with:', { email, passwordLength: password.length });
      
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Firebase Auth login successful');
      
      // The onAuthStateChanged listener will handle fetching employee data
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setIsLoading(false);
      
      // Return specific error messages for better UX
      if (error.code === 'auth/user-not-found') {
        throw new Error('Benutzer nicht gefunden');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Falsches Passwort');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Ungültige E-Mail-Adresse');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.');
      } else {
        throw new Error(`Anmeldung fehlgeschlagen: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle clearing employee data
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearStoredData = async () => {
    try {
      await AsyncStorage.removeItem('employee');
      setEmployee(null);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  const value: AuthContextType = {
    employee,
    firebaseUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!employee && !!firebaseUser,
    clearStoredData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 