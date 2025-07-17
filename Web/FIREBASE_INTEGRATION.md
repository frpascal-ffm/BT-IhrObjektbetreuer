# Firebase Integration für BT Ihr Objektbetreuer

## Übersicht

Diese Web-App ist vollständig mit Firebase integriert und bietet:

- **Authentifizierung**: Login/Registrierung mit E-Mail und Passwort
- **Firestore Database**: Speicherung von Liegenschaften, Aufträgen und Mitarbeitern
- **Geschützte Routen**: Nur angemeldete Benutzer können auf die App zugreifen
- **Echtzeit-Daten**: React Query für optimale Datenverwaltung

## Features

### 🔐 Authentifizierung
- Benutzerregistrierung mit E-Mail und Passwort
- Login/Logout-Funktionalität
- Passwort-Reset per E-Mail
- Geschützte Routen für alle Seiten außer Login

### 🏢 Liegenschaften (Properties)
- CRUD-Operationen für Liegenschaften
- Suchfunktion
- Adress-Autovervollständigung
- Status-Management (aktiv, inaktiv, Wartung)

### 📋 Aufträge (Jobs)
- Vollständige Auftragsverwaltung
- Kategorisierung (Wartung, Reparatur, Inspektion, Reinigung, Sonstiges)
- Prioritätsstufen (niedrig, mittel, hoch, dringend)
- Status-Tracking (ausstehend, in Bearbeitung, abgeschlossen, storniert)
- Zuweisung an Mitarbeiter

### 👥 Mitarbeiter (Employees)
- Mitarbeiterverwaltung mit Firebase Auth Integration
- Rollen-Management (Admin, Manager, Techniker, Reinigungskraft)
- Status-Tracking (aktiv, inaktiv)
- **Sichere Authentifizierung**: Passwörter werden nur in Firebase Auth gespeichert
- **Mobile-Only Access**: Mitarbeiter haben nur Zugriff auf die Mobile App
- **Admin-Only Management**: Nur Administratoren können Mitarbeiter erstellen/bearbeiten

## Technische Implementierung

### Firebase-Konfiguration
```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCi5ttsvEuAeUJOI6KMEsdKhJkkZ6sDHus",
  authDomain: "btihrobjektbetreuer.firebaseapp.com",
  projectId: "btihrobjektbetreuer",
  storageBucket: "btihrobjektbetreuer.firebasestorage.app",
  messagingSenderId: "305001906036",
  appId: "1:305001906036:web:81200a28803d6256093621"
};
```

### Authentifizierung
```typescript
// src/lib/AuthContext.tsx
export function AuthProvider({ children }) {
  // Login, Register, Logout, Reset Password Funktionen
}
```

### Firestore Services
```typescript
// src/lib/firestore.ts
export const propertiesService = {
  getAll, getById, create, update, delete
};

export const jobsService = {
  getAll, getById, getByProperty, getByStatus, create, update, delete
};

export const employeesService = {
  getAll, getById, getByRole, create, update, delete
};
```

## Datenstruktur

### Properties Collection
```typescript
interface Property {
  id?: string;
  name: string;
  address: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  owner?: string;
  description?: string;
  imageUrl?: string;
}
```

### Jobs Collection
```typescript
interface Job {
  id?: string;
  title: string;
  description: string;
  propertyId: string;
  propertyName?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  dueDate?: Timestamp;
  category: 'maintenance' | 'repair' | 'inspection' | 'cleaning' | 'other';
  estimatedHours?: number;
  actualHours?: number;
  materials?: string[];
  notes?: string;
}
```

### Employees Collection
```typescript
interface Employee {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'cleaner';
  phone?: string;
  status: 'active' | 'inactive';
  firebaseUid?: string; // Firebase Auth UID (kein Passwort in Firestore!)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  avatar?: string;
}
```

## Verwendung

### 1. Anmeldung
- Besuchen Sie `/login`
- Registrieren Sie sich mit E-Mail und Passwort oder melden Sie sich an
- Nach erfolgreicher Anmeldung werden Sie zum Dashboard weitergeleitet

### 2. Liegenschaften verwalten
- Gehen Sie zu `/properties`
- Klicken Sie auf "Liegenschaft hinzufügen"
- Füllen Sie die Pflichtfelder aus (Name, Adresse, Typ)
- Die Adresse wird automatisch vervollständigt

### 3. Aufträge erstellen
- Gehen Sie zu `/jobs`
- Erstellen Sie neue Aufträge und weisen Sie sie Liegenschaften zu
- Setzen Sie Priorität und Kategorie
- Weisen Sie Mitarbeiter zu

### 4. Mitarbeiter verwalten
- Gehen Sie zu `/employees`
- Fügen Sie neue Mitarbeiter hinzu
- Weisen Sie Rollen und Status zu

## Sicherheit

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Employees - restricted access with custom claims
    match /employees/{employee} {
      // Allow read if user is authenticated and either:
      // 1. User is reading their own employee record
      // 2. User has admin custom claim
      allow read: if request.auth != null && (
        resource.data.email == request.auth.token.email ||
        request.auth.token.admin == true
      );
      
      // Allow write only for users with admin custom claim
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Other collections - accessible by all authenticated users
    match /properties/{property} {
      allow read, write: if request.auth != null;
    }
    
    match /jobs/{job} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Zugriffskontrolle
- **Web-App (Admin)**: Nur Benutzer mit Admin-Custom-Claim können Mitarbeiter verwalten
- **Mobile App (Mitarbeiter)**: Mitarbeiter können nur ihre eigenen Daten lesen
- **Passwort-Sicherheit**: Passwörter werden nur in Firebase Auth gespeichert, nie in Firestore
- **Geschützte Routen**: Alle Routen außer `/login` sind durch `ProtectedRoute` geschützt

### Firebase Auth Integration
- Mitarbeiter werden in Firebase Auth erstellt
- Custom Claims für Admin-Status
- Sichere Authentifizierung ohne Passwort-Speicherung in Firestore

## Entwicklung

### Neue Features hinzufügen
1. Erweitern Sie die Firestore Services in `src/lib/firestore.ts`
2. Erstellen Sie neue Komponenten in `src/components/`
3. Fügen Sie neue Seiten in `src/pages/` hinzu
4. Aktualisieren Sie die Routen in `src/App.tsx`

### Daten abrufen
```typescript
import { useQuery } from '@tanstack/react-query';
import { propertiesService } from '@/lib/firestore';

const { data: properties, isLoading } = useQuery({
  queryKey: ['properties'],
  queryFn: propertiesService.getAll,
});
```

### Daten ändern
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const createMutation = useMutation({
  mutationFn: propertiesService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  },
});
```

## Deployment

Die App ist für Firebase Hosting konfiguriert:

```bash
# Build der App
npm run build

# Deployment zu Firebase
firebase deploy
```

## Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Firebase Console
2. Schauen Sie in die Browser-Konsole für Fehler
3. Überprüfen Sie die Firestore Rules
4. Stellen Sie sicher, dass die Firebase-Konfiguration korrekt ist 