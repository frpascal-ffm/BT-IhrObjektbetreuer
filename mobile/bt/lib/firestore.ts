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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

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
  password?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  avatar?: string;
}

// Jobs Service
export const jobsService = {
  async getByAssignedTo(assignedTo: string): Promise<Job[]> {
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', assignedTo),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getById(id: string): Promise<Job | null> {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
  },

  async update(id: string, job: Partial<Job>): Promise<void> {
    const docRef = doc(db, 'jobs', id);
    await updateDoc(docRef, {
      ...job,
      updatedAt: serverTimestamp()
    });
  }
};

// Employees Service
export const employeesService = {
  async getByEmail(email: string): Promise<Employee | null> {
    const q = query(
      collection(db, 'employees'),
      where('email', '==', email),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Employee;
    }
    return null;
  },

  async getById(id: string): Promise<Employee | null> {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
  }
};

// Properties Service
export const propertiesService = {
  async getById(id: string): Promise<Property | null> {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  }
}; 