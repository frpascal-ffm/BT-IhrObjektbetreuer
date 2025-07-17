import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { employeeInvitationService } from '@/lib/companyFirestore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationAcceptProps {
  token: string;
}

export default function InvitationAccept({ token }: InvitationAcceptProps) {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Einladung anhand des Tokens finden
      const invitations = await employeeInvitationService.getByCompany(''); // Temporär, um alle zu durchsuchen
      const foundInvitation = invitations.find(inv => inv.invitationToken === token);
      
      if (!foundInvitation) {
        setError('Einladung nicht gefunden oder ungültig');
        setLoading(false);
        return;
      }

      if (foundInvitation.status === 'accepted') {
        setError('Diese Einladung wurde bereits angenommen');
        setLoading(false);
        return;
      }

      if (foundInvitation.status === 'expired' || new Date() > foundInvitation.expiresAt.toDate()) {
        setError('Diese Einladung ist abgelaufen');
        setLoading(false);
        return;
      }

      setInvitation(foundInvitation);
      setEmail(foundInvitation.email);
      
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Fehler beim Laden der Einladung');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Benutzer in Firebase Auth erstellen
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mitarbeiter-Dokument in Firestore erstellen
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'employee',
        companyId: invitation.companyId,
        displayName: email.split('@')[0], // Verwende E-Mail-Prefix als Anzeigename
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        permissions: invitation.permissions
      });

      // Einladung als angenommen markieren
      await employeeInvitationService.update(invitation.id, {
        status: 'accepted',
        acceptedAt: new Date()
      });

      toast.success('Konto erfolgreich erstellt! Sie sind jetzt Mitarbeiter.');
      navigate('/');
      
    } catch (err: any) {
      console.error('Error creating account:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail-Adresse wird bereits verwendet');
      } else if (err.code === 'auth/weak-password') {
        setError('Passwort ist zu schwach');
      } else {
        setError('Fehler beim Erstellen des Kontos. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Lade Einladung...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Einladung ungültig</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Zurück zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Einladung annehmen</CardTitle>
          <CardDescription>
            Erstellen Sie Ihr Mitarbeiterkonto für {invitation.companyName || 'das Unternehmen'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Diese E-Mail-Adresse wurde von Ihrem Unternehmen eingeladen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Ihre Berechtigungen</Label>
              <div className="text-sm space-y-1">
                {invitation.permissions.canViewJobs && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Jobs anzeigen</span>
                  </div>
                )}
                {invitation.permissions.canEditJobs && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Jobs bearbeiten</span>
                  </div>
                )}
                {invitation.permissions.canViewProperties && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Objekte anzeigen</span>
                  </div>
                )}
                {invitation.permissions.canEditProperties && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Objekte bearbeiten</span>
                  </div>
                )}
                {invitation.permissions.canViewAppointments && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Termine anzeigen</span>
                  </div>
                )}
                {invitation.permissions.canEditAppointments && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Termine bearbeiten</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mitarbeiterkonto erstellen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 