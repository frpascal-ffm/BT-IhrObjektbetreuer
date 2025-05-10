
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, ListTodo, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockProperties, mockJobs } from '@/mock-data';
import PropertyCard from '@/components/PropertyCard';
import StatusBadge from '@/components/StatusBadge';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get the latest properties and jobs
  const recentProperties = mockProperties.slice(0, 3);
  const recentJobs = mockJobs.slice(0, 5);
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Liegenschaften</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{mockProperties.length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Aktive Aufträge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ListTodo className="h-5 w-5 text-status-inprogress mr-2" />
                  <span className="text-2xl font-bold">
                    {mockJobs.filter(job => job.status === 'inprogress').length}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Neue Aufträge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ListTodo className="h-5 w-5 text-status-new mr-2" />
                  <span className="text-2xl font-bold">
                    {mockJobs.filter(job => job.status === 'new').length}
                  </span>
                </div>
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
              {recentProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
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
                  {recentJobs.map((job) => {
                    // Find associated property
                    const property = mockProperties.find(p => p.id === job.propertyId);
                    
                    return (
                      <li key={job.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-500">
                              {property?.name} - {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                      </li>
                    );
                  })}
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
