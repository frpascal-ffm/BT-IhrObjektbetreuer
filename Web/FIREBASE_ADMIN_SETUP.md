# Firebase Admin SDK Setup für Zugriffskontrolle

## Übersicht

Um eine ordnungsgemäße Zugriffskontrolle zwischen Administratoren (Web-App) und Mitarbeitern (Mobile App) zu implementieren, benötigen wir Firebase Admin SDK mit Custom Claims.

## Aktuelle Implementierung

### Web-App (Admin)
- Administratoren können neue Mitarbeiter erstellen
- Mitarbeiter werden in Firebase Auth erstellt
- Passwörter werden NICHT in Firestore gespeichert
- Mitarbeiter-Daten werden in Firestore mit Firebase UID gespeichert

### Mobile App (Mitarbeiter)
- Mitarbeiter melden sich mit Firebase Auth an
- Nach erfolgreicher Authentifizierung werden Mitarbeiter-Daten aus Firestore geladen
- Nur aktive Mitarbeiter können sich anmelden

## Benötigte Verbesserungen

### 1. Firebase Admin SDK Setup

Installieren Sie Firebase Admin SDK:

```bash
npm install firebase-admin
```

### 2. Cloud Function für Custom Claims

Erstellen Sie eine Cloud Function, um Admin-Status zu setzen:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verify the request is from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid, isAdmin } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error setting custom claims');
  }
});
```

### 3. Aktualisierte Firestore Rules

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
    
    // Other collections remain the same
    match /properties/{property} {
      allow read, write: if request.auth != null;
    }
    
    match /jobs/{job} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Web-App Integration

Aktualisieren Sie die `setAdminCustomClaims` Funktion in `src/lib/firestore.ts`:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setAdminClaimFunction = httpsCallable(functions, 'setAdminClaim');

export const setAdminCustomClaims = async (uid: string, isAdmin: boolean = false) => {
  try {
    await setAdminClaimFunction({ uid, isAdmin });
    console.log(`Admin claims set for UID ${uid}: ${isAdmin}`);
  } catch (error) {
    console.error('Error setting admin claims:', error);
    throw error;
  }
};
```

### 5. Mitarbeiter-Erstellung aktualisieren

Aktualisieren Sie die `create` Funktion in `employeesService`:

```typescript
async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'firebaseUid'> & { password: string }): Promise<string> {
  try {
    // First, create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      employee.email, 
      employee.password
    );
    
    const firebaseUid = userCredential.user.uid;
    
    // Set admin custom claims (false for regular employees)
    await setAdminCustomClaims(firebaseUid, false);
    
    // Then create Firestore document without password
    const { password, ...employeeData } = employee;
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employeeData,
      firebaseUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
}
```

## Deployment

### 1. Firebase Functions deployen

```bash
cd functions
npm run deploy
```

### 2. Firestore Rules aktualisieren

```bash
firebase deploy --only firestore:rules
```

### 3. Web-App builden und deployen

```bash
npm run build
firebase deploy --only hosting
```

## Sicherheitshinweise

1. **Custom Claims**: Custom Claims sind sicher und können nicht vom Client manipuliert werden
2. **Admin-Status**: Nur Benutzer mit Admin-Custom-Claim können Mitarbeiter erstellen/bearbeiten
3. **Passwort-Sicherheit**: Passwörter werden nur in Firebase Auth gespeichert, nie in Firestore
4. **Zugriffskontrolle**: Mitarbeiter können nur ihre eigenen Daten lesen, Admins können alle Daten verwalten

## Testen

### Admin-Funktionen testen
1. Melden Sie sich als Admin in der Web-App an
2. Erstellen Sie einen neuen Mitarbeiter
3. Überprüfen Sie, dass der Mitarbeiter in Firebase Auth erstellt wurde
4. Überprüfen Sie, dass keine Custom Claims gesetzt sind (admin: false)

### Mobile App testen
1. Melden Sie sich mit den Mitarbeiter-Credentials in der Mobile App an
2. Überprüfen Sie, dass nur die eigenen Termine angezeigt werden
3. Überprüfen Sie, dass keine Admin-Funktionen verfügbar sind

## Troubleshooting

### Häufige Probleme

1. **Custom Claims werden nicht gesetzt**
   - Überprüfen Sie, ob die Cloud Function deployed ist
   - Überprüfen Sie die Firebase Functions Logs

2. **Firestore Rules verweigern Zugriff**
   - Überprüfen Sie, ob die Custom Claims korrekt gesetzt sind
   - Testen Sie die Rules in der Firebase Console

3. **Mobile App kann sich nicht anmelden**
   - Überprüfen Sie, ob der Mitarbeiter in Firebase Auth existiert
   - Überprüfen Sie, ob der Mitarbeiter-Status in Firestore 'active' ist 