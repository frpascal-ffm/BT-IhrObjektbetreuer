import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/StatusBadge';
import { Job, JobStatus, statusNameMap } from '@/types';
import { Property } from '@/lib/firestore';
import { ArrowLeft, Edit, Save, X, Calendar, Building, User, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { jobsService, propertiesService, employeesService, type Job as FirestoreJob } from '@/lib/firestore';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<FirestoreJob>>({});

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getById(id!),
    enabled: !!id,
  });

  // Fetch related data
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesService.getAll,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesService.getAll,
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreJob> }) => 
      jobsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsEditing(false);
      toast.success('Auftrag erfolgreich aktualisiert');
    },
    onError: (error) => {
      console.error('Error updating job:', error);
      toast.error('Fehler beim Aktualisieren des Auftrags');
    },
  });

  // Handle save
  const handleSave = async () => {
    if (!id) return;
    
    updateJobMutation.mutate({
      id,
      data: editedJob
    });
  };

  // Handle status change
  const handleStatusChange = async (newStatus: FirestoreJob['status']) => {
    if (!id || !job || job.status === newStatus) return;
    
    const now = new Date();
    const statusOld = statusNameMap[job.status as JobStatus] || job.status;
    const statusNew = statusNameMap[newStatus as JobStatus] || newStatus;
    const noteText = `Status von "${statusOld}" auf "${statusNew}" geändert am ${now.toLocaleDateString()} um ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    const notes = [
      noteText,
      ...(job.notes ? [job.notes] : []),
    ].join('\n');

    updateJobMutation.mutate({
      id,
      data: { 
        status: newStatus, 
        notes,
        updatedAt: now as any
      }
    });
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header title="Auftrag Details" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Lade Auftrag...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header title="Auftrag nicht gefunden" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Auftrag nicht gefunden</h2>
              <p className="text-gray-500 mb-4">Der angeforderte Auftrag existiert nicht oder wurde gelöscht.</p>
              <Button onClick={() => navigate('/jobs')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zu Aufträgen
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const property = properties.find(p => p.id === job.propertyId);
  const assignedEmployee = employees.find(e => e.id === job.assignedTo);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Auftrag Details" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/jobs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu Aufträgen
            </Button>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={updateJobMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateJobMutation.isPending}
                  >
                    {updateJobMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {isEditing ? (
                        <Input
                          value={editedJob.title || job.title}
                          onChange={(e) => setEditedJob({...editedJob, title: e.target.value})}
                          className="text-xl font-semibold"
                        />
                      ) : (
                        job.title
                      )}
                    </CardTitle>
                    <StatusBadge status={job.status as JobStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Beschreibung</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedJob.description || job.description}
                        onChange={(e) => setEditedJob({...editedJob, description: e.target.value})}
                        className="mt-1"
                        rows={4}
                      />
                    ) : (
                      <p className="mt-1 text-gray-700">{job.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Liegenschaft</Label>
                      {isEditing ? (
                        <Select
                          value={editedJob.propertyId || job.propertyId}
                          onValueChange={(value) => setEditedJob({...editedJob, propertyId: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((prop) => (
                              <SelectItem key={prop.id} value={prop.id!}>
                                {prop.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 flex items-center text-gray-700">
                          <Building className="mr-2 h-4 w-4" />
                          {property?.name || 'Unbekannte Liegenschaft'}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Zugewiesen an</Label>
                      {isEditing ? (
                        <Select
                          value={editedJob.assignedTo || job.assignedTo || ''}
                          onValueChange={(value) => setEditedJob({...editedJob, assignedTo: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Mitarbeiter auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id!}>
                                {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 flex items-center text-gray-700">
                          <User className="mr-2 h-4 w-4" />
                          {assignedEmployee?.name || 'Nicht zugewiesen'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      {isEditing ? (
                        <Select
                          value={editedJob.status || job.status}
                          onValueChange={(value: FirestoreJob['status']) => setEditedJob({...editedJob, status: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Ausstehend</SelectItem>
                            <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                            <SelectItem value="completed">Abgeschlossen</SelectItem>
                            <SelectItem value="cancelled">Storniert</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <StatusBadge status={job.status as JobStatus} />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Priorität</Label>
                      {isEditing ? (
                        <Select
                          value={editedJob.priority || job.priority}
                          onValueChange={(value: FirestoreJob['priority']) => setEditedJob({...editedJob, priority: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 text-gray-700 capitalize">{job.priority}</div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Kategorie</Label>
                      {isEditing ? (
                        <Select
                          value={editedJob.category || job.category}
                          onValueChange={(value: FirestoreJob['category']) => setEditedJob({...editedJob, category: value})}
                        >
                          <SelectTrigger className="mt-1">
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
                      ) : (
                        <div className="mt-1 text-gray-700 capitalize">{job.category}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Fälligkeitsdatum</Label>
                      {isEditing ? (
                        <Input
                          type="datetime-local"
                          value={editedJob.dueDate || job.dueDate || ''}
                          onChange={(e) => setEditedJob({...editedJob, dueDate: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center text-gray-700">
                          <Calendar className="mr-2 h-4 w-4" />
                          {job.dueDate ? 
                            new Date(job.dueDate).toLocaleDateString('de-DE') : 
                            'Kein Fälligkeitsdatum'
                          }
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Geschätzte Stunden</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedJob.estimatedHours || job.estimatedHours || ''}
                          onChange={(e) => setEditedJob({...editedJob, estimatedHours: parseFloat(e.target.value) || undefined})}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center text-gray-700">
                          <Clock className="mr-2 h-4 w-4" />
                          {job.estimatedHours ? `${job.estimatedHours}h` : 'Nicht angegeben'}
                        </div>
                      )}
                    </div>
                  </div>

                  {job.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Notizen</Label>
                      {isEditing ? (
                        <Textarea
                          value={editedJob.notes || job.notes}
                          onChange={(e) => setEditedJob({...editedJob, notes: e.target.value})}
                          className="mt-1"
                          rows={3}
                        />
                      ) : (
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{job.notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Erstellt</Label>
                    <div className="mt-1 flex items-center text-gray-700">
                      <Calendar className="mr-2 h-4 w-4" />
                      {job.createdAt ? 
                        formatDistanceToNow(
                          job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt),
                          { addSuffix: true, locale: de }
                        ) : 
                        'Unbekannt'
                      }
                    </div>
                  </div>

                  {job.updatedAt && job.updatedAt !== job.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Zuletzt aktualisiert</Label>
                      <div className="mt-1 flex items-center text-gray-700">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDistanceToNow(
                          job.updatedAt.toDate ? job.updatedAt.toDate() : new Date(job.updatedAt),
                          { addSuffix: true, locale: de }
                        )}
                      </div>
                    </div>
                  )}

                  {job.actualHours && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tatsächliche Stunden</Label>
                      <div className="mt-1 flex items-center text-gray-700">
                        <Clock className="mr-2 h-4 w-4" />
                        {job.actualHours}h
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!isEditing && (
                <Card>
                  <CardHeader>
                    <CardTitle>Aktionen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleStatusChange('in-progress')}
                      disabled={job.status === 'in-progress'}
                    >
                      Als "In Bearbeitung" markieren
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleStatusChange('completed')}
                      disabled={job.status === 'completed'}
                    >
                      Als "Abgeschlossen" markieren
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={job.status === 'cancelled'}
                    >
                      Als "Storniert" markieren
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobDetails;
