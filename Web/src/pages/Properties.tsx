import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Property } from '@/lib/firestore';
import PropertySearchBar from '@/components/PropertySearchBar';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Building, Euro } from 'lucide-react';
import { propertiesService } from '@/lib/firestore';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

const Properties = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    name: '',
    address: '',
    type: '',
    status: 'active',
    monthlyIncome: 0,
  });

  const navigate = useNavigate();
  const { currentUser, appUser, loading: authLoading } = useAuth();

  // Real-time data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    // Only subscribe if user is authenticated
    if (!currentUser || authLoading) {
      setLoading(true);
      return;
    }

    console.log('Setting up properties subscription for user:', currentUser.uid);
    setLoading(true);
    
    // Subscribe to real-time updates with error handling
    const unsubscribeProperties = propertiesService.subscribeToAll((propertiesData) => {
      console.log('Properties subscription received data:', propertiesData.length, 'properties');
      console.log('Properties data:', propertiesData);
      setProperties(propertiesData);
      setLoading(false);
      setSubscriptionActive(true);
    }, (error) => {
      console.error('Error in properties subscription:', error);
      setSubscriptionActive(false);
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for properties collection');
        toast.error('Keine Berechtigung für Liegenschaften');
      } else {
        toast.error('Fehler beim Laden der Liegenschaften');
      }
      setLoading(false);
    });

    // Store the unsubscribe function
    subscriptionRef.current = unsubscribeProperties;

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up properties subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [currentUser?.uid, authLoading]); // Only depend on user ID, not the entire user object

  // Create new property function
  const createProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsCreating(true);
      const propertyId = await propertiesService.create(propertyData);
      console.log('Property created with ID:', propertyId);
      
      // Manually refresh the properties list to ensure immediate update
      const updatedProperties = await propertiesService.getAll();
      setProperties(updatedProperties);
      console.log('Properties refreshed after creation:', updatedProperties.length, 'properties');
      
      setDialogOpen(false);
      setNewProperty({
        name: '',
        address: '',
        type: '',
        status: 'active',
        monthlyIncome: 0,
      });
      toast.success('Liegenschaft erfolgreich erstellt');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Fehler beim Erstellen der Liegenschaft');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter properties based on search
  const filteredProperties = searchQuery
    ? properties.filter(
        property =>
          property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties;

  // Handle form submission for new property
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProperty.name || !newProperty.address || !newProperty.type) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    await createProperty({
      name: newProperty.name,
      address: newProperty.address,
      type: newProperty.type,
      status: newProperty.status || 'active',
      monthlyIncome: newProperty.monthlyIncome || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Liegenschaften" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <PropertySearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddProperty={() => setDialogOpen(true)}
            />
          </div>
          
          {authLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              Authentifizierung...
            </div>
          ) : !currentUser ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Bitte melden Sie sich an, um Liegenschaften zu verwalten.</p>
              <Button onClick={() => navigate('/login')}>
                Anmelden
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              Lade Liegenschaften...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Keine Liegenschaften gefunden.' : 'Keine Liegenschaften vorhanden.'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Liegenschaft hinzufügen
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Liegenschaft
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adresse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monatliche Einnahmen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProperties.map((property) => (
                      <tr 
                        key={property.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {property.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : property.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.status === 'active' ? 'Aktiv' : 
                             property.status === 'inactive' ? 'Inaktiv' : 'Wartung'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {property.monthlyIncome && property.monthlyIncome > 0 ? (
                            <div className="flex items-center text-sm text-green-600 font-medium">
                              <Euro className="h-4 w-4 mr-1" />
                              {property.monthlyIncome.toLocaleString('de-DE', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Nicht angegeben</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/properties/${property.id}`);
                            }}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Dialog to add a new property */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      >
        <DialogContent
          onInteractOutside={event => {
            // Prevent dialog from closing if click is inside Google dropdown
            const target = event.target;
            if (target instanceof HTMLElement && target.closest('.pac-container')) {
              event.preventDefault();
            }
            // Also prevent closing if click is on loading spinner or error message
            if (target instanceof HTMLElement && target.closest('.animate-spin')) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Neue Liegenschaft hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newProperty.name}
                onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                placeholder="z.B. Apartment-Komplex Nord"
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <AddressAutocomplete
                id="address"
                value={newProperty.address || ''}
                onChange={(value, placeDetails) => {
                  setNewProperty({
                    ...newProperty,
                    address: value,
                  });
                  
                  // Optional: Store additional place details if needed
                  if (placeDetails) {
                    console.log('Selected place details:', placeDetails);
                  }
                }}
                placeholder="Straße und Hausnummer eingeben..."
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Typ *</Label>
              <Input
                id="type"
                value={newProperty.type}
                onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                placeholder="z.B. Wohnkomplex, Bürogebäude, etc."
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monatliche Einnahmen (€)</Label>
              <Input
                id="monthlyIncome"
                type="number"
                min="0"
                step="0.01"
                value={newProperty.monthlyIncome || ''}
                onChange={(e) => setNewProperty({...newProperty, monthlyIncome: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                disabled={isCreating}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={isCreating}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;
