import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employeesService, type Employee } from './firestore';

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredEmployee();
  }, []);

  const loadStoredEmployee = async () => {
    try {
      // Für Testzwecke: Nur employee-Key leeren, nicht alles
      await AsyncStorage.removeItem('employee');
      
      // Prüfe ob es gespeicherte Mitarbeiter-Daten gibt
      const storedEmployee = await AsyncStorage.getItem('employee');
      if (storedEmployee) {
        const parsedEmployee = JSON.parse(storedEmployee);
        setEmployee(parsedEmployee);
      } else {
        // Keine gespeicherten Daten - sicherstellen dass employee null ist
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error loading stored employee:', error);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Suche nach Mitarbeiter mit der E-Mail
      const foundEmployee = await employeesService.getByEmail(email);
      
      if (!foundEmployee) {
        return false;
      }

      // Überprüfe das Passwort
      if (foundEmployee.password !== password) {
        return false;
      }

      // Speichere Mitarbeiter in AsyncStorage
      await AsyncStorage.setItem('employee', JSON.stringify(foundEmployee));
      setEmployee(foundEmployee);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('employee');
      setEmployee(null);
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
    isLoading,
    login,
    logout,
    isAuthenticated: !!employee,
    clearStoredData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 