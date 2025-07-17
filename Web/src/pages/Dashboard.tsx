import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, ListTodo, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropertyCard from '@/components/PropertyCard';
import StatusBadge from '@/components/StatusBadge';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { propertiesService, jobsService, type Property, type Job } from '@/lib/firestore';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch data using React Query
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesService.getAll,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsService.getAll,
  });

  const loading = propertiesLoading || jobsLoading;
  const recentProperties = properties.slice(0, 3);
  const recentJobs = jobs.slice(0, 5);

  // Filter jobs by category
  const waterDamageJobs = jobs.filter(job => 
    job.category === 'repair' && 
    (job.title.toLowerCase().includes('wasser') || job.description.toLowerCase().includes('wasser'))
  );

  const specialJobs = jobs.filter(job => 
    job.category === 'other' || 
    job.title.toLowerCase().includes('sonderauftrag') || 
    job.description.toLowerCase().includes('sonderauftrag')
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Willkommen</h2>
            <p className="text-gray-500">Übersicht Ihrer Liegenschaften und Aufträge</p>
          </div>
          
          {/* Stats overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Liegenschaften */}
            <Card
              onClick={() => navigate('/properties')}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-gray-500">Liegenschaften</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold mt-2 flex justify-center w-full">
                  {loading ? '-' : properties.length}
                </span>
              </CardContent>
            </Card>
            
            {/* Liegenschaftsaufträge */}
            <Card
              onClick={() => navigate('/jobs')}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <ListTodo className="h-5 w-5 text-status-inprogress" />
                <CardTitle className="text-sm font-medium text-gray-500">Liegenschaftsaufträge</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold mt-2 flex justify-center w-full">
                  {loading ? '-' : jobs.length}
                </span>
              </CardContent>
            </Card>
            
            {/* Baustellen – Wasserschäden */}
            <Card
              onClick={() => navigate('/jobs/baustellen/wasserschaden')}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-medium text-gray-500">Baustellen – Wasserschäden</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold mt-2 flex justify-center w-full">
                  {loading ? '-' : waterDamageJobs.length}
                </span>
              </CardContent>
            </Card>
            
            {/* Baustellen – Sonderaufträge */}
            <Card
              onClick={() => navigate('/jobs/baustellen/sonderauftrag')}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <ListTodo className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm font-medium text-gray-500">Baustellen – Sonderaufträge</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold mt-2 flex justify-center w-full">
                  {loading ? '-' : specialJobs.length}
                </span>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent properties */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Neueste Liegenschaften</h2>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/properties')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                Alle anzeigen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-3 text-center text-gray-500">Lade Liegenschaften...</div>
              ) : recentProperties.length > 0 ? (
                recentProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500">
                  Keine Liegenschaften vorhanden
                </div>
              )}
            </div>
          </div>
          
          {/* Recent jobs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Aktuelle Aufträge</h2>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/jobs')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                Alle anzeigen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="p-4 text-center text-gray-500">Lade Aufträge...</li>
                  ) : recentJobs.length > 0 ? (
                    recentJobs.map((job) => {
                      const property = properties.find(p => p.id === job.propertyId);
                      return (
                        <li key={job.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{job.title}</h3>
                              <p className="text-sm text-gray-500">
                                {property?.name || 'Unbekannte Liegenschaft'} - {job.createdAt?.toDate().toLocaleDateString()}
                              </p>
                            </div>
                            <StatusBadge status={job.status} />
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="p-4 text-center text-gray-500">Keine Aufträge vorhanden</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
