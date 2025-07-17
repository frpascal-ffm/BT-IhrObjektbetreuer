import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/StatusBadge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Job, JobStatus, Property, statusNameMap } from '@/types';
import { Plus, Calendar, Search, ListTodo, Building, User, ChevronRight, Edit, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { jobsService, propertiesService, employeesService, type Job as FirestoreJob, type Employee } from '@/lib/firestore';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Jobs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignedProperties, setAssignedProperties] = useState<string[]>([]);
  const [statusDropdownJobId, setStatusDropdownJobId] = useState<string | null>(null);
  const [deleteDialogJob, setDeleteDialogJob] = useState<Job | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  
  const [newJob, setNewJob] = useState<Partial<FirestoreJob>>({
    title: '',
    description: '',
    propertyId: '',
    status: 'pending',
    priority: 'medium',
    category: 'maintenance',
    estimatedHours: undefined,
    notes: '',
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Real-time data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates with error handling
    const unsubscribeJobs = jobsService.subscribeToAll((jobsData) => {
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error('Error in jobs subscription:', error);
      toast.error('Fehler beim Laden der Aufträge');
      setLoading(false);
    });

    const unsubscribeProperties = propertiesService.subscribeToAll((propertiesData) => {
      setProperties(propertiesData);
    }, (error) => {
      console.error('Error in properties subscription:', error);
      toast.error('Fehler beim Laden der Liegenschaften');
    });

    const unsubscribeEmployees = employeesService.subscribeToAll((employeesData) => {
      setEmployees(employeesData);
    }, (error) => {
      console.error('Error in employees subscription:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeJobs();
      unsubscribeProperties();
      unsubscribeEmployees();
    };
  }, []);

  // Manual refresh function (now just shows a toast since data updates automatically)
  const handleRefresh = () => {
    setIsRefetching(true);
    // Simulate a brief loading state for user feedback
    setTimeout(() => {
      setIsRefetching(false);
      toast.success('Daten sind aktuell');
    }, 500);
  };

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: jobsService.create,
    onSuccess: () => {
      setDialogOpen(false);
      setNewJob({
        title: '',
        description: '',
        propertyId: '',
        status: 'pending',
        priority: 'medium',
        category: 'maintenance',
        estimatedHours: undefined,
        notes: '',
      });
      toast.success('Auftrag erfolgreich erstellt');
    },
    onError: (error) => {
      console.error('Error creating job:', error);
      toast.error('Fehler beim Erstellen des Auftrags');
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreJob> }) => 
      jobsService.update(id, data),
    onSuccess: () => {
      setStatusDropdownJobId(null);
      toast.success('Auftrag erfolgreich aktualisiert');
    },
    onError: (error) => {
      console.error('Error updating job:', error);
      toast.error('Fehler beim Aktualisieren des Auftrags');
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: jobsService.delete,
    onSuccess: () => {
      setDeleteDialogJob(null);
      toast.success('Auftrag erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      toast.error('Fehler beim Löschen des Auftrags');
    },
  });
  
  // Filter jobs based on search, status, and assigned properties
  const filteredJobs = jobs.filter(job => {
    // Filter by Status (Multi-Select)
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status as JobStatus);
    if (!matchesStatus) return false;

    // Filter by search query
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filter by assigned properties if any
    if (assignedProperties.length > 0) {
      return assignedProperties.includes(job.propertyId);
    }

    // If no assigned properties (admin), show all jobs
    return true;
  });
  
  // Sort jobs: pending first, then in-progress, then completed, all by date desc
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const statusOrder = { pending: 0, 'in-progress': 1, completed: 2, cancelled: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return (b.createdAt?.toDate?.() || new Date(b.createdAt)).getTime() - 
           (a.createdAt?.toDate?.() || new Date(a.createdAt)).getTime();
  });
  
  // Handle form submission for new job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newJob.title || !newJob.description || !newJob.propertyId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Filter out undefined values to prevent Firestore errors
    const jobData: any = {
      title: newJob.title,
      description: newJob.description,
      propertyId: newJob.propertyId,
      status: newJob.status || 'pending',
      priority: newJob.priority || 'medium',
      category: newJob.category || 'maintenance',
    };

    // Only add optional fields if they have values
    if (newJob.dueDate) jobData.dueDate = newJob.dueDate;
    if (newJob.assignedTo) jobData.assignedTo = newJob.assignedTo;
    if (newJob.estimatedHours !== undefined && newJob.estimatedHours !== null) jobData.estimatedHours = newJob.estimatedHours;
    if (newJob.notes) jobData.notes = newJob.notes;

    createJobMutation.mutate(jobData);
  };
  
  const hasAccessToProperty = (propertyId: string) => {
    if (assignedProperties.length === 0) return true; // Admin has access to all
    return assignedProperties.includes(propertyId);
  };

  // Status-Änderung mit Notiz
  const handleStatusChange = async (job: FirestoreJob, newStatus: FirestoreJob['status']) => {
    if (job.status === newStatus) return;
    
    const now = new Date();
    const statusOld = statusNameMap[job.status as JobStatus] || job.status;
    const statusNew = statusNameMap[newStatus as JobStatus] || newStatus;
    const noteText = `Status von "${statusOld}" auf "${statusNew}" geändert am ${now.toLocaleDateString()} um ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    const notes = [
      noteText,
      ...(job.notes ? [job.notes] : []),
    ].join('\n');

    updateJobMutation.mutate({
      id: job.id!,
      data: { 
        status: newStatus, 
        notes,
        updatedAt: now as any
      }
    });
  };

  // Auftrag löschen
  const handleDeleteJob = async () => {
    if (!deleteDialogJob) return;
    deleteJobMutation.mutate(deleteDialogJob.id!);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Aufträge" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex flex-1 max-w-md items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Nach Aufträgen suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Show real-time indicator and manual refresh button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  Live
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                  title="Daten manuell aktualisieren"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
                <PopoverTrigger asChild>
                  <button className="h-12 min-w-[160px] rounded-lg border border-border bg-secondary text-sidebar-foreground text-base px-6 shadow-none focus:ring-2 focus:ring-sidebar-ring focus:outline-none flex items-center">
                    {statusFilter.length === 0 || statusFilter.length === 4
                      ? 'Alle Status'
                      : statusFilter.map(s => statusNameMap[s]).join(', ')}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="rounded-lg border border-border bg-secondary text-sidebar-foreground min-w-[180px] p-0">
                  <div className="py-2">
                    <label className="flex items-center px-4 py-2 cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={statusFilter.length === 4}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilter(['open', 'in-progress', 'closed', 'canceled']);
                          } else {
                            setStatusFilter([]);
                          }
                        }}
                        className="mr-2"
                      />
                      Alle Status
                    </label>
                    {Object.entries(statusNameMap).map(([status, name]) => (
                      <label key={status} className="flex items-center px-4 py-2 cursor-pointer hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(status as JobStatus)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilter([...statusFilter, status as JobStatus]);
                            } else {
                              setStatusFilter(statusFilter.filter(s => s !== status));
                            }
                          }}
                          className="mr-2"
                        />
                        {name}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Auftrag
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Lade Aufträge...</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Keine Aufträge gefunden.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ersten Auftrag erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.map((job) => {
                const property = properties.find(p => p.id === job.propertyId);
                const assignedEmployee = employees.find(e => e.id === job.assignedTo);
                
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <StatusBadge status={job.status as JobStatus} />
                          </div>
                          <p className="text-gray-600 mb-3">{job.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {property?.name || 'Unbekannte Liegenschaft'}
                            </div>
                            {assignedEmployee && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {assignedEmployee.name}
                              </div>
                            )}
                            {job.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(
                                  job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt),
                                  { addSuffix: true, locale: de }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Dialog to add a new job */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neuen Auftrag erstellen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  placeholder="Auftragstitel"
                  required
                  disabled={createJobMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyId">Liegenschaft *</Label>
                <Select
                  value={newJob.propertyId}
                  onValueChange={(value) => setNewJob({...newJob, propertyId: value})}
                  disabled={createJobMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Liegenschaft auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id!}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                placeholder="Detaillierte Beschreibung des Auftrags"
                required
                disabled={createJobMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newJob.status}
                  onValueChange={(value: FirestoreJob['status']) => setNewJob({...newJob, status: value})}
                  disabled={createJobMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={newJob.priority}
                  onValueChange={(value: FirestoreJob['priority']) => setNewJob({...newJob, priority: value})}
                  disabled={createJobMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={newJob.category}
                  onValueChange={(value: FirestoreJob['category']) => setNewJob({...newJob, category: value})}
                  disabled={createJobMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                    <SelectItem value="repair">Reparatur</SelectItem>
                    <SelectItem value="inspection">Inspektion</SelectItem>
                    <SelectItem value="cleaning">Reinigung</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Zugewiesen an</Label>
                <Select
                  value={newJob.assignedTo}
                  onValueChange={(value) => setNewJob({...newJob, assignedTo: value})}
                  disabled={createJobMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id!}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newJob.dueDate}
                  onChange={(e) => setNewJob({...newJob, dueDate: e.target.value})}
                  disabled={createJobMutation.isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Geschätzte Stunden</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={newJob.estimatedHours || ''}
                  onChange={(e) => setNewJob({...newJob, estimatedHours: parseFloat(e.target.value) || undefined})}
                  placeholder="z.B. 2.5"
                  disabled={createJobMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={newJob.notes || ''}
                  onChange={(e) => setNewJob({...newJob, notes: e.target.value})}
                  placeholder="Optionale Notizen zum Auftrag"
                  disabled={createJobMutation.isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={createJobMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Erstellen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteDialogJob} onOpenChange={() => setDeleteDialogJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag löschen</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Sind Sie sicher, dass Sie den Auftrag "{deleteDialogJob?.title}" löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogJob(null)}
              disabled={deleteJobMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteJob}
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;

// Filtered job components
export function JobsWasserschaden() {
  return <JobsFilterWrapper filterType="wasserschaden" />;
}

export function JobsSonderauftrag() {
  return <JobsFilterWrapper filterType="sonderauftrag" />;
}

function JobsFilterWrapper({ filterType }: { filterType: 'wasserschaden' | 'sonderauftrag' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newJob, setNewJob] = useState<Partial<FirestoreJob>>({
    title: '',
    description: '',
    propertyId: '',
    status: 'pending',
    priority: 'high',
    category: filterType === 'wasserschaden' ? 'repair' : 'other',
    estimatedHours: undefined,
    notes: '',
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Real-time data state
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates with error handling
    const unsubscribeJobs = jobsService.subscribeToAll((jobsData) => {
      setAllJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error('Error in jobs subscription:', error);
      toast.error('Fehler beim Laden der Aufträge');
      setLoading(false);
    });

    const unsubscribeProperties = propertiesService.subscribeToAll((propertiesData) => {
      setAllProperties(propertiesData);
    }, (error) => {
      console.error('Error in properties subscription:', error);
      toast.error('Fehler beim Laden der Liegenschaften');
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeJobs();
      unsubscribeProperties();
    };
  }, []);

  // Manual refresh function (now just shows a toast since data updates automatically)
  const handleRefresh = () => {
    setIsRefetching(true);
    // Simulate a brief loading state for user feedback
    setTimeout(() => {
      setIsRefetching(false);
      toast.success('Daten sind aktuell');
    }, 500);
  };

  // Filter jobs based on type
  const filteredJobs = allJobs.filter(job => {
    if (filterType === 'wasserschaden') {
      return job.category === 'repair' && 
             (job.title.toLowerCase().includes('wasser') || 
              job.description.toLowerCase().includes('wasser'));
    } else {
      return job.category === 'other' || 
             job.title.toLowerCase().includes('sonderauftrag') || 
             job.description.toLowerCase().includes('sonderauftrag');
    }
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: jobsService.create,
    onSuccess: () => {
      toast.success('Auftrag erfolgreich erstellt');
    },
    onError: (error) => {
      console.error('Error creating job:', error);
      toast.error('Fehler beim Erstellen des Auftrags');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newJob.title || !newJob.description || !newJob.propertyId) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Filter out undefined values to prevent Firestore errors
    const jobData: any = {
      title: newJob.title,
      description: newJob.description,
      propertyId: newJob.propertyId,
      status: newJob.status || 'pending',
      priority: newJob.priority || 'high',
      category: filterType === 'wasserschaden' ? 'repair' : 'other',
    };

    // Only add optional fields if they have values
    if (newJob.dueDate) jobData.dueDate = newJob.dueDate;
    if (newJob.assignedTo) jobData.assignedTo = newJob.assignedTo;
    if (newJob.estimatedHours !== undefined && newJob.estimatedHours !== null) jobData.estimatedHours = newJob.estimatedHours;
    if (newJob.notes) jobData.notes = newJob.notes;

    createJobMutation.mutate(jobData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header 
          title={filterType === 'wasserschaden' ? 'Baustellen – Wasserschäden' : 'Baustellen – Sonderaufträge'} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {filterType === 'wasserschaden' ? 'Wasserschäden' : 'Sonderaufträge'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  Live
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                  title="Daten manuell aktualisieren"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Button onClick={() => navigate('/jobs')}>
                Alle Aufträge anzeigen
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Lade Aufträge...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Keine {filterType === 'wasserschaden' ? 'Wasserschäden' : 'Sonderaufträge'} gefunden.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const property = allProperties.find(p => p.id === job.propertyId);
                
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <StatusBadge status={job.status as JobStatus} />
                          </div>
                          <p className="text-gray-600 mb-3">{job.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {property?.name || 'Unbekannte Liegenschaft'}
                            </div>
                            {job.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(
                                  job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt),
                                  { addSuffix: true, locale: de }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
