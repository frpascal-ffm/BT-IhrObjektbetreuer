# Datenbankstruktur - Unternehmensisolierte Datenbank

## Übersicht

Diese Datenbankstruktur implementiert eine vollständige Unternehmensisolation, bei der jedes Unternehmen nur seine eigenen Daten und die seiner Mitarbeiter einsehen kann. Mitarbeiter können nur die Daten ihres zugeordneten Unternehmens sehen.

## Rollen

### 1. Unternehmen (Admin)
- Registriert sich über den "Registrieren" Tab in der Login-Komponente
- Repräsentiert ein eigenständiges Unternehmen/Objektbetreuungsfirma
- Hat vollständigen Zugriff auf alle seine eigenen Daten
- Kann Mitarbeiter einladen und verwalten
- Sieht nur seine eigenen Properties, Jobs, Termine und Mitarbeiter

### 2. Mitarbeiter
- Wird von einem Unternehmen eingeladen
- Arbeitet nur für ein bestimmtes Unternehmen
- Sieht nur die Daten des zugeordneten Unternehmens
- Kann Termine einsehen und bearbeiten (je nach Berechtigung)

## Firestore Collections

### 1. users
```typescript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // E-Mail-Adresse
  role: "company" | "employee",   // Benutzerrolle: Unternehmen oder Mitarbeiter
  companyId?: string,            // Nur für Mitarbeiter: UID des Unternehmens
  displayName: string,            // Anzeigename
  companyName?: string,          // Nur für Unternehmen: Firmenname
  createdAt: timestamp,           // Erstellungsdatum
  lastLogin: timestamp,           // Letzter Login
  isActive: boolean,              // Account aktiv/inaktiv
  permissions: {                  // Berechtigungen (nur für Mitarbeiter)
    canViewJobs: boolean,
    canEditJobs: boolean,
    canViewProperties: boolean,
    canEditProperties: boolean,
    canViewAppointments: boolean,
    canEditAppointments: boolean
  }
}
```

### 2. properties
```typescript
{
  id: string,                     // Auto-generated ID
  companyId: string,              // UID des Unternehmens
  name: string,                   // Objektname
  address: {
    street: string,
    houseNumber: string,
    postalCode: string,
    city: string,
    country: string
  },
  coordinates: {
    lat: number,
    lng: number
  },
  propertyType: string,           // Wohnung, Haus, Gewerbe, etc.
  size: number,                   // Größe in m²
  rooms: number,                  // Anzahl Zimmer
  description: string,            // Beschreibung
  images: string[],               // Array von Bild-URLs
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean
}
```

### 3. jobs
```typescript
{
  id: string,                     // Auto-generated ID
  companyId: string,              // UID des Unternehmens
  propertyId: string,             // Referenz zur Property
  title: string,                  // Auftragstitel
  description: string,            // Auftragsbeschreibung
  status: "pending" | "in_progress" | "completed" | "cancelled",
  priority: "low" | "medium" | "high" | "urgent",
  category: string,               // Kategorie (Reinigung, Reparatur, etc.)
  assignedTo?: string,            // UID des zugewiesenen Mitarbeiters
  createdBy: string,              // UID des erstellenden Benutzers
  createdAt: timestamp,
  updatedAt: timestamp,
  dueDate?: timestamp,            // Fälligkeitsdatum
  completedAt?: timestamp,        // Abschlussdatum
  notes: string[],                // Array von Notizen
  attachments: string[]           // Array von Datei-URLs
}
```

### 4. appointments
```typescript
{
  id: string,                     // Auto-generated ID
  adminId: string,                // UID des Admin-Besitzers
  propertyId?: string,            // Optional: Referenz zur Property
  jobId?: string,                 // Optional: Referenz zum Job
  title: string,                  // Termintitel
  description: string,            // Terminbeschreibung
  startTime: timestamp,           // Startzeit
  endTime: timestamp,             // Endzeit
  status: "scheduled" | "in_progress" | "completed" | "cancelled",
  assignedTo?: string,            // UID des zugewiesenen Mitarbeiters
  createdBy: string,              // UID des erstellenden Benutzers
  createdAt: timestamp,
  updatedAt: timestamp,
  location: string,               // Ort des Termins
  notes: string[],                // Array von Notizen
  attendees: string[]             // Array von Teilnehmer-UIDs
}
```

