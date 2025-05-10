
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockProperties, mockJobs } from '@/mock-data';
import { Property, Job } from '@/types';
import { Building, Calendar, ListTodo, Save, Trash2, Edit, ArrowLeft, Plus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Find the property in the mock data
  const propertyData = mockProperties.find(p => p.id === id);
  
  // If property doesn't exist, show error
  if (!propertyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Liegenschaft nicht gefunden</h2>
          <p className="mb-4 text-gray-500">Die gesuchte Liegenschaft konnte nicht gefunden werden.</p>
          <Button onClick={() => navigate('/properties')}>Zurück zur Übersicht</Button>
        </div>
      </div>
    );
  }
  
  // State for editing property details
  const [property, setProperty] = useState<Property>(propertyData);
  
  // Get jobs for this property
  const propertyJobs = mockJobs.filter(job => job.propertyId === id);
  
  // Handle saving property changes
  const handleSaveChanges = () => {
    // In a real app, you would save the changes to your backend
    toast({
      title: "Änderungen gespeichert",
      description: "Die Änderungen wurden erfolgreich gespeichert.",
    });
    setEditing(false);
  };
  
  // Handle property deletion
  const handleDeleteProperty = () => {
    // In a real app, you would delete the property from your backend
    toast({
      title: "Liegenschaft gelöscht",
      description: "Die Liegenschaft wurde erfolgreich gelöscht.",
    });
    navigate('/properties');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Liegenschaftsdetails" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => navigate('/properties')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{property.name}</h1>
              <p className="text-gray-500">{property.address}, {property.postalCode} {property.city}</p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <Button onClick={handleSaveChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProperty}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="details">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="jobs">Aufträge ({propertyJobs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2" />
                    Liegenschaftsdaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {editing ? (
                    // Editable form
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          value={property.name} 
                          onChange={(e) => setProperty({...property, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="type">Typ</Label>
                        <Input 
                          id="type" 
                          value={property.type} 
                          onChange={(e) => setProperty({...property, type: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input 
                          id="address" 
                          value={property.address} 
                          onChange={(e) => setProperty({...property, address: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">PLZ</Label>
                          <Input 
                            id="postalCode" 
                            value={property.postalCode} 
                            onChange={(e) => setProperty({...property, postalCode: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="city">Stadt</Label>
                          <Input 
                            id="city" 
                            value={property.city} 
                            onChange={(e) => setProperty({...property, city: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="size">Größe (m²)</Label>
                        <Input 
                          id="size" 
                          type="number" 
                          value={property.size} 
                          onChange={(e) => setProperty({...property, size: Number(e.target.value)})}
                        />
                      </div>
                    </>
                  ) : (
                    // Read-only view
                    <>
                      <div>
                        <Label>Name</Label>
                        <p className="mt-1">{property.name}</p>
                      </div>
                      
                      <div>
                        <Label>Typ</Label>
                        <p className="mt-1">{property.type}</p>
                      </div>
                      
                      <div>
                        <Label>Adresse</Label>
                        <p className="mt-1">{property.address}</p>
                      </div>
                      
                      <div className="flex gap-4">
                        <div>
                          <Label>PLZ</Label>
                          <p className="mt-1">{property.postalCode}</p>
                        </div>
                        
                        <div>
                          <Label>Stadt</Label>
                          <p className="mt-1">{property.city}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Größe</Label>
                        <p className="mt-1">{property.size} m²</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Kontaktdaten</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {editing ? (
                    // Editable form
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="owner">Eigentümer</Label>
                        <Input 
                          id="owner" 
                          value={property.owner} 
                          onChange={(e) => setProperty({...property, owner: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Telefon</Label>
                        <Input 
                          id="contactPhone" 
                          value={property.contactPhone} 
                          onChange={(e) => setProperty({...property, contactPhone: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">E-Mail</Label>
                        <Input 
                          id="contactEmail" 
                          value={property.contactEmail} 
                          onChange={(e) => setProperty({...property, contactEmail: e.target.value})}
                        />
                      </div>
                    </>
                  ) : (
                    // Read-only view
                    <>
                      <div>
                        <Label>Eigentümer</Label>
                        <p className="mt-1">{property.owner || "-"}</p>
                      </div>
                      
                      <div>
                        <Label>Telefon</Label>
                        <p className="mt-1">{property.contactPhone || "-"}</p>
                      </div>
                      
                      <div>
                        <Label>E-Mail</Label>
                        <p className="mt-1">{property.contactEmail || "-"}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Notizen</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea 
                      value={property.notes} 
                      onChange={(e) => setProperty({...property, notes: e.target.value})}
                      rows={5}
                      placeholder="Notizen zur Liegenschaft hinzufügen..."
                    />
                  ) : (
                    <p className="text-gray-700">{property.notes || "Keine Notizen vorhanden."}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="jobs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Aufträge für diese Liegenschaft</h2>
                
                <Button onClick={() => navigate(`/jobs/new?propertyId=${id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Auftrag erstellen
                </Button>
              </div>
              
              {propertyJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-gray-500 mb-4">Es sind noch keine Aufträge für diese Liegenschaft vorhanden.</p>
                    <Button onClick={() => navigate(`/jobs/new?propertyId=${id}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Auftrag erstellen
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-gray-200">
                      {propertyJobs.map((job) => (
                        <li 
                          key={job.id} 
                          className="p-4 hover:bg-gray-50 cursor-pointer" 
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{job.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{job.description.substring(0, 100)}{job.description.length > 100 ? '...' : ''}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                Erstellt am {new Date(job.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <StatusBadge status={job.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default PropertyDetails;
