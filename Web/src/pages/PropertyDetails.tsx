import React, { useState } from 'react';
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
import { Property } from '@/types';
import { ArrowLeft, Edit, Save, X, Building, Calendar, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { propertiesService, jobsService, type Property as FirestoreProperty, type Job as FirestoreJob } from '@/lib/firestore';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/StatusBadge';

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState<Partial<FirestoreProperty>>({});

  // Fetch property details
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesService.getById(id!),
    enabled: !!id,
  });

  // Fetch related jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsService.getAll,
  });

  const loading = propertyLoading || jobsLoading;

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreProperty> }) => 
      propertiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setIsEditing(false);
      toast.success('Liegenschaft erfolgreich aktualisiert');
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error('Fehler beim Aktualisieren der Liegenschaft');
    },
  });

  // Handle save
  const handleSave = async () => {
    if (!id) return;
    
    updatePropertyMutation.mutate({
      id,
      data: editedProperty
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header title="Liegenschaft Details" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Lade Liegenschaft...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header title="Liegenschaft nicht gefunden" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Liegenschaft nicht gefunden</h2>
              <p className="text-gray-500 mb-4">Die angeforderte Liegenschaft existiert nicht oder wurde gelöscht.</p>
              <Button onClick={() => navigate('/properties')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zu Liegenschaften
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Filter jobs for this property
  const propertyJobs = jobs.filter(job => job.propertyId === property.id);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Liegenschaft Details" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/properties')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu Liegenschaften
            </Button>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={updatePropertyMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updatePropertyMutation.isPending}
                  >
                    {updatePropertyMutation.isPending && (
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
                          value={editedProperty.name || property.name}
                          onChange={(e) => setEditedProperty({...editedProperty, name: e.target.value})}
                          className="text-xl font-semibold"
                        />
                      ) : (
                        property.name
                      )}
                    </CardTitle>
                    <StatusBadge status={property.status as any} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Adresse</Label>
                    {isEditing ? (
                      <Input
                        value={editedProperty.address || property.address}
                        onChange={(e) => setEditedProperty({...editedProperty, address: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 flex items-center text-gray-700">
                        <MapPin className="mr-2 h-4 w-4" />
                        {property.address}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Typ</Label>
                      {isEditing ? (
                        <Input
                          value={editedProperty.type || property.type}
                          onChange={(e) => setEditedProperty({...editedProperty, type: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center text-gray-700">
                          <Building className="mr-2 h-4 w-4" />
                          {property.type}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      {isEditing ? (
                        <Select
                          value={editedProperty.status || property.status}
                          onValueChange={(value: FirestoreProperty['status']) => setEditedProperty({...editedProperty, status: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="inactive">Inaktiv</SelectItem>
                            <SelectItem value="maintenance">Wartung</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">
                          <StatusBadge status={property.status as any} />
                        </div>
                      )}
                    </div>
                  </div>

                  {property.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Beschreibung</Label>
                      {isEditing ? (
                        <Textarea
                          value={editedProperty.description || property.description}
                          onChange={(e) => setEditedProperty({...editedProperty, description: e.target.value})}
                          className="mt-1"
                          rows={3}
                        />
                      ) : (
                        <p className="mt-1 text-gray-700">{property.description}</p>
                      )}
                    </div>
                  )}

                  {property.owner && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Eigentümer</Label>
                      {isEditing ? (
                        <Input
                          value={editedProperty.owner || property.owner}
                          onChange={(e) => setEditedProperty({...editedProperty, owner: e.target.value})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-gray-700">{property.owner}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Jobs for this property */}
              <Card>
                <CardHeader>
                  <CardTitle>Aufträge für diese Liegenschaft</CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyJobs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Keine Aufträge für diese Liegenschaft vorhanden.</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyJobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-500">
                              {job.createdAt ? 
                                formatDistanceToNow(
                                  job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt),
                                  { addSuffix: true, locale: de }
                                ) : 
                                'Unbekannt'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={job.status as any} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                      {propertyJobs.length > 5 && (
                        <div className="text-center pt-2">
                          <Button variant="outline" onClick={() => navigate('/jobs')}>
                            Alle {propertyJobs.length} Aufträge anzeigen
                          </Button>
                        </div>
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
                      {property.createdAt ? 
                        formatDistanceToNow(
                          property.createdAt.toDate ? property.createdAt.toDate() : new Date(property.createdAt),
                          { addSuffix: true, locale: de }
                        ) : 
                        'Unbekannt'
                      }
                    </div>
                  </div>

                  {property.updatedAt && property.updatedAt !== property.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Zuletzt aktualisiert</Label>
                      <div className="mt-1 flex items-center text-gray-700">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDistanceToNow(
                          property.updatedAt.toDate ? property.updatedAt.toDate() : new Date(property.updatedAt),
                          { addSuffix: true, locale: de }
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Anzahl Aufträge</Label>
                    <div className="mt-1 flex items-center text-gray-700">
                      <Building className="mr-2 h-4 w-4" />
                      {propertyJobs.length} Auftrag{propertyJobs.length !== 1 ? 'e' : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aktionen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/jobs', { state: { propertyId: property.id } })}
                  >
                    Auftrag für diese Liegenschaft erstellen
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/jobs')}
                  >
                    Alle Aufträge anzeigen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PropertyDetails;
