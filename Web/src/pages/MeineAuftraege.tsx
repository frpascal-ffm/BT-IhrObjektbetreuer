import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { mockJobs, mockEmployees, mockProperties } from '@/mock-data';
import { Job, JobStatus } from '@/types';
import { Property } from '@/lib/firestore';
import { Search, Eye, Edit, Trash2, Calendar as CalendarIcon, Filter, X, Check, ChevronDown } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const MeineAuftraege = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['open', 'in-progress', 'canceled']);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setJobs(mockJobs);
    setProperties(mockProperties);
  }, []);

  // Filter jobs based on search, status, and date range
  const filteredJobs = jobs.filter(job => {
    // Search filter
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter - exclude completed jobs by default
    const matchesStatus = statusFilter.includes(job.status);

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const jobDate = startOfDay(new Date(job.createdAt));
      if (dateRange.from && dateRange.to) {
        matchesDateRange = isWithinInterval(jobDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        });
      } else if (dateRange.from) {
        matchesDateRange = jobDate >= startOfDay(dateRange.from);
      } else if (dateRange.to) {
        matchesDateRange = jobDate <= endOfDay(dateRange.to);
      }
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(['open', 'in-progress', 'canceled']);
    setDateRange({ from: undefined, to: undefined });
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || 
    !statusFilter.includes('open') || 
    !statusFilter.includes('in-progress') || 
    !statusFilter.includes('canceled') || 
    dateRange.from || 
    dateRange.to;

  // Handle status filter changes
  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilter(prev => [...prev, status]);
    } else {
      setStatusFilter(prev => prev.filter(s => s !== status));
    }
  };

  // Handle row click to navigate to detail page
  const handleRowClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  // Handle action button clicks (prevent row click)
  const handleActionClick = (e: React.MouseEvent, action: string, jobId: string) => {
    e.stopPropagation();
    if (action === 'edit') {
      navigate(`/jobs/${jobId}/edit`);
    } else if (action === 'delete') {
      // Handle delete action
      console.log('Delete job:', jobId);
    } else if (action === 'complete') {
      // Mark job as completed
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'closed' as JobStatus,
                completedAt: new Date(),
                updatedAt: new Date()
              }
            : job
        )
      );
    }
  };

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

  // Get status display name
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in-progress': return 'In Bearbeitung';
      case 'closed': return 'Abgeschlossen';
      case 'canceled': return 'Storniert';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Meine Aufträge" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-full">
          {/* Filter Section */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Nach Auftrag suchen..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter - Multiselect */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[200px] justify-between"
                  >
                    <span>Status ({statusFilter.length})</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Status auswählen</h4>
                    <div className="space-y-2">
                      {(['open', 'in-progress', 'canceled', 'closed'] as const).map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={status}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                          />
                          <label
                            htmlFor={status}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {getStatusDisplayName(status)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd.MM.yyyy", { locale: de })} -{" "}
                            {format(dateRange.to, "dd.MM.yyyy", { locale: de })}
                          </>
                        ) : (
                          format(dateRange.from, "dd.MM.yyyy", { locale: de })
                        )
                      ) : (
                        "Datum wählen"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={de}
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Filter löschen
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 text-sm">
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                    Suche: "{searchQuery}"
                  </span>
                )}
                {statusFilter.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                    Status: {statusFilter.map(s => getStatusDisplayName(s)).join(', ')}
                  </span>
                )}
                {dateRange.from && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md">
                    Datum: {format(dateRange.from, "dd.MM.yyyy", { locale: de })}
                    {dateRange.to && ` - ${format(dateRange.to, "dd.MM.yyyy", { locale: de })}`}
                  </span>
                )}
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Datum</TableHead>
                    <TableHead className="font-semibold">Aufgabe</TableHead>
                    <TableHead className="font-semibold">Kategorie</TableHead>
                    <TableHead className="font-semibold">Adresse</TableHead>
                    <TableHead className="font-semibold">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        {hasActiveFilters ? 'Keine Aufträge mit den gewählten Filtern gefunden.' : 'Keine Aufträge gefunden.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map(job => {
                      const propertyInfo = getPropertyInfo(job.propertyId);
                      const isCompleted = job.status === 'closed';
                      return (
                        <TableRow 
                          key={job.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(job.id)}
                        >
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
                              {!isCompleted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Als erledigt markieren"
                                  onClick={(e) => handleActionClick(e, 'complete', job.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {isCompleted && (
                                <div className="h-8 w-8"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Bearbeiten"
                                onClick={(e) => handleActionClick(e, 'edit', job.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Löschen"
                                onClick={(e) => handleActionClick(e, 'delete', job.id)}
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