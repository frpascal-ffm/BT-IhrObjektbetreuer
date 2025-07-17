# Google Maps Integration Setup

## Übersicht
Die Anwendung verwendet Google Maps Places API für die Adressautomatisierung beim Hinzufügen von Liegenschaften.

## Installation
Die notwendigen TypeScript-Definitionen sind bereits installiert:
```bash
npm install --save-dev @types/google.maps
```

## Konfiguration

### API Key
Der Google Maps API Key ist in der `AddressAutocomplete.tsx` Komponente konfiguriert:
```typescript
const GOOGLE_MAPS_API_KEY = '';
```

### Erforderliche APIs
Stellen Sie sicher, dass folgende Google APIs aktiviert sind:
- Places API
- Maps JavaScript API

## Features

### AddressAutocomplete Komponente
- Automatische Adressvorschläge basierend auf Benutzereingabe
- Beschränkung auf deutsche Adressen (`country: 'de'`)
- Loading-States während des API-Ladens
- Fehlerbehandlung bei API-Problemen
- Automatische Bereinigung von Event-Listenern

### Verbesserungen
1. **Robuste Script-Ladung**: Verhindert doppelte Script-Ladung
2. **Fehlerbehandlung**: Zeigt Benutzerfreundliche Fehlermeldungen
3. **Loading-States**: Visueller Indikator während des Ladens
4. **TypeScript-Support**: Vollständige Typisierung
5. **Cleanup**: Automatische Bereinigung von Event-Listenern

## Troubleshooting

### Häufige Probleme

1. **"Google Maps konnte nicht geladen werden"**
   - Überprüfen Sie die Internetverbindung
   - Stellen Sie sicher, dass der API Key gültig ist
   - Überprüfen Sie, ob die Places API aktiviert ist

2. **Keine Adressvorschläge**
   - Überprüfen Sie die API-Nutzung in der Google Cloud Console
   - Stellen Sie sicher, dass die Billing aktiviert ist

3. **TypeScript-Fehler**
   - Führen Sie `npm install` aus, um sicherzustellen, dass alle Abhängigkeiten installiert sind
   - Überprüfen Sie, ob `@types/google.maps` installiert ist

### Debugging
Öffnen Sie die Browser-Entwicklertools und schauen Sie in die Konsole für detaillierte Fehlermeldungen.

## Sicherheit
- Der API Key ist für Client-seitige Verwendung konfiguriert
- Stellen Sie sicher, dass entsprechende Domain-Beschränkungen in der Google Cloud Console gesetzt sind
- Überwachen Sie die API-Nutzung regelmäßig

## Performance
- Das Google Maps Script wird nur bei Bedarf geladen
- Event-Listener werden ordnungsgemäß bereinigt
- Die Komponente ist für React-Strict-Mode optimiert 