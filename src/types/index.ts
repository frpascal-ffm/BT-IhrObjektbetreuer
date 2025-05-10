
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
export type JobStatus = 'new' | 'inprogress' | 'completed' | 'onhold' | 'canceled';

export interface Job {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate: Date | null;
  completedAt: Date | null;
  assignedTo: string | null;
  notes: string;
}

// Status badge mapping for visual representation
export const statusColorMap: Record<JobStatus, string> = {
  new: 'bg-status-new',
  inprogress: 'bg-status-inprogress',
  completed: 'bg-status-completed',
  onhold: 'bg-status-onhold',
  canceled: 'bg-status-canceled',
};

export const statusNameMap: Record<JobStatus, string> = {
  new: 'Neu',
  inprogress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  onhold: 'Pausiert',
  canceled: 'Storniert',
};
