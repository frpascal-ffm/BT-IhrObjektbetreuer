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
import { auth } from './firebase';

// Types
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

export interface Appointment {
  id?: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  propertyId?: string;
  propertyName?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignedToName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  location: string;
  notes?: string[];
}

// Helper function to find the company ID for the current employee
const findCompanyId = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Suche nach dem Unternehmen, das diesen Mitarbeiter beschäftigt
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const companyId = userDoc.id;
      
      // Suche in der users/-COMPANYID-/employees Kollektion
      const employeesQuery = query(
        collection(db, 'users', companyId, 'employees'),
        where('firebaseUid', '==', user.uid)
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      
      if (!employeesSnapshot.empty) {
        return companyId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding company ID:', error);
    return null;
  }
};

// Jobs Service
export const jobsService = {
  async getAll(): Promise<Job[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const querySnapshot = await getDocs(collection(db, 'users', companyId, 'jobs'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getByAssignedTo(assignedTo: string): Promise<Job[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const q = query(
      collection(db, 'users', companyId, 'jobs'),
      where('assignedTo', '==', assignedTo),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getByStatus(status: Job['status']): Promise<Job[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const q = query(
      collection(db, 'users', companyId, 'jobs'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Job[];
  },

  async getById(id: string): Promise<Job | null> {
    const companyId = await findCompanyId();
    if (!companyId) return null;

    const docRef = doc(db, 'users', companyId, 'jobs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
  },

  async update(id: string, job: Partial<Job>): Promise<void> {
    const companyId = await findCompanyId();
    if (!companyId) throw new Error('Company not found');

    const docRef = doc(db, 'users', companyId, 'jobs', id);
    await updateDoc(docRef, {
      ...job,
      updatedAt: serverTimestamp()
    });
  },

  // Real-time subscription for jobs assigned to current employee
  subscribeToAssignedJobs(callback: (jobs: Job[]) => void, onError?: (error: any) => void): Unsubscribe | null {
    const user = auth.currentUser;
    if (!user) return null;

    // We need to find the company ID first, then subscribe
    findCompanyId().then(companyId => {
      if (!companyId) {
        onError?.(new Error('Company not found'));
        return;
      }

      const q = query(
        collection(db, 'users', companyId, 'jobs'),
        where('assignedTo', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const jobs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        callback(jobs);
      }, onError);
    }).catch(onError);

    // Return a dummy unsubscribe function for now
    return () => {};
  }
};

// Properties Service
export const propertiesService = {
  async getAll(): Promise<Property[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const querySnapshot = await getDocs(collection(db, 'users', companyId, 'properties'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Property[];
  },

  async getById(id: string): Promise<Property | null> {
    const companyId = await findCompanyId();
    if (!companyId) return null;

    const docRef = doc(db, 'users', companyId, 'properties', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  }
};

// Appointments Service
export const appointmentsService = {
  async getAll(): Promise<Appointment[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const querySnapshot = await getDocs(collection(db, 'users', companyId, 'appointments'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
  },

  async getByAssignedTo(assignedTo: string): Promise<Appointment[]> {
    const companyId = await findCompanyId();
    if (!companyId) return [];

    const q = query(
      collection(db, 'users', companyId, 'appointments'),
      where('assignedTo', '==', assignedTo),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
  },

  async getById(id: string): Promise<Appointment | null> {
    const companyId = await findCompanyId();
    if (!companyId) return null;

    const docRef = doc(db, 'users', companyId, 'appointments', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Appointment;
    }
    return null;
  },

  async update(id: string, appointment: Partial<Appointment>): Promise<void> {
    const companyId = await findCompanyId();
    if (!companyId) throw new Error('Company not found');

    const docRef = doc(db, 'users', companyId, 'appointments', id);
    await updateDoc(docRef, {
      ...appointment,
      updatedAt: serverTimestamp()
    });
  }
}; 