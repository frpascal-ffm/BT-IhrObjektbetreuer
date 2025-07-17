# BT Ihr Objektbetreuer - Mobile App

Eine React Native/Expo-App für Mitarbeiter, um ihre zugewiesenen Termine einzusehen und zu verwalten.

## Features

- **Mitarbeiter-Login**: Anmeldung mit E-Mail und Passwort (erstellt vom Admin)
- **Termine anzeigen**: Übersicht aller zugewiesenen Termine
- **Termin-Details**: Detaillierte Ansicht einzelner Termine
- **Status-Updates**: Möglichkeit, den Status von Terminen zu ändern
- **Profil-Verwaltung**: Anzeige der Mitarbeiter-Informationen
- **Offline-Unterstützung**: Lokale Speicherung der Anmeldedaten

## Installation

1. **Dependencies installieren**:
   ```bash
   npm install
   ```

2. **App starten**:
   ```bash
   npm start
   ```

3. **Auf Gerät/Emulator ausführen**:
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Verwendung

### Für Administratoren (Web-App)

1. Öffnen Sie die Web-App unter `/employees`
2. Erstellen Sie einen neuen Mitarbeiter mit:
   - Name
   - E-Mail-Adresse
   - Rolle (Techniker, Reinigungskraft, etc.)
   - App-Passwort (wird automatisch generiert)
3. Das generierte Passwort wird angezeigt - notieren Sie es!

### Für Mitarbeiter (Mobile App)

1. App öffnen
2. Mit E-Mail und Passwort anmelden
3. Termine einsehen und Status aktualisieren

## Technische Details

### Architektur

- **Frontend**: React Native mit Expo
- **Backend**: Firebase Firestore
- **Authentifizierung**: Custom Auth mit E-Mail/Passwort
- **Navigation**: Expo Router
- **State Management**: React Context (AuthContext)

### Datenstruktur

Die App verwendet die gleiche Firebase-Datenbank wie die Web-App:

- **employees**: Mitarbeiter-Daten mit Login-Credentials
- **jobs**: Termine/Aufträge mit Zuweisungen
- **properties**: Objekte/Immobilien

### Sicherheit

- Passwörter werden in Firebase gespeichert (für Produktion sollte hier ein sicherer Hash verwendet werden)
- Nur aktive Mitarbeiter können sich anmelden
- Mitarbeiter sehen nur ihre eigenen Termine

## Entwicklung

### Projektstruktur

```
app/
├── (tabs)/
│   ├── index.tsx          # Hauptseite mit Terminen
│   ├── profile.tsx        # Profil-Seite
│   └── _layout.tsx        # Tab-Navigation
├── job/
│   └── [id].tsx           # Termin-Detail-Seite
├── login.tsx              # Login-Seite
└── _layout.tsx            # Haupt-Layout mit Auth

lib/
├── AuthContext.tsx        # Authentifizierung
├── firebase.ts           # Firebase-Konfiguration
└── firestore.ts          # Firestore-Services
```

### Hinzufügen neuer Features

1. **Neue Seite**: Erstellen Sie eine neue Datei in `app/`
2. **Navigation**: Fügen Sie die Route in `_layout.tsx` hinzu
3. **Services**: Erweitern Sie `firestore.ts` bei Bedarf

## Deployment

### Expo Build

```bash
# Für iOS
expo build:ios

# Für Android
expo build:android
```

### App Store

1. App bei Apple App Store/Google Play Store einreichen
2. Metadaten und Screenshots bereitstellen
3. Review-Prozess durchlaufen

## Support

Bei Fragen oder Problemen wenden Sie sich an das Entwicklungsteam.

## Version

1.0.0 - Erste Version mit grundlegenden Features
