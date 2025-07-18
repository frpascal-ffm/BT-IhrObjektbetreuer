# User-basierte Datenstruktur

## Übersicht

Die Anwendung wurde auf eine user-basierte Datenstruktur umgestellt, bei der alle Daten unter dem jeweiligen Benutzer gespeichert werden. Dies ermöglicht eine bessere Isolation der Daten zwischen verschiedenen Unternehmen und eine einfachere Verwaltung.

## Neue Firestore-Struktur

```
User/
├── {USER_ID}/
│   ├── properties/
│   │   ├── {PROPERTY_ID}/
│   │   └── ...
│   ├── jobs/
│   │   ├── {JOB_ID}/
│   │   └── ...
│   ├── employees/
│   │   ├── {EMPLOYEE_ID}/
│   │   └── ...
│   └── appointments/
│       ├── {APPOINTMENT_ID}/
│       └── ...
└── ...
```

## Vorteile der neuen Struktur

1. **Datenisolation**: Jedes Unternehmen hat seine eigenen Daten in separaten Kollektionen
2. **Sicherheit**: Firestore-Regeln können einfach auf Benutzerbasis konfiguriert werden
3. **Skalierbarkeit**: Bessere Performance bei großen Datenmengen
4. **Wartbarkeit**: Einfachere Backup- und Migrationsstrategien

## Implementierte Änderungen

### Web-App (`/Web`)

#### Firestore Services (`src/lib/firestore.ts`)
- Alle Services verwenden jetzt `getCurrentUserId()` um die aktuelle User-ID zu ermitteln
- Daten werden in `users/{USER_ID}/{COLLECTION}` gespeichert
- Legacy-Services bleiben für Migration erhalten

#### Firestore Rules (`firestore.rules`)
- Neue Regeln für die User-basierte Struktur hinzugefügt
- Legacy-Regeln bleiben für Migration erhalten
- Nur der Eigentümer kann auf seine Daten zugreifen

### Mobile App (`/mobile`)

#### Firebase Integration
- Firebase Auth und Firestore konfiguriert
- AuthContext für Mitarbeiter-Authentifizierung implementiert
- Login-Screen für Mitarbeiter-Anmeldung

#### Datenzugriff
- Services suchen automatisch nach der Company-ID des Mitarbeiters
- Mitarbeiter können nur auf Daten ihres Unternehmens zugreifen
- Real-time Updates für zugewiesene Termine und Jobs

## Mitarbeiter-Management

### Erstellung von Mitarbeitern
1. Unternehmen erstellt Mitarbeiter über die Web-App (`/employees`)
2. Firebase Auth User wird automatisch erstellt
3. Mitarbeiter-Daten werden in `User/{COMPANY_ID}/employees` gespeichert
4. Passwort wird generiert und angezeigt

### Mobile App Zugang
1. Mitarbeiter können sich mit E-Mail und Passwort in der mobilen App anmelden
2. AuthContext findet automatisch das Unternehmen des Mitarbeiters
3. Mitarbeiter sehen nur ihre zugewiesenen Termine und Jobs

## Migration von der alten Struktur

### Automatische Migration
Die neue Struktur ist parallel zur alten implementiert. Für eine vollständige Migration:

1. **Daten migrieren**: Skript erstellen, das Daten von alten Kollektionen in neue Struktur kopiert
2. **Legacy-Code entfernen**: Nach erfolgreicher Migration können alte Services entfernt werden
3. **Firestore Rules aktualisieren**: Legacy-Regeln entfernen

### Beispiel-Migrationsskript

```javascript
// Migration von properties
const migrateProperties = async () => {
  const oldProperties = await getDocs(collection(db, 'properties'));
  
  for (const doc of oldProperties.docs) {
    const property = doc.data();
    const companyId = property.companyId || property.owner;
    
    if (companyId) {
              await addDoc(collection(db, 'users', companyId, 'properties'), {
        ...property,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
};
```

## Sicherheitsaspekte

### Firestore Rules
```javascript
// Nur der Eigentümer kann auf seine Daten zugreifen
match /User/{userId} {
  allow read, write: if isOwner(userId) && isUserActive();
}
```

### Authentifizierung
- Mitarbeiter werden als Firebase Auth User erstellt
- Passwörter werden nicht in Firestore gespeichert
- Passwort-Reset über Firebase Auth möglich

## API-Änderungen

### Web-App Services
```typescript
// Vorher
const properties = await getDocs(collection(db, 'properties'));

// Nachher
const userId = getCurrentUserId();
const properties = await getDocs(collection(db, 'users', userId, 'properties'));
```

### Mobile App Services
```typescript
// Automatische Company-ID Suche
const findCompanyId = async (): Promise<string | null> => {
  // Sucht nach dem Unternehmen, das den Mitarbeiter beschäftigt
  // und gibt die Company-ID zurück
};
```

## Nächste Schritte

1. **Testing**: Umfassende Tests der neuen Struktur
2. **Performance**: Monitoring der Firestore-Performance
3. **Migration**: Vollständige Migration der bestehenden Daten
4. **Cleanup**: Entfernung der Legacy-Code und -Regeln

## Troubleshooting

### Häufige Probleme

1. **"No authenticated user found"**
   - Stellen Sie sicher, dass der Benutzer angemeldet ist
   - Prüfen Sie die Firebase Auth Konfiguration

2. **"Company not found"**
   - Mitarbeiter ist nicht in der employees-Kollektion gespeichert
   - Firebase UID stimmt nicht überein

3. **"Permission denied"**
   - Firestore Rules prüfen
   - Benutzer hat keine Berechtigung für die Daten

### Debug-Tools

- `debugEmployeeStatus(email)` in der Web-App
- Firebase Console für Auth und Firestore
- Browser DevTools für Network-Requests 