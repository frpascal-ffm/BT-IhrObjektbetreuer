import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Jobs, { JobsWasserschaden, JobsSonderauftrag } from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import NotFound from "./pages/NotFound";
import FirestoreExample from "./components/FirestoreExample";
import FirebaseAuth from "./components/FirebaseAuth";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Employees from "./pages/Employees";
import MeineAuftraege from "./pages/MeineAuftraege";

// Optimierte QueryClient-Konfiguration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Standard-Caching-Einstellungen
      staleTime: 5 * 60 * 1000, // 5 Minuten - Daten sind 5 Minuten "frisch"
      gcTime: 10 * 60 * 1000, // 10 Minuten - Cache wird 10 Minuten behalten
      refetchOnWindowFocus: false, // Kein Refetch beim Fokuswechsel
      refetchOnMount: false, // Kein Refetch beim Mounten wenn Daten existieren
      retry: 1, // Nur 1 Retry bei Fehlern
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentieller Backoff
    },
    mutations: {
      retry: 1, // Nur 1 Retry bei Mutations
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute>
                <Properties />
              </ProtectedRoute>
            } />
            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <PropertyDetails />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/jobs/baustellen/wasserschaden" element={
              <ProtectedRoute>
                <JobsWasserschaden />
              </ProtectedRoute>
            } />
            <Route path="/jobs/baustellen/sonderauftrag" element={
              <ProtectedRoute>
                <JobsSonderauftrag />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/meine-auftraege" element={
              <ProtectedRoute>
                <MeineAuftraege />
              </ProtectedRoute>
            } />
            <Route path="/firebase/firestore" element={
              <ProtectedRoute>
                <FirestoreExample />
              </ProtectedRoute>
            } />
            <Route path="/firebase/auth" element={
              <ProtectedRoute>
                <FirebaseAuth />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