### 5. employeeInvitations
```typescript
{
  id: string,                     // Auto-generated ID
  adminId: string,                // UID des einladenden Admins
  email: string,                  // E-Mail des eingeladenen Mitarbeiters
  status: "pending" | "accepted" | "expired",
  invitationToken: string,        // Einladungstoken
  permissions: {                  // Gewährte Berechtigungen
    canViewJobs: boolean,
    canEditJobs: boolean,
    canViewProperties: boolean,
    canEditProperties: boolean,
    canViewAppointments: boolean,
    canEditAppointments: boolean
  },
  createdAt: timestamp,
  expiresAt: timestamp,           // Ablaufdatum der Einladung
  acceptedAt?: timestamp
}
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hilfsfunktion: Prüft ob Benutzer Admin ist
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Hilfsfunktion: Prüft ob Benutzer Mitarbeiter ist
    function isEmployee() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'employee';
    }
    
    // Hilfsfunktion: Prüft ob Benutzer Admin oder Mitarbeiter des Admins ist
    function isAdminOrEmployee(adminId) {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return user.role == 'admin' && user.uid == adminId ||
             user.role == 'employee' && user.adminId == adminId;
    }
    
    // Hilfsfunktion: Prüft Berechtigungen für Mitarbeiter
    function hasPermission(permission) {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return user.role == 'admin' || 
             (user.role == 'employee' && user.permissions[permission] == true);
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      isAdmin() || 
                      (isEmployee() && resource.data.adminId == request.auth.uid));
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Properties Collection
    match /properties/{propertyId} {
      allow read: if request.auth != null && 
                     isAdminOrEmployee(resource.data.adminId);
      allow write: if request.auth != null && 
                      isAdminOrEmployee(resource.data.adminId) &&
                      hasPermission('canEditProperties');
      allow create: if request.auth != null && 
                       isAdmin() && 
                       request.resource.data.adminId == request.auth.uid;
    }
    
    // Jobs Collection
    match /jobs/{jobId} {
      allow read: if request.auth != null && 
                     isAdminOrEmployee(resource.data.adminId);
      allow write: if request.auth != null && 
                      isAdminOrEmployee(resource.data.adminId) &&
                      hasPermission('canEditJobs');
      allow create: if request.auth != null && 
                       isAdmin() && 
                       request.resource.data.adminId == request.auth.uid;
    }
    
    // Appointments Collection
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && 
                     isAdminOrEmployee(resource.data.adminId);
      allow write: if request.auth != null && 
                      isAdminOrEmployee(resource.data.adminId) &&
                      hasPermission('canEditAppointments');
      allow create: if request.auth != null && 
                       isAdmin() && 
                       request.resource.data.adminId == request.auth.uid;
    }
    
    // Employee Invitations Collection
    match /employeeInvitations/{invitationId} {
      allow read: if request.auth != null && 
                     resource.data.adminId == request.auth.uid;
      allow write: if request.auth != null && 
                      resource.data.adminId == request.auth.uid;
      allow create: if request.auth != null && 
                       isAdmin() && 
                       request.resource.data.adminId == request.auth.uid;
    }
  }
}
```

## Datenzugriff in der Anwendung

### Web App (Admin Dashboard)

```typescript
// Admin sieht alle seine Daten
const adminData = {
  properties: await getDocs(query(collection(db, 'properties'), where('adminId', '==', user.uid))),
  jobs: await getDocs(query(collection(db, 'jobs'), where('adminId', '==', user.uid))),
  appointments: await getDocs(query(collection(db, 'appointments'), where('adminId', '==', user.uid))),
  employees: await getDocs(query(collection(db, 'users'), where('adminId', '==', user.uid)))
};
```

### Mobile App (Mitarbeiter)

```typescript
// Mitarbeiter sieht nur Daten seines Admins
const employeeData = {
  appointments: await getDocs(query(collection(db, 'appointments'), where('adminId', '==', user.adminId))),
  assignedJobs: await getDocs(query(collection(db, 'jobs'), where('assignedTo', '==', user.uid))),
  properties: await getDocs(query(collection(db, 'properties'), where('adminId', '==', user.adminId)))
};
```

## Implementierungsschritte

### 1. AuthContext erweitern
```typescript
// Erweitern Sie den AuthContext um Rollen-Management
interface User {
  uid: string;
  email: string;
  role: 'admin' | 'employee';
  adminId?: string;
  permissions?: {
    canViewJobs: boolean;
    canEditJobs: boolean;
    canViewProperties: boolean;
    canEditProperties: boolean;
    canViewAppointments: boolean;
    canEditAppointments: boolean;
  };
}
```

### 2. Registrierung anpassen
```typescript
// Bei der Registrierung automatisch Admin-Rolle zuweisen
const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Admin-Dokument erstellen
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    role: 'admin',
    displayName: '',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    isActive: true
  });
};
```

### 3. Mitarbeiter-Einladungssystem
```typescript
// Admin kann Mitarbeiter einladen
const inviteEmployee = async (email: string, permissions: Permissions) => {
  const invitationToken = generateToken();
  
  await addDoc(collection(db, 'employeeInvitations'), {
    adminId: user.uid,
    email,
    status: 'pending',
    invitationToken,
    permissions,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
  });
  
  // E-Mail mit Einladungslink senden
  sendInvitationEmail(email, invitationToken);
};
```

## Vorteile dieser Struktur

1. **Vollständige Isolation**: Jeder Admin sieht nur seine eigenen Daten
2. **Skalierbar**: Einfach neue Admins hinzufügen
3. **Sicher**: Firestore Rules verhindern unbefugten Zugriff
4. **Flexibel**: Berechtigungen pro Mitarbeiter konfigurierbar
5. **Mobile-freundlich**: Mitarbeiter sehen nur relevante Termine
6. **Audit-Trail**: Alle Änderungen sind nachverfolgbar

## Nächste Schritte

1. Firestore Rules implementieren
2. AuthContext um Rollen erweitern
3. Mitarbeiter-Einladungssystem entwickeln
4. Mobile App für Mitarbeiter-Zugriff anpassen
5. Berechtigungssystem in UI implementieren 