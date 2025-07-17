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

// Properties
export const propertiesService = {
  async getAll(): Promise<Property[]> {
    const querySnapshot = await getDocs(collection(db, 'properties'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Property[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (properties: Property[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      callback(properties);
    }, onError);
  },

  async getById(id: string): Promise<Property | null> {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  },

  async create(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...property,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, property: Partial<Property>): Promise<void> {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, {
      ...property,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'properties', id);
    await deleteDoc(docRef);
  }
};

// Jobs
export const jobsService = {
  async getAll(): Promise<Job[]> {
    const querySnapshot = await getDocs(collection(db, 'jobs'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      callback(jobs);
    }, onError);
  },

  subscribeToByProperty(propertyId: string, callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      callback(jobs);
    }, onError);
  },

  subscribeToByStatus(status: Job['status'], callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      callback(jobs);
    }, onError);
  },

  subscribeToByAssignedTo(assignedTo: string, callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', assignedTo)
    );
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      callback(jobs);
    }, onError);
  },

  async getById(id: string): Promise<Job | null> {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
  },

  async getByProperty(propertyId: string): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getByStatus(status: Job['status']): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
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
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', assignedTo)
    );
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
    
    // Sort in memory as temporary fix while index builds
    return jobs.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    });
  },

  async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...job,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, job: Partial<Job>): Promise<void> {
    const docRef = doc(db, 'jobs', id);
    await updateDoc(docRef, {
      ...job,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'jobs', id);
    await deleteDoc(docRef);
  }
};

// Employees
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
  },

  // Real-time subscription methods
  subscribeToAll(callback: (employees: Employee[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      callback(employees);
    }, onError);
  },

  async getById(id: string): Promise<Employee | null> {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
  },

  async getByRole(role: Employee['role']): Promise<Employee[]> {
    const q = query(
      collection(db, 'employees'),
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
    const q = query(
      collection(db, 'employees'),
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
      
      // Then create Firestore document without password
      const { password, ...employeeData } = employee;
      const docRef = await addDoc(collection(db, 'employees'), {
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
    const docRef = doc(db, 'employees', id);
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
    const docRef = doc(db, 'employees', id);
    await deleteDoc(docRef);
  }
}; 

// Helper function to set admin custom claims
// Note: This requires Firebase Admin SDK on the backend
// For now, we'll create a placeholder function
export const setAdminCustomClaims = async (uid: string, isAdmin: boolean = false) => {
  // This function would typically call a Cloud Function or backend API
  // to set custom claims using Firebase Admin SDK
  console.log(`Would set admin claims for UID ${uid}: ${isAdmin}`);
  
  // In production, you would implement this as:
  // 1. Call a Cloud Function with the UID and admin status
  // 2. The Cloud Function uses Admin SDK to set custom claims
  // 3. The claims are then available in Firestore rules
  
  // For now, we'll just log the intention
  return Promise.resolve();
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