import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '@/lib/firestore';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Euro, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { propertiesService } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

const Balance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, appUser, loading: authLoading } = useAuth();

  // Real-time data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    // Only subscribe if user is authenticated
    if (!currentUser || authLoading) {
      setLoading(true);
      return;
    }

    console.log('Setting up properties subscription for balance page for user:', currentUser.uid);
    setLoading(true);
    
    // Subscribe to real-time updates with error handling
    const unsubscribeProperties = propertiesService.subscribeToAll((propertiesData) => {
      console.log('Properties subscription received data:', propertiesData.length, 'properties');
      setProperties(propertiesData);
      setLoading(false);
      setSubscriptionActive(true);
    }, (error) => {
      console.error('Error in properties subscription:', error);
      setSubscriptionActive(false);
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
  }, [currentUser?.uid, authLoading]);

  // Calculate financial metrics
  const totalMonthlyIncome = properties
    .filter(property => property.monthlyIncome && property.monthlyIncome > 0)
    .reduce((sum, property) => sum + (property.monthlyIncome || 0), 0);

  const activeProperties = properties.filter(property => property.status === 'active');
  const inactiveProperties = properties.filter(property => property.status === 'inactive');
  const maintenanceProperties = properties.filter(property => property.status === 'maintenance');

  const propertiesWithIncome = properties.filter(property => property.monthlyIncome && property.monthlyIncome > 0);
  const propertiesWithoutIncome = properties.filter(property => !property.monthlyIncome || property.monthlyIncome === 0);

  // Group properties by type for analysis
  const propertiesByType = properties.reduce((acc, property) => {
    const type = property.type || 'Unbekannt';
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalIncome: 0,
        properties: []
      };
    }
    acc[type].count++;
    acc[type].totalIncome += property.monthlyIncome || 0;
    acc[type].properties.push(property);
    return acc;
  }, {} as Record<string, { count: number; totalIncome: number; properties: Property[] }>);

  // Top performing properties
  const topProperties = [...properties]
    .filter(property => property.monthlyIncome && property.monthlyIncome > 0)
    .sort((a, b) => (b.monthlyIncome || 0) - (a.monthlyIncome || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Bilanz & Finanzen" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {authLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              Authentifizierung...
            </div>
          ) : !currentUser ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Bitte melden Sie sich an, um die Bilanz zu sehen.</p>
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Anmelden
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              Lade Bilanzdaten...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gesamteinnahmen</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {totalMonthlyIncome.toLocaleString('de-DE', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}€
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Monatlich
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aktive Liegenschaften</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeProperties.length}</div>
                    <p className="text-xs text-muted-foreground">
                      von {properties.length} insgesamt
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Durchschnittseinnahmen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {propertiesWithIncome.length > 0 
                        ? (totalMonthlyIncome / propertiesWithIncome.length).toLocaleString('de-DE', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })
                        : '0,00'
                      }€
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pro Liegenschaft
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ohne Einnahmen</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{propertiesWithoutIncome.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Liegenschaften
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Status Übersicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Aktiv</span>
                        </div>
                        <span className="text-sm font-medium">{activeProperties.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Wartung</span>
                        </div>
                        <span className="text-sm font-medium">{maintenanceProperties.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm">Inaktiv</span>
                        </div>
                        <span className="text-sm font-medium">{inactiveProperties.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Einnahmen nach Typ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(propertiesByType)
                        .filter(([_, data]) => data.totalIncome > 0)
                        .sort(([_, a], [__, b]) => b.totalIncome - a.totalIncome)
                        .map(([type, data]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm">{type}</span>
                            <span className="text-sm font-medium text-green-600">
                              {data.totalIncome.toLocaleString('de-DE', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}€
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Properties */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Einnahmen - Liegenschaften
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProperties.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Keine Liegenschaften mit Einnahmen vorhanden.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topProperties.map((property, index) => (
                        <div 
                          key={property.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">#{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-medium">{property.name}</div>
                              <div className="text-sm text-gray-500">{property.address}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              {property.monthlyIncome?.toLocaleString('de-DE', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}€
                            </div>
                            <div className="text-sm text-gray-500">{property.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Properties without Income */}
              {propertiesWithoutIncome.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <TrendingDown className="h-5 w-5" />
                      Liegenschaften ohne Einnahmen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {propertiesWithoutIncome.map((property) => (
                        <div 
                          key={property.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Building className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-medium">{property.name}</div>
                              <div className="text-sm text-gray-500">{property.address}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-600 font-medium">Keine Einnahmen</div>
                            <div className="text-sm text-gray-500">{property.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Balance; 