
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockJobs, mockProperties } from '@/mock-data';
import { Job, JobStatus } from '@/types';
import { Plus, Calendar, Search, ListTodo, Building } from 'lucide-react';

const Jobs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    description: '',
    propertyId: '',
    status: 'new',
    priority: 'medium',
  });
  
  const navigate = useNavigate();
  const properties = mockProperties;
  
  // Filter jobs based on search and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle form submission for new job
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newJobWithId: Job = {
      ...newJob as Job,
      id: `job-${Date.now()}`,
      createdAt: new Date(),
      dueDate: null,
      completedAt: null,
      assignedTo: null,
      notes: '',
    };
    
    setJobs([newJobWithId, ...jobs]);
    setDialogOpen(false);
    setNewJob({
      title: '',
      description: '',
      propertyId: '',
      status: 'new',
      priority: 'medium',
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Aufträge" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex flex-col md:flex-row gap-2">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Auftrag suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status filter */}
            <div className="w-full md:w-48">
              <Select 
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as JobStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="inprogress">In Bearbeitung</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="onhold">Pausiert</SelectItem>
                  <SelectItem value="canceled">Storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Add button */}
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Auftrag
            </Button>
          </div>
          
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ListTodo className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-gray-500 mb-4">Keine Aufträge gefunden.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Auftrag erstellen
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {filteredJobs.map((job) => {
                    // Find associated property
                    const property = properties.find(p => p.id === job.propertyId);
                    
                    return (
                      <li 
                        key={job.id} 
                        className="p-4 hover:bg-gray-50 cursor-pointer" 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {job.description.substring(0, 100)}
                              {job.description.length > 100 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span className="flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {property?.name || 'Unbekannte Liegenschaft'}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      {/* Dialog to add a new job */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuen Auftrag erstellen</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input 
                id="title"
                value={newJob.title}
                onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                placeholder="Titel des Auftrags"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea 
                id="description"
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                placeholder="Beschreibung des Auftrags"
                required
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="property">Liegenschaft</Label>
              <Select 
                value={newJob.propertyId}
                onValueChange={(value) => setNewJob({...newJob, propertyId: value})}
                required
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newJob.status}
                  onValueChange={(value) => setNewJob({...newJob, status: value as JobStatus})}
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
                  value={newJob.priority}
                  onValueChange={(value) => setNewJob({...newJob, priority: value as 'low' | 'medium' | 'high'})}
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
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
