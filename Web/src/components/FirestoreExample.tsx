import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { jobsService } from '@/lib/firestore';
import { toast } from 'sonner';

interface Item {
  id?: string;
  name: string;
  description: string;
  createdAt?: any;
  updatedAt?: any;
}

const FirestoreExample = () => {
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const queryClient = useQueryClient();

  // Fetch items using React Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      // Using jobs as example since we don't have a generic items service
      const data = await jobsService.getAll();
      return data as any[];
    },
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (item: Omit<Item, 'id'>) => {
      // Using jobs service as example
      return await jobsService.create({
        title: item.name,
        description: item.description,
        propertyId: 'example',
        status: 'pending',
        priority: 'medium',
        category: 'other',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setNewItem({ name: '', description: '' });
      toast.success('Item erfolgreich erstellt');
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      toast.error('Fehler beim Erstellen des Items');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Item> }) => {
      // Using jobs service as example
      return await jobsService.update(id, {
        title: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setEditingItem(null);
      toast.success('Item erfolgreich aktualisiert');
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error('Fehler beim Aktualisieren des Items');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      // Using jobs service as example
      return await jobsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error('Fehler beim Löschen des Items');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.description) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    createItemMutation.mutate({
      name: newItem.name,
      description: newItem.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.id) return;

    updateItemMutation.mutate({
      id: editingItem.id,
      data: {
        name: editingItem.name,
        description: editingItem.description,
        updatedAt: new Date(),
      },
    });
  };

  const handleDelete = async (id: string) => {
    deleteItemMutation.mutate(id);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Firestore Beispiel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new item form */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Neues Item hinzufügen</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item Name"
                  disabled={createItemMutation.isPending}
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item Beschreibung"
                  disabled={createItemMutation.isPending}
                />
              </div>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Plus className="mr-2 h-4 w-4" />
                Hinzufügen
              </Button>
            </form>
          </div>

          {/* Items list */}
          <div>
            <h3 className="text-lg font-medium mb-4">Items Liste</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Lade Items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Keine Items vorhanden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    {editingItem?.id === item.id ? (
                      <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                          <Label htmlFor={`edit-name-${item.id}`}>Name</Label>
                          <Input
                            id={`edit-name-${item.id}`}
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            disabled={updateItemMutation.isPending}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-description-${item.id}`}>Beschreibung</Label>
                          <Input
                            id={`edit-description-${item.id}`}
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            disabled={updateItemMutation.isPending}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={updateItemMutation.isPending}>
                            {updateItemMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Save className="mr-2 h-4 w-4" />
                            Speichern
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            disabled={updateItemMutation.isPending}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Abbrechen
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-gray-600">{item.description}</p>
                            {item.createdAt && (
                              <p className="text-sm text-gray-500 mt-2">
                                Erstellt: {item.createdAt.toDate ? item.createdAt.toDate().toLocaleString() : new Date(item.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id!)}
                              disabled={deleteItemMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirestoreExample; 