
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockJobs, mockProperties } from '@/mock-data';
import { Job, JobStatus, statusNameMap } from '@/types';
import { ArrowLeft, Building, Calendar, Edit, MessageSquarePlus, Save, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // New state for notes
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [jobNotes, setJobNotes] = useState<{id: string, text: string, createdAt: Date}[]>([]);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  
  const properties = mockProperties;
  
  // Find the job based on the ID from the URL
  useEffect(() => {
    const foundJob = mockJobs.find(j => j.id === id);
    if (foundJob) {
      setJob(foundJob);
      setEditedJob({ ...foundJob });
      
      // Initialize with some example notes if needed
      if (foundJob.id === "job-1") {
        setJobNotes([
          { 
            id: 'note-1', 
            text: 'Hausmeister kontaktiert, kommt am Freitag vorbei.', 
            createdAt: new Date(2025, 4, 5)  // May 5, 2025
          },
          { 
            id: 'note-2', 
            text: 'Material bestellt, Lieferung in 3 Tagen.', 
            createdAt: new Date(2025, 4, 7)  // May 7, 2025
          }
        ]);
      }
    }
  }, [id]);
  
  // Find the associated property for this job
  const property = job ? properties.find(p => p.id === job.propertyId) : null;
  
  // Handle save changes
  const handleSaveChanges = () => {
    if (editedJob) {
      setJob(editedJob);
      setEditMode(false);
      toast({
        title: "Änderungen gespeichert",
        description: "Die Änderungen am Auftrag wurden erfolgreich gespeichert.",
      });
    }
  };
  
  // Handle delete job
  const handleDeleteJob = () => {
    setDeleteDialogOpen(false);
    toast({
      title: "Auftrag gelöscht",
      description: "Der Auftrag wurde erfolgreich gelöscht.",
      variant: "destructive",
    });
    navigate('/jobs');
  };
  
  // Handle add note
  const handleAddNote = () => {
    if (noteText.trim().length > 0) {
      const newNote = {
        id: `note-${Date.now()}`,
        text: noteText,
        createdAt: new Date()
      };
      
      setJobNotes(prev => [newNote, ...prev]);
      setNoteText('');
      setIsAddingNote(false);
      
      toast({
        title: "Notiz hinzugefügt",
        description: "Die Notiz wurde erfolgreich hinzugefügt.",
      });
    }
  };
  
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <Header title="Auftrag nicht gefunden" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Auftrag nicht gefunden</h2>
            <p className="mb-6">Der gesuchte Auftrag konnte nicht gefunden werden.</p>
            <Button onClick={() => navigate('/jobs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Auftragsübersicht
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header 
          title={editMode ? "Auftrag bearbeiten" : `Auftrag: ${job.title}`} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Back button */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Auftragsübersicht
            </Button>
          </div>
          
          {/* Action buttons */}
          <div className="mb-6 flex justify-between">
            <div>
              <StatusBadge status={job.status} className="text-sm" />
            </div>
            <div className="space-x-2">
              {!editMode ? (
                <>
                  <Button onClick={() => setEditMode(true)} variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </Button>
                  <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditMode(false)} variant="outline">
                    Abbrechen
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Auftrags Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input 
                      id="title" 
                      value={editedJob?.title} 
                      onChange={(e) => editedJob && setEditedJob({ ...editedJob, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea 
                      id="description" 
                      value={editedJob?.description} 
                      onChange={(e) => editedJob && setEditedJob({ ...editedJob, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={editedJob?.status}
                        onValueChange={(value) => editedJob && setEditedJob({ ...editedJob, status: value as JobStatus })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Neu</SelectItem>
                          <SelectItem value="inprogress">In Bearbeitung</SelectItem>
                          <SelectItem value="completed">Abgeschlossen</SelectItem>
                          <SelectItem value="onhold">Pausiert</SelectItem>
                          <SelectItem value="canceled">Storniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priorität</Label>
                      <Select 
                        value={editedJob?.priority}
                        onValueChange={(value) => editedJob && setEditedJob({ 
                          ...editedJob, 
                          priority: value as 'low' | 'medium' | 'high' 
                        })}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Niedrig</SelectItem>
                          <SelectItem value="medium">Mittel</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="property">Liegenschaft</Label>
                      <Select 
                        value={editedJob?.propertyId}
                        onValueChange={(value) => editedJob && setEditedJob({ ...editedJob, propertyId: value })}
                      >
                        <SelectTrigger id="property">
                          <SelectValue placeholder="Liegenschaft auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Zugewiesen an</Label>
                      <Input 
                        id="assignedTo" 
                        value={editedJob?.assignedTo || ''} 
                        onChange={(e) => editedJob && setEditedJob({ ...editedJob, assignedTo: e.target.value || null })}
                        placeholder="Name des Verantwortlichen"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notizen</Label>
                    <Textarea 
                      id="notes" 
                      value={editedJob?.notes} 
                      onChange={(e) => editedJob && setEditedJob({ ...editedJob, notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{job.title}</h3>
                    <p className="text-gray-700 mb-4">{job.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <dl className="space-y-2">
                          <div className="flex justify-between border-b pb-2">
                            <dt className="font-medium text-gray-500">Status</dt>
                            <dd><StatusBadge status={job.status} /></dd>
                          </div>
                          
                          <div className="flex justify-between border-b pb-2">
                            <dt className="font-medium text-gray-500">Priorität</dt>
                            <dd className="capitalize">
                              {job.priority === 'low' && 'Niedrig'}
                              {job.priority === 'medium' && 'Mittel'}
                              {job.priority === 'high' && 'Hoch'}
                            </dd>
                          </div>
                          
                          <div className="flex justify-between border-b pb-2">
                            <dt className="font-medium text-gray-500">Liegenschaft</dt>
                            <dd className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {property?.name || 'Unbekannte Liegenschaft'}
                            </dd>
                          </div>
                          
                          <div className="flex justify-between border-b pb-2">
                            <dt className="font-medium text-gray-500">Erstellt am</dt>
                            <dd className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </dd>
                          </div>
                          
                          {job.dueDate && (
                            <div className="flex justify-between border-b pb-2">
                              <dt className="font-medium text-gray-500">Fällig bis</dt>
                              <dd>{new Date(job.dueDate).toLocaleDateString()}</dd>
                            </div>
                          )}
                          
                          {job.completedAt && (
                            <div className="flex justify-between border-b pb-2">
                              <dt className="font-medium text-gray-500">Abgeschlossen am</dt>
                              <dd>{new Date(job.completedAt).toLocaleDateString()}</dd>
                            </div>
                          )}
                          
                          {job.assignedTo && (
                            <div className="flex justify-between border-b pb-2">
                              <dt className="font-medium text-gray-500">Zugewiesen an</dt>
                              <dd>{job.assignedTo}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Notizen</h4>
                        <div className="bg-gray-50 p-3 rounded-md">
                          {job.notes || <span className="text-gray-500 italic">Keine Notizen vorhanden</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Notes Section */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <div className="flex items-center justify-between">
                  <CardTitle>Notizen</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <span className="sr-only">Toggle</span>
                      {isNotesOpen ? 
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                          <path d="M4 6L7.5 9.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                       : 
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                          <path d="M11 9L7.5 5.5L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      }
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {!isAddingNote ? (
                      <Button 
                        onClick={() => setIsAddingNote(true)} 
                        variant="outline" 
                        className="mb-4 w-full"
                      >
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        Neue Notiz hinzufügen
                      </Button>
                    ) : (
                      <div className="mb-4 space-y-2">
                        <Textarea 
                          placeholder="Notiz eingeben..." 
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setIsAddingNote(false);
                              setNoteText('');
                            }}
                          >
                            Abbrechen
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleAddNote}
                          >
                            Speichern
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {jobNotes.length > 0 ? (
                      <div className="space-y-4">
                        {jobNotes.map((note) => (
                          <div key={note.id} className="bg-gray-50 p-4 rounded-md border">
                            <p className="text-sm text-gray-700">{note.text}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {note.createdAt.toLocaleDateString()} um {note.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        <p>Noch keine Notizen vorhanden</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
          
          {/* Additional sections could be added here */}
        </main>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag löschen</DialogTitle>
          </DialogHeader>
          <p>Sind Sie sicher, dass Sie diesen Auftrag löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob}>
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
