
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockProperties } from '@/mock-data';
import { Property } from '@/types';
import PropertyCard from '@/components/PropertyCard';
import PropertySearchBar from '@/components/PropertySearchBar';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const Properties = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    type: '',
  });
  
  const navigate = useNavigate();
  
  // Filter properties based on search
  const filteredProperties = searchQuery 
    ? properties.filter(
        property => 
          property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties;
  
  // Handle form submission for new property
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPropertyWithId: Property = {
      ...newProperty as Property,
      id: `property-${Date.now()}`,
      size: 0,
      owner: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProperties([newPropertyWithId, ...properties]);
    setDialogOpen(false);
    setNewProperty({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      type: '',
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
          
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Keine Liegenschaften gefunden.</p>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Liegenschaft hinzufügen</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                value={newProperty.name}
                onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                placeholder="z.B. Apartment-Komplex Nord"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input 
                id="address"
                value={newProperty.address}
                onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                placeholder="Straße und Hausnummer"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postleitzahl</Label>
                <Input 
                  id="postalCode"
                  value={newProperty.postalCode}
                  onChange={(e) => setNewProperty({...newProperty, postalCode: e.target.value})}
                  placeholder="PLZ"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input 
                  id="city"
                  value={newProperty.city}
                  onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                  placeholder="Stadt"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Input 
                id="type"
                value={newProperty.type}
                onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                placeholder="z.B. Wohnkomplex, Bürogebäude, etc."
                required
              />
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

export default Properties;
