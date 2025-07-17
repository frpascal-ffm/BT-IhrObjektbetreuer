# Implementierung der Unternehmensisolierten Datenbank

## Übersicht der durchgeführten Änderungen

Diese Dokumentation beschreibt alle implementierten Änderungen für die unternehmensisolierte Datenbankstruktur.

## 1. AuthContext erweitert (`src/lib/AuthContext.tsx`)

### Neue Features:
- **AppUser Interface**: Erweiterte Benutzerstruktur mit Rollen und Berechtigungen
- **Rollen-Management**: `company` und `employee` Rollen
- **Unternehmenszuordnung**: Mitarbeiter sind einem Unternehmen zugeordnet
- **Berechtigungssystem**: Granulare Berechtigungen für Mitarbeiter
- **Automatische Benutzerregistrierung**: Unternehmen werden automatisch als `company` registriert

### Neue Properties:
- `appUser`: Erweiterte Benutzerdaten aus Firestore
- `isCompany`: Boolean für Unternehmen
- `isEmployee`: Boolean für Mitarbeiter

## 2. Login-Komponente aktualisiert (`src/pages/Login.tsx`)

### Änderungen:
- **Firmenname entfernt**: Registrierung nur mit E-Mail und Passwort
- **Automatischer Firmenname**: E-Mail-Prefix wird als Firmenname verwendet
- **Unternehmen-Registrierung**: Neue Benutzer werden automatisch als Unternehmen registriert

## 3. Neue Firestore-Services (`src/lib/companyFirestore.ts`)

### Implementierte Services:

#### Properties Service (`companyPropertiesService`)
- `getByCompany()`: Properties eines Unternehmens abrufen
- `subscribeToCompany()`: Real-time Updates für Properties
- `create()`, `update()`, `delete()`: CRUD-Operationen

#### Jobs Service (`companyJobsService`)
- `getByCompany()`: Jobs eines Unternehmens abrufen
- `getByEmployee()`: Jobs eines Mitarbeiters abrufen
- `subscribeToCompany()`: Real-time Updates für Jobs
- `subscribeToEmployee()`: Real-time Updates für Mitarbeiter-Jobs

#### Appointments Service (`companyAppointmentsService`)
- `getByCompany()`: Termine eines Unternehmens abrufen
- `getByEmployee()`: Termine eines Mitarbeiters abrufen
- `subscribeToCompany()`: Real-time Updates für Termine
- `subscribeToEmployee()`: Real-time Updates für Mitarbeiter-Termine

#### Employee Service (`employeeService`)
- `getByCompany()`: Mitarbeiter eines Unternehmens abrufen
- `subscribeToCompany()`: Real-time Updates für Mitarbeiter
- `update()`, `deactivate()`: Mitarbeiter verwalten

#### Employee Invitation Service (`employeeInvitationService`)
- `getByCompany()`: Einladungen eines Unternehmens abrufen
- `create()`, `update()`, `delete()`: Einladungen verwalten

## 4. Firestore Security Rules (`firestore.rules`)

### Implementierte Sicherheitsregeln:

#### Hilfsfunktionen:
- `isCompany()`: Prüft ob Benutzer ein Unternehmen ist
- `isEmployee()`: Prüft ob Benutzer ein Mitarbeiter ist
- `isCompanyOrEmployee()`: Prüft Zugriff auf Unternehmensdaten
- `hasPermission()`: Prüft spezifische Berechtigungen
- `isUserActive()`: Prüft ob Benutzer aktiv ist

#### Collection-Regeln:
- **users**: Benutzer können eigene Daten bearbeiten
- **properties**: Nur Unternehmen und deren Mitarbeiter haben Zugriff
- **jobs**: Unternehmensisolierte Job-Verwaltung
- **appointments**: Unternehmensisolierte Termin-Verwaltung
- **employeeInvitations**: Nur Unternehmen können Einladungen verwalten

## 5. Mitarbeiter-Einladungssystem

### EmployeeInvitation Komponente (`src/components/EmployeeInvitation.tsx`)
- **Einladungsformular**: E-Mail und Berechtigungen festlegen
- **Berechtigungsverwaltung**: Checkboxen für verschiedene Berechtigungen
- **Token-Generierung**: Sichere Einladungstokens
- **E-Mail-Versand**: Vorbereitet für E-Mail-Integration

### InvitationAccept Komponente (`src/components/InvitationAccept.tsx`)
- **Einladungsvalidierung**: Token-Prüfung und Ablaufdatum
- **Mitarbeiter-Registrierung**: Automatische Kontoerstellung
- **Berechtigungszuweisung**: Automatische Berechtigungsvergabe
- **Status-Update**: Einladung wird als angenommen markiert

## 6. Datenbankstruktur

### Collections:
1. **users**: Benutzer mit Rollen und Berechtigungen
2. **properties**: Objekte mit Unternehmenszuordnung
3. **jobs**: Aufträge mit Unternehmens- und Mitarbeiterzuordnung
4. **appointments**: Termine für mobile App
5. **employeeInvitations**: Einladungssystem

### Wichtige Felder:
- `companyId`: Unternehmenszuordnung für alle Daten
- `role`: `company` oder `employee`
- `permissions`: Granulare Berechtigungen für Mitarbeiter
- `assignedTo`: Mitarbeiterzuweisung für Jobs/Termine

## 7. Mobile App Integration

### Mitarbeiter-Zugriff:
- **Nur eigene Daten**: Mitarbeiter sehen nur Daten ihres Unternehmens
- **Zugewiesene Aufgaben**: Jobs und Termine, die ihnen zugewiesen sind
- **Berechtigungsbasierte Ansicht**: UI passt sich an Berechtigungen an

## 8. Sicherheitsfeatures

### Implementiert:
- **Vollständige Isolation**: Unternehmen sehen nur eigene Daten
- **Berechtigungsprüfung**: Firestore Rules prüfen alle Zugriffe
- **Token-basierte Einladungen**: Sichere Mitarbeiter-Einladungen
- **Ablaufdaten**: Einladungen laufen automatisch ab
- **Aktive Benutzer**: Nur aktive Benutzer haben Zugriff

## 9. Nächste Schritte

### Noch zu implementieren:
1. **E-Mail-Service**: Echte E-Mail-Versand-Funktionalität
2. **UI-Integration**: Einladungskomponenten in bestehende Seiten integrieren
3. **Mobile App**: Anpassung der mobilen App für Mitarbeiter
4. **Berechtigungs-UI**: UI-Elemente basierend auf Berechtigungen anzeigen/verstecken
5. **Dashboard-Anpassung**: Unternehmens- und Mitarbeiter-Dashboards

### Empfohlene Implementierung:
1. Firebase Functions für E-Mail-Versand
2. Routing für Einladungsannahme (`/invite/:token`)
3. Dashboard-Komponenten für verschiedene Rollen
4. Mobile App mit Mitarbeiter-spezifischen Features

## 10. Testing

### Zu testende Szenarien:
1. **Unternehmen-Registrierung**: Neue Unternehmen können sich registrieren
2. **Mitarbeiter-Einladung**: Unternehmen können Mitarbeiter einladen
3. **Einladungsannahme**: Mitarbeiter können Einladungen annehmen
4. **Datenisolation**: Unternehmen sehen nur eigene Daten
5. **Berechtigungen**: Mitarbeiter haben nur zugesicherte Berechtigungen
6. **Mobile App**: Mitarbeiter können Termine in der App sehen

## Fazit

Die grundlegende unternehmensisolierte Datenbankstruktur ist implementiert. Die wichtigsten Features sind:

✅ **Vollständige Datenisolation** zwischen Unternehmen  
✅ **Rollen-basiertes System** (Unternehmen/Mitarbeiter)  
✅ **Sichere Firestore Rules**  
✅ **Mitarbeiter-Einladungssystem**  
✅ **Berechtigungsmanagement**  
✅ **Mobile App-Unterstützung**  

Die Implementierung ist bereit für die Integration in die bestehende Anwendung und die mobile App. 