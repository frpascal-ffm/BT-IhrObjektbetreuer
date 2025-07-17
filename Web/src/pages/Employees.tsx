import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee } from '@/types';
import { Plus, Search, User, Mail, Phone, Loader2, Edit, Save, X, Trash2, RefreshCw } from 'lucide-react';
import { employeesService, propertiesService, jobsService, type Employee as FirestoreEmployee, generatePassword, debugEmployeeStatus } from '@/lib/firestore';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Employees = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<FirestoreEmployee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<FirestoreEmployee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState<Partial<FirestoreEmployee>>({
    name: '',
    email: '',
    role: 'technician',
    status: 'active',
    password: '',
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch data using React Query
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesService.getAll,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesService.getAll,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsService.getAll,
  });

  const loading = employeesLoading;

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: employeesService.create,
    onSuccess: (employeeId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDialogOpen(false);
      setNewEmployee({
        name: '',
        email: '',
        role: 'technician',
        status: 'active',
        password: '',
      });
      
      // Zeige das generierte Passwort an
      const password = variables.password;
      if (password) {
        toast.success(
          <div>
            <p>Mitarbeiter erfolgreich erstellt</p>
            <p className="text-sm mt-1">Firebase Auth Passwort: <strong>{password}</strong></p>
            <p className="text-xs mt-1 text-gray-500">Bitte notieren Sie sich dieses Passwort für die mobile App!</p>
            <p className="text-xs mt-1 text-gray-500">Das Passwort wird nicht in der Datenbank gespeichert.</p>
          </div>,
          { duration: 15000 }
        );
      } else {
        toast.success('Mitarbeiter erfolgreich erstellt');
      }
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Diese E-Mail-Adresse wird bereits verwendet');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Das Passwort ist zu schwach');
      } else {
        toast.error('Fehler beim Erstellen des Mitarbeiters');
      }
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FirestoreEmployee> }) => 
      employeesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: employeesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      toast.success('Mitarbeiter erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
      toast.error('Fehler beim Löschen des Mitarbeiters');
    },
  });

  // Filter employees based on search
  const filteredEmployees = searchQuery
    ? employees.filter(
        employee =>
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employees;

  // Handle form submission for new employee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmployee.name || !newEmployee.email) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Generiere ein Passwort falls keines angegeben wurde
    const password = newEmployee.password || generatePassword();

    createEmployeeMutation.mutate({
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role || 'technician',
      status: newEmployee.status || 'active',
      phone: newEmployee.phone || '',
      password: password, // This will be used to create Firebase Auth user
    });
  };

  // Handle edit employee
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEmployee || !editingEmployee.name || !editingEmployee.email) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    updateEmployeeMutation.mutate({
      id: editingEmployee.id!,
      data: {
        name: editingEmployee.name,
        email: editingEmployee.email,
        role: editingEmployee.role,
        status: editingEmployee.status,
        phone: editingEmployee.phone || '',
        // Note: Password changes require Firebase Admin SDK
        // For now, employees need to use password reset functionality
      }
    });
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    deleteEmployeeMutation.mutate(employeeToDelete.id!);
  };

  // Debug function to test employee authentication
  const handleDebugEmployee = async (email: string) => {
    try {
      console.log('=== Testing Employee Authentication ===');
      await debugEmployeeStatus(email);
      toast.success('Debug info logged to console');
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed');
    }
  };

  // Get employee statistics
  const getEmployeeStats = (employeeId: string) => {
    const assignedJobs = jobs.filter(job => job.assignedTo === employeeId);
    const completedJobs = assignedJobs.filter(job => job.status === 'completed');
    const activeJobs = assignedJobs.filter(job => job.status === 'in-progress');
    
    return {
      total: assignedJobs.length,
      completed: completedJobs.length,
      active: activeJobs.length,
    };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrator',
      manager: 'Manager',
      technician: 'Techniker',
      cleaner: 'Reinigungskraft',
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Mitarbeiter" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex flex-1 max-w-md items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Nach Mitarbeitern suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Mitarbeiter hinzufügen
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Lade Mitarbeiter...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Keine Mitarbeiter gefunden.' : 'Keine Mitarbeiter vorhanden.'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ersten Mitarbeiter hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => {
                const stats = getEmployeeStats(employee.id!);
                
                return (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{getRoleLabel(employee.role)}</span>
                      </div>
                      
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{employee.phone}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <div className="font-semibold text-blue-600">{stats.total}</div>
                            <div className="text-gray-500">Gesamt</div>
                          </div>
                          <div>
                            <div className="font-semibold text-green-600">{stats.completed}</div>
                            <div className="text-gray-500">Abgeschlossen</div>
                          </div>
                          <div>
                            <div className="font-semibold text-orange-600">{stats.active}</div>
                            <div className="text-gray-500">Aktiv</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate('/jobs', { state: { assignedTo: employee.id } })}
                        >
                          Aufträge anzeigen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDebugEmployee(employee.email)}
                          title="Debug Authentication"
                        >
                          Debug
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmployeeToDelete(employee);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog to add a new employee */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                placeholder="Vor- und Nachname"
                required
                disabled={createEmployeeMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                placeholder="email@beispiel.de"
                required
                disabled={createEmployeeMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={newEmployee.phone || ''}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                placeholder="+49 123 456789"
                disabled={createEmployeeMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">App-Passwort</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={newEmployee.password || ''}
                  onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  placeholder="Passwort für mobile App"
                  disabled={createEmployeeMutation.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEmployee({...newEmployee, password: generatePassword()})}
                  disabled={createEmployeeMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Leer lassen für automatische Generierung
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value: FirestoreEmployee['role']) => setNewEmployee({...newEmployee, role: value})}
                  disabled={createEmployeeMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="technician">Techniker</SelectItem>
                    <SelectItem value="cleaner">Reinigungskraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newEmployee.status}
                  onValueChange={(value: FirestoreEmployee['status']) => setNewEmployee({...newEmployee, status: value})}
                  disabled={createEmployeeMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={createEmployeeMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={createEmployeeMutation.isPending}
              >
                {createEmployeeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Erstellen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog to edit employee */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                  placeholder="Vor- und Nachname"
                  required
                  disabled={updateEmployeeMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-Mail *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                  placeholder="email@beispiel.de"
                  required
                  disabled={updateEmployeeMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingEmployee.phone || ''}
                  onChange={(e) => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                  placeholder="+49 123 456789"
                  disabled={updateEmployeeMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-password">Passwort-Hinweis</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Passwörter werden über Firebase Auth verwaltet und können hier nicht geändert werden.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mitarbeiter können ihr Passwort über die mobile App zurücksetzen.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rolle</Label>
                  <Select
                    value={editingEmployee.role}
                    onValueChange={(value: FirestoreEmployee['role']) => setEditingEmployee({...editingEmployee, role: value})}
                    disabled={updateEmployeeMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="technician">Techniker</SelectItem>
                      <SelectItem value="cleaner">Reinigungskraft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingEmployee.status}
                    onValueChange={(value: FirestoreEmployee['status']) => setEditingEmployee({...editingEmployee, status: value})}
                    disabled={updateEmployeeMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingEmployee(null)}
                  disabled={updateEmployeeMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Abbrechen
                </Button>
                <Button 
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                >
                  {updateEmployeeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter löschen</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Sind Sie sicher, dass Sie den Mitarbeiter "{employeeToDelete?.name}" löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteEmployeeMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEmployee}
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending && (
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

export default Employees; 