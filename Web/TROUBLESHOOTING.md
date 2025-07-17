# Troubleshooting Guide - Firebase Auth Integration

## Problem: `auth/invalid-credential` Error in Mobile App

### Symptome
- Mobile App zeigt Fehler: `Firebase: Error (auth/invalid-credential)`
- Mitarbeiter kann sich nicht anmelden
- Login schlägt fehl

### Mögliche Ursachen

#### 1. Mitarbeiter wurde nicht korrekt in Firebase Auth erstellt
**Lösung:**
1. Öffnen Sie die Web-App
2. Gehen Sie zu `/employees`
3. Klicken Sie auf "Debug" Button neben dem Mitarbeiter
4. Überprüfen Sie die Browser-Konsole für Debug-Informationen
5. Stellen Sie sicher, dass der Mitarbeiter in Firestore existiert

#### 2. Passwort wurde nicht korrekt gespeichert
**Lösung:**
1. Erstellen Sie den Mitarbeiter neu
2. Notieren Sie sich das generierte Passwort genau
3. Verwenden Sie das Passwort in der Mobile App

#### 3. Firebase Konfiguration Problem
**Lösung:**
1. Überprüfen Sie, ob Web und Mobile App die gleiche Firebase-Konfiguration verwenden
2. Stellen Sie sicher, dass die Firebase-Konfiguration korrekt ist

### Debug-Schritte

#### Schritt 1: Mitarbeiter-Status überprüfen
```javascript
// In der Browser-Konsole der Web-App
// Nach Klick auf "Debug" Button
// Überprüfen Sie die Ausgabe für:
// - Firestore Employee Status
// - Firebase UID
// - Email-Adresse
```

#### Schritt 2: Mobile App Debug-Logs
```javascript
// In der Mobile App Konsole
// Überprüfen Sie die Logs für:
// - "Attempting login with:"
// - "Firebase Auth login successful"
// - Fehler-Codes und -Nachrichten
```

#### Schritt 3: Firebase Console überprüfen
1. Öffnen Sie [Firebase Console](https://console.firebase.google.com)
2. Wählen Sie Ihr Projekt
3. Gehen Sie zu "Authentication" → "Users"
4. Suchen Sie nach der E-Mail-Adresse des Mitarbeiters
5. Überprüfen Sie, ob der Benutzer existiert

### Häufige Fehler und Lösungen

#### Fehler: `auth/user-not-found`
- **Ursache**: Mitarbeiter existiert nicht in Firebase Auth
- **Lösung**: Mitarbeiter in Web-App neu erstellen

#### Fehler: `auth/wrong-password`
- **Ursache**: Falsches Passwort
- **Lösung**: Passwort aus der Web-App verwenden

#### Fehler: `auth/invalid-email`
- **Ursache**: Ungültige E-Mail-Adresse
- **Lösung**: E-Mail-Adresse überprüfen

#### Fehler: `auth/invalid-credential`
- **Ursache**: Kombination aus E-Mail und Passwort ist ungültig
- **Lösung**: 
  1. Mitarbeiter in Web-App neu erstellen
  2. Neues Passwort verwenden
  3. E-Mail-Adresse überprüfen

### Test-Prozedur

#### 1. Neuen Test-Mitarbeiter erstellen
1. Öffnen Sie die Web-App
2. Gehen Sie zu `/employees`
3. Klicken Sie auf "Mitarbeiter hinzufügen"
4. Füllen Sie die Felder aus:
   - Name: "Test Mitarbeiter"
   - E-Mail: "test@example.com"
   - Passwort: Lassen Sie es automatisch generieren
5. Klicken Sie auf "Erstellen"
6. **Wichtig**: Notieren Sie sich das generierte Passwort!

#### 2. Mobile App Test
1. Öffnen Sie die Mobile App
2. Geben Sie die E-Mail-Adresse ein: "test@example.com"
3. Geben Sie das notierte Passwort ein
4. Klicken Sie auf "Anmelden"

#### 3. Debug-Informationen sammeln
1. Klicken Sie auf "Debug" Button in der Web-App
2. Überprüfen Sie die Browser-Konsole
3. Überprüfen Sie die Mobile App Konsole
4. Notieren Sie sich alle Fehlermeldungen

### Firebase Console Überprüfung

#### Authentication Users
1. Firebase Console → Authentication → Users
2. Suchen Sie nach der E-Mail-Adresse
3. Überprüfen Sie:
   - Benutzer existiert
   - E-Mail ist verifiziert (falls erforderlich)
   - Benutzer ist nicht deaktiviert

#### Firestore Database
1. Firebase Console → Firestore Database
2. Suchen Sie in der `employees` Collection
3. Überprüfen Sie:
   - Dokument existiert
   - `email` Feld stimmt überein
   - `status` ist "active"
   - `firebaseUid` ist gesetzt

### Notfall-Lösung

Falls nichts funktioniert:

1. **Mitarbeiter löschen und neu erstellen**
   - Löschen Sie den Mitarbeiter in der Web-App
   - Erstellen Sie ihn neu
   - Verwenden Sie das neue Passwort

2. **Firebase Auth User manuell löschen**
   - Firebase Console → Authentication → Users
   - Löschen Sie den Benutzer
   - Erstellen Sie den Mitarbeiter in der Web-App neu

3. **Mobile App Cache leeren**
   - Mobile App komplett schließen
   - App neu starten
   - Erneut versuchen

### Support

Bei weiterhin bestehenden Problemen:
1. Sammeln Sie alle Debug-Logs
2. Notieren Sie die genauen Fehlermeldungen
3. Überprüfen Sie die Firebase Console
4. Kontaktieren Sie den Administrator 