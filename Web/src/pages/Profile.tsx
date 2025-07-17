import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Objektbetreuer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Profil erfolgreich aktualisiert");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header title="Profil" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="container max-w-4xl mx-auto">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Ihr Profil</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Kontoinformationen
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 bg-green-50 text-green-600 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-3xl">O</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-medium">Objektbetreuer</p>
                      <p className="text-sm text-muted-foreground">Verwaltungssystem</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Anzeigename</Label>
                        <Input 
                          id="displayName" 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input 
                          id="email" 
                          value="admin@objektbetreuer.de" 
                          disabled 
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          E-Mail kann nicht direkt geändert werden
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Speichern..." : "Änderungen speichern"}
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  System aktiv seit: {new Date().toLocaleDateString()}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Zurück
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 