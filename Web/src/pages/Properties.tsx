import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Property } from '@/lib/firestore';
import PropertyCard from '@/components/PropertyCard';
import PropertySearchBar from '@/components/PropertySearchBar';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { propertiesService } from '@/lib/firestore';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { toast } from 'sonner';

const Properties = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    name: '',
    address: '',
    type: '',
    status: 'active',
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch properties using React Query
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesService.getAll,
  });

  // Create new property mutation
  const createPropertyMutation = useMutation({
    mutationFn: propertiesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setDialogOpen(false);
      setNewProperty({
        name: '',
        address: '',
        type: '',
        status: 'active',
      });
      toast.success('Liegenschaft erfolgreich erstellt');
    },
    onError: (error) => {
      console.error('Error creating property:', error);
      toast.error('Fehler beim Erstellen der Liegenschaft');
    },
  });

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

    createPropertyMutation.mutate({
      name: newProperty.name,
      address: newProperty.address,
      type: newProperty.type,
      status: newProperty.status || 'active',
      description: newProperty.description || '',
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
          
          {isLoading ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
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
                disabled={createPropertyMutation.isPending}
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
                disabled={createPropertyMutation.isPending}
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
                disabled={createPropertyMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={newProperty.description || ''}
                onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                placeholder="Optionale Beschreibung"
                disabled={createPropertyMutation.isPending}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={createPropertyMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending && (
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
