import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';

// Hilfsfunktion zur Generierung eines sicheren Passworts
export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Types
export interface Property {
  id?: string;
  name: string;
  address: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  owner?: string;
  description?: string;
  imageUrl?: string;
}

export interface Job {
  id?: string;
  title: string;
  description: string;
  propertyId: string;
  propertyName?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  dueDate?: Timestamp;
  category: 'maintenance' | 'repair' | 'inspection' | 'cleaning' | 'other';
  estimatedHours?: number;
  actualHours?: number;
  materials?: string[];
  notes?: string;
}

export interface Employee {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'cleaner';
  phone?: string;
  status: 'active' | 'inactive';
  firebaseUid?: string; // Firebase Auth UID instead of password
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  avatar?: string;
}

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }
  return user.uid;
};

// Helper function to get current user ID with error handling
const getCurrentUserIdSafe = (): string | null => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

// Properties - Now stored under users/-USERID-/properties
export const propertiesService = {
  async getAll(): Promise<Property[]> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty properties array');
      return [];
    }
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'properties'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Property[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (properties: Property[]) => void, onError?: (error: any) => void): Unsubscribe {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty subscription');
      // Return a dummy unsubscribe function
      return () => {};
    }
    console.log('Creating properties subscription for user:', userId);
    const q = query(collection(db, 'users', userId, 'properties'));
    return onSnapshot(q, (querySnapshot) => {
      console.log('Properties snapshot received:', querySnapshot.docs.length, 'documents');
      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      // Sort by createdAt in memory since serverTimestamp might not be available immediately
      properties.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });
      callback(properties);
    }, onError);
  },

  async getById(id: string): Promise<Property | null> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    const docRef = doc(db, 'users', userId, 'properties', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  },

  async create(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    console.log('Creating property for user:', userId, 'with data:', property);
    const docRef = await addDoc(collection(db, 'users', userId, 'properties'), {
      ...property,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Property created successfully with ID:', docRef.id);
    return docRef.id;
  },

  async update(id: string, property: Partial<Property>): Promise<void> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    const docRef = doc(db, 'users', userId, 'properties', id);
    await updateDoc(docRef, {
      ...property,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    const docRef = doc(db, 'users', userId, 'properties', id);
    await deleteDoc(docRef);
  }
};

// Jobs - Now stored under users/-USERID-/jobs
export const jobsService = {
  async getAll(): Promise<Job[]> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty jobs array');
      return [];
    }
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'jobs'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty subscription');
      return () => {};
    }
    const q = query(collection(db, 'users', userId, 'jobs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      callback(jobs);
    }, onError);
  },

  async getById(id: string): Promise<Job | null> {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'jobs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
  },

  async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = getCurrentUserId();
    const docRef = await addDoc(collection(db, 'users', userId, 'jobs'), {
      ...job,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, job: Partial<Job>): Promise<void> {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'jobs', id);
    await updateDoc(docRef, {
      ...job,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'jobs', id);
    await deleteDoc(docRef);
  },

  async getByStatus(status: Job['status']): Promise<Job[]> {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'users', userId, 'jobs'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getByAssignedTo(assignedTo: string): Promise<Job[]> {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'users', userId, 'jobs'),
      where('assignedTo', '==', assignedTo),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  }
};

// Employees - Now stored under users/-USERID-/employees
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty employees array');
      return [];
    }
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'employees'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (employees: Employee[]) => void, onError?: (error: any) => void): Unsubscribe {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No authenticated user found, returning empty subscription');
      return () => {};
    }
    const q = query(collection(db, 'users', userId, 'employees'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      callback(employees);
    }, onError);
  },

  async getById(id: string): Promise<Employee | null> {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
  },

  async getByRole(role: Employee['role']): Promise<Employee[]> {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'users', userId, 'employees'),
      where('role', '==', role),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
  },

  async getByEmail(email: string): Promise<Employee | null> {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'users', userId, 'employees'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Employee;
    }
    return null;
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'firebaseUid'> & { password: string }): Promise<string> {
    try {
      console.log('Creating employee in Firebase Auth:', { email: employee.email, passwordLength: employee.password.length });
      
      // First, create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        employee.email, 
        employee.password
      );
      
      const firebaseUid = userCredential.user.uid;
      console.log('Firebase Auth user created successfully:', { uid: firebaseUid, email: employee.email });
      
      // Then create Firestore document under the current user's collection
      const userId = getCurrentUserId();
      const { password, ...employeeData } = employee;
      const docRef = await addDoc(collection(db, 'users', userId, 'employees'), {
        ...employeeData,
        firebaseUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Employee document created in Firestore:', { docId: docRef.id, firebaseUid });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  async update(id: string, employee: Partial<Employee>): Promise<void> {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'employees', id);
    await updateDoc(docRef, {
      ...employee,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    // Get the employee to find their Firebase UID
    const employee = await this.getById(id);
    if (employee?.firebaseUid) {
      // Delete Firebase Auth user if it exists
      try {
        // Note: This requires admin SDK in production
        // For now, we'll just delete the Firestore document
        // The Firebase Auth user will need to be deleted manually or via admin SDK
        console.warn('Firebase Auth user deletion requires admin SDK. User UID:', employee.firebaseUid);
      } catch (error) {
        console.error('Error deleting Firebase Auth user:', error);
      }
    }
    
    // Delete Firestore document
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'employees', id);
    await deleteDoc(docRef);
  }
};

// Debug utility function to check employee status
export const debugEmployeeStatus = async (email: string) => {
  try {
    console.log('=== Debug Employee Status ===');
    console.log('Email:', email);
    
    // Check if employee exists in Firestore
    const firestoreEmployee = await employeesService.getByEmail(email);
    console.log('Firestore Employee:', firestoreEmployee ? {
      id: firestoreEmployee.id,
      name: firestoreEmployee.name,
      email: firestoreEmployee.email,
      status: firestoreEmployee.status,
      firebaseUid: firestoreEmployee.firebaseUid
    } : 'NOT FOUND');
    
    // Note: We can't directly check Firebase Auth from client side
    // This would require Admin SDK on the backend
    console.log('Firebase Auth: Cannot check directly from client (requires Admin SDK)');
    
    return {
      firestore: firestoreEmployee,
      firebaseAuth: 'Cannot check from client'
    };
  } catch (error) {
    console.error('Error debugging employee status:', error);
    throw error;
  }
}; 