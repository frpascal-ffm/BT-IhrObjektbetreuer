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
import { AppUser } from './AuthContext';

// Types für unternehmensisolierte Datenbank
export interface CompanyProperty {
  id?: string;
  companyId: string;              // UID des Unternehmens
  name: string;                   // Objektname
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  propertyType: string;           // Wohnung, Haus, Gewerbe, etc.
  size?: number;                  // Größe in m²
  rooms?: number;                 // Anzahl Zimmer
  description?: string;           // Beschreibung
  images?: string[];              // Array von Bild-URLs
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isActive: boolean;
}

export interface CompanyJob {
  id?: string;
  companyId: string;              // UID des Unternehmens
  propertyId: string;             // Referenz zur Property
  title: string;                  // Auftragstitel
  description: string;            // Auftragsbeschreibung
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;               // Kategorie (Reinigung, Reparatur, etc.)
  assignedTo?: string;            // UID des zugewiesenen Mitarbeiters
  createdBy: string;              // UID des erstellenden Benutzers
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  dueDate?: Timestamp;            // Fälligkeitsdatum
  completedAt?: Timestamp;        // Abschlussdatum
  notes?: string[];               // Array von Notizen
  attachments?: string[];         // Array von Datei-URLs
}

export interface CompanyAppointment {
  id?: string;
  companyId: string;              // UID des Unternehmens
  propertyId?: string;            // Optional: Referenz zur Property
  jobId?: string;                 // Optional: Referenz zum Job
  title: string;                  // Termintitel
  description: string;            // Terminbeschreibung
  startTime: Timestamp;           // Startzeit
  endTime: Timestamp;             // Endzeit
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;            // UID des zugewiesenen Mitarbeiters
  createdBy: string;              // UID des erstellenden Benutzers
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  location: string;               // Ort des Termins
  notes?: string[];               // Array von Notizen
  attendees?: string[];           // Array von Teilnehmer-UIDs
}

export interface EmployeeInvitation {
  id?: string;
  companyId: string;              // UID des einladenden Unternehmens
  email: string;                  // E-Mail des eingeladenen Mitarbeiters
  status: 'pending' | 'accepted' | 'expired';
  invitationToken: string;        // Einladungstoken
  permissions: {                  // Gewährte Berechtigungen
    canViewJobs: boolean;
    canEditJobs: boolean;
    canViewProperties: boolean;
    canEditProperties: boolean;
    canViewAppointments: boolean;
    canEditAppointments: boolean;
  };
  createdAt?: Timestamp;
  expiresAt: Timestamp;           // Ablaufdatum der Einladung
  acceptedAt?: Timestamp;
}

// Properties Service
export const companyPropertiesService = {
  // Alle Properties eines Unternehmens abrufen
  async getByCompany(companyId: string): Promise<CompanyProperty[]> {
    const q = query(
      collection(db, 'properties'),
      where('companyId', '==', companyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyProperty[];
  },

  // Real-time subscription für Properties eines Unternehmens
  subscribeToCompany(companyId: string, callback: (properties: CompanyProperty[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'properties'),
      where('companyId', '==', companyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyProperty[];
      callback(properties);
    }, onError);
  },

  async getById(id: string): Promise<CompanyProperty | null> {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CompanyProperty;
    }
    return null;
  },

  async create(property: Omit<CompanyProperty, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...property,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, property: Partial<CompanyProperty>): Promise<void> {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, {
      ...property,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  }
};

// Jobs Service
export const companyJobsService = {
  // Alle Jobs eines Unternehmens abrufen
  async getByCompany(companyId: string): Promise<CompanyJob[]> {
    const q = query(
      collection(db, 'jobs'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyJob[];
  },

  // Jobs eines Mitarbeiters abrufen
  async getByEmployee(employeeId: string): Promise<CompanyJob[]> {
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyJob[];
  },

  // Real-time subscription für Jobs eines Unternehmens
  subscribeToCompany(companyId: string, callback: (jobs: CompanyJob[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyJob[];
      callback(jobs);
    }, onError);
  },

  // Real-time subscription für Jobs eines Mitarbeiters
  subscribeToEmployee(employeeId: string, callback: (jobs: CompanyJob[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'jobs'),
      where('assignedTo', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyJob[];
      callback(jobs);
    }, onError);
  },

  async getById(id: string): Promise<CompanyJob | null> {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CompanyJob;
    }
    return null;
  },

  async create(job: Omit<CompanyJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...job,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, job: Partial<CompanyJob>): Promise<void> {
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

// Appointments Service
export const companyAppointmentsService = {
  // Alle Termine eines Unternehmens abrufen
  async getByCompany(companyId: string): Promise<CompanyAppointment[]> {
    const q = query(
      collection(db, 'appointments'),
      where('companyId', '==', companyId),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyAppointment[];
  },

  // Termine eines Mitarbeiters abrufen
  async getByEmployee(employeeId: string): Promise<CompanyAppointment[]> {
    const q = query(
      collection(db, 'appointments'),
      where('assignedTo', '==', employeeId),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyAppointment[];
  },

  // Real-time subscription für Termine eines Unternehmens
  subscribeToCompany(companyId: string, callback: (appointments: CompanyAppointment[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'appointments'),
      where('companyId', '==', companyId),
      orderBy('startTime', 'asc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyAppointment[];
      callback(appointments);
    }, onError);
  },

  // Real-time subscription für Termine eines Mitarbeiters
  subscribeToEmployee(employeeId: string, callback: (appointments: CompanyAppointment[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'appointments'),
      where('assignedTo', '==', employeeId),
      orderBy('startTime', 'asc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyAppointment[];
      callback(appointments);
    }, onError);
  },

  async getById(id: string): Promise<CompanyAppointment | null> {
    const docRef = doc(db, 'appointments', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CompanyAppointment;
    }
    return null;
  },

  async create(appointment: Omit<CompanyAppointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, appointment: Partial<CompanyAppointment>): Promise<void> {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      ...appointment,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  }
};

// Employee Management Service
export const employeeService = {
  // Alle Mitarbeiter eines Unternehmens abrufen
  async getByCompany(companyId: string): Promise<AppUser[]> {
    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId),
      where('role', '==', 'employee'),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as AppUser[];
  },

  // Real-time subscription für Mitarbeiter eines Unternehmens
  subscribeToCompany(companyId: string, callback: (employees: AppUser[]) => void, onError?: (error: any) => void): Unsubscribe {
    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId),
      where('role', '==', 'employee'),
      where('isActive', '==', true)
    );
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as AppUser[];
      callback(employees);
    }, onError);
  },

  async getById(uid: string): Promise<AppUser | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as AppUser;
    }
    return null;
  },

  async update(uid: string, employee: Partial<AppUser>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...employee,
      updatedAt: serverTimestamp()
    });
  },

  async deactivate(uid: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  }
};

// Employee Invitation Service
export const employeeInvitationService = {
  // Alle Einladungen eines Unternehmens abrufen
  async getByCompany(companyId: string): Promise<EmployeeInvitation[]> {
    const q = query(
      collection(db, 'employeeInvitations'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EmployeeInvitation[];
  },

  async create(invitation: Omit<EmployeeInvitation, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'employeeInvitations'), {
      ...invitation,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, invitation: Partial<EmployeeInvitation>): Promise<void> {
    const docRef = doc(db, 'employeeInvitations', id);
    await updateDoc(docRef, invitation);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'employeeInvitations', id);
    await deleteDoc(docRef);
  }
}; 