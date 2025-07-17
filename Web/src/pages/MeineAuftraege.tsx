import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { mockJobs, mockEmployees, mockProperties } from '@/mock-data';
import { Job, Property } from '@/types';
// Authentication removed - showing all jobs
import { Search } from 'lucide-react';

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
  const myJobs = jobs.filter(job => {
    // Suche
    if (!searchQuery) return true;
    return (
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Hilfsfunktion für Property-Name
  const getPropertyName = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : 'Unbekannte Liegenschaft';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Meine Aufträge" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-full">
          <div className="mb-4 flex items-center gap-3 max-w-md">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myJobs.length === 0 ? (
              <div className="text-gray-500 col-span-full">Keine Aufträge gefunden.</div>
            ) : (
              myJobs.map(job => (
                <Card key={job.id} className="flex flex-col h-full">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-base">{job.title}</div>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-sm text-gray-500">{getPropertyName(job.propertyId)}</div>
                    <div className="text-sm">{job.description}</div>
                    {job.dueDate && (
                      <div className="text-xs text-gray-400 mt-2">Fällig: {new Date(job.dueDate).toLocaleDateString()}</div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MeineAuftraege; 