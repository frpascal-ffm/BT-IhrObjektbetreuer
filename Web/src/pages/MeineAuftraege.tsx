import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockJobs, mockEmployees, mockProperties } from '@/mock-data';
import { Job, Property } from '@/types';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';

const MeineAuftraege = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setJobs(mockJobs);
    setProperties(mockProperties);
  }, []);

  // Show all jobs since no authentication is required
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    return (
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Hilfsfunktion für Property-Name und Adresse
  const getPropertyInfo = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return { name: 'Unbekannte Liegenschaft', address: 'Unbekannte Adresse' };
    return { 
      name: prop.name, 
      address: `${prop.address}, ${prop.postalCode} ${prop.city}` 
    };
  };

  // Hilfsfunktion für Job-Typ Übersetzung
  const getJobTypeName = (jobType?: string) => {
    switch (jobType) {
      case 'wasserschaden': return 'Wasserschaden';
      case 'sonderauftrag': return 'Sonderauftrag';
      case 'liegenschaftsauftrag': return 'Liegenschaftsauftrag';
      case 'baustelle': return 'Baustelle';
      default: return 'Allgemein';
    }
  };

  // Hilfsfunktion für Datum Formatierung
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Meine Aufträge" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-full">
          <div className="mb-6 flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Nach Auftrag suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Datum</TableHead>
                    <TableHead className="font-semibold">Thema</TableHead>
                    <TableHead className="font-semibold">Zugewiesen an</TableHead>
                    <TableHead className="font-semibold">Adresse</TableHead>
                    <TableHead className="font-semibold">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Keine Aufträge gefunden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map(job => {
                      const propertyInfo = getPropertyInfo(job.propertyId);
                      return (
                        <TableRow key={job.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {formatDate(job.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.title}</div>
                              <div className="text-sm text-gray-500">{getJobTypeName(job.jobType)}</div>
                              <StatusBadge status={job.status} />
                            </div>
                          </TableCell>
                          <TableCell>
                            {getJobTypeName(job.jobType)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{propertyInfo.name}</div>
                              <div className="text-gray-500">{propertyInfo.address}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Details anzeigen"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Bearbeiten"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default MeineAuftraege; 