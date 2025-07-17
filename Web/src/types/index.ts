// Property types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  type: string;
  size: number;
  owner: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job types
export type JobStatus = 'open' | 'in-progress' | 'closed' | 'canceled';

export interface Job {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  completedAt?: Date;
  notes?: { id: string; text: string; createdAt: Date; user: string }[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  jobType?: 'wasserschaden' | 'sonderauftrag';
}

// Status badge mapping for visual representation
export const statusColorMap: Record<JobStatus, string> = {
  'open': 'bg-status-new',
  'in-progress': 'bg-status-inprogress',
  'closed': 'bg-status-completed',
  'canceled': 'bg-status-canceled',
};

export const statusNameMap: Record<JobStatus, string> = {
  'open': 'Offen',
  'in-progress': 'In Bearbeitung',
  'closed': 'Abgeschlossen',
  'canceled': 'Storniert',
};

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  role: 'admin' | 'mitarbeiter'; // Rolle für Berechtigungen
  assignedProperties: string[]; // Array of property IDs
  assignedJobs: string[]; // Array of job IDs (Baustellen/Aufträge)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
