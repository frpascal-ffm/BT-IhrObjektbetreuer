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

// Jobs Service
export const jobsService = {
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

  // Neue Methode für Echtzeit-Updates
  subscribeToJobsByAssignedTo(
    assignedTo: string, 
    callback: (jobs: Job[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', assignedTo),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      
      callback(jobs);
    }, (error) => {
      console.error('Error listening to jobs:', error);
    });
  },

  // Neue Methode für Echtzeit-Updates eines einzelnen Jobs
  subscribeToJobById(
    jobId: string,
    callback: (job: Job | null) => void
  ): Unsubscribe {
    const docRef = doc(db, 'jobs', jobId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const job = { id: docSnap.id, ...docSnap.data() } as Job;
        callback(job);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to job:', error);
      callback(null);
    });
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