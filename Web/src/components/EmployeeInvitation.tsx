import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { employeeInvitationService } from '@/lib/companyFirestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeInvitationProps {
  onInvitationSent?: () => void;
}

export default function EmployeeInvitation({ onInvitationSent }: EmployeeInvitationProps) {
  const { appUser } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState({
    canViewJobs: true,
    canEditJobs: false,
    canViewProperties: true,
    canEditProperties: false,
    canViewAppointments: true,
    canEditAppointments: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appUser || appUser.role !== 'company') {
      setError('Nur Unternehmen können Mitarbeiter einladen');
      return;
    }

    if (!email.trim()) {
      setError('E-Mail-Adresse ist erforderlich');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Einladungstoken generieren
      const invitationToken = generateInvitationToken();
      
      // Einladung in Firestore erstellen
      await employeeInvitationService.create({
        companyId: appUser.uid,
        email: email.trim(),
        status: 'pending',
        invitationToken,
        permissions,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage
      });

      // E-Mail-Einladung senden (hier würde die E-Mail-Funktionalität implementiert)
      await sendInvitationEmail(email.trim(), invitationToken, appUser.companyName || 'Ihr Unternehmen');

      toast.success('Einladung erfolgreich gesendet');
      setEmail('');
      onInvitationSent?.();
      
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError('Fehler beim Senden der Einladung. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const sendInvitationEmail = async (email: string, token: string, companyName: string): Promise<void> => {
    // Hier würde die E-Mail-Versand-Logik implementiert
    // Für jetzt simulieren wir nur den Versand
    console.log('Sending invitation email to:', email, 'with token:', token);
    
    // In einer echten Implementierung würde hier ein E-Mail-Service wie SendGrid oder Firebase Functions verwendet
    // const response = await fetch('/api/send-invitation', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, token, companyName })
    // });
  };

  const handlePermissionChange = (permission: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  if (!appUser || appUser.role !== 'company') {
    return (
      <Alert>
        <AlertDescription>
          Nur Unternehmen können Mitarbeiter einladen.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Mitarbeiter einladen
        </CardTitle>
        <CardDescription>
          Laden Sie einen neuen Mitarbeiter zu Ihrem Unternehmen ein.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="mitarbeiter@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Berechtigungen</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canViewJobs"
                  checked={permissions.canViewJobs}
                  onCheckedChange={() => handlePermissionChange('canViewJobs')}
                />
                <Label htmlFor="canViewJobs">Jobs anzeigen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEditJobs"
                  checked={permissions.canEditJobs}
                  onCheckedChange={() => handlePermissionChange('canEditJobs')}
                />
                <Label htmlFor="canEditJobs">Jobs bearbeiten</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canViewProperties"
                  checked={permissions.canViewProperties}
                  onCheckedChange={() => handlePermissionChange('canViewProperties')}
                />
                <Label htmlFor="canViewProperties">Objekte anzeigen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEditProperties"
                  checked={permissions.canEditProperties}
                  onCheckedChange={() => handlePermissionChange('canEditProperties')}
                />
                <Label htmlFor="canEditProperties">Objekte bearbeiten</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canViewAppointments"
                  checked={permissions.canViewAppointments}
                  onCheckedChange={() => handlePermissionChange('canViewAppointments')}
                />
                <Label htmlFor="canViewAppointments">Termine anzeigen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEditAppointments"
                  checked={permissions.canEditAppointments}
                  onCheckedChange={() => handlePermissionChange('canEditAppointments')}
                />
                <Label htmlFor="canEditAppointments">Termine bearbeiten</Label>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            Einladung senden
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 