// Migration Script: Alte Struktur zu User-basierter Struktur
// Führen Sie dieses Skript aus, um bestehende Daten zu migrieren

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9tQAoLPpl2sKF5d67lfB4r7jozKBApg4",
  authDomain: "bt-404.firebaseapp.com",
  projectId: "bt-404",
  storageBucket: "bt-404.firebasestorage.app",
  messagingSenderId: "121673037816",
  appId: "1:121673037816:web:e9faea38e0d2d505c9080d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Migration von Properties
async function migrateProperties() {
  console.log('🔄 Migrating properties...');
  
  try {
    const oldProperties = await getDocs(collection(db, 'properties'));
    let migratedCount = 0;
    
    for (const doc of oldProperties.docs) {
      const property = doc.data();
      
      // Versuche companyId oder owner zu finden
      let companyId = property.companyId || property.owner;
      
      // Falls keine companyId vorhanden, versuche sie aus users zu finden
      if (!companyId) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          // Verwende die erste User-ID als Fallback
          companyId = usersSnapshot.docs[0].id;
        }
      }
      
      if (companyId) {
        await addDoc(collection(db, 'users', companyId, 'properties'), {
          ...property,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        migratedCount++;
        console.log(`✅ Migrated property: ${property.name}`);
      } else {
        console.warn(`⚠️ Could not find company for property: ${property.name}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} properties`);
  } catch (error) {
    console.error('❌ Error migrating properties:', error);
  }
}

// Migration von Jobs
async function migrateJobs() {
  console.log('🔄 Migrating jobs...');
  
  try {
    const oldJobs = await getDocs(collection(db, 'jobs'));
    let migratedCount = 0;
    
    for (const doc of oldJobs.docs) {
      const job = doc.data();
      
      // Versuche companyId zu finden
      let companyId = job.companyId;
      
      // Falls keine companyId vorhanden, versuche sie aus users zu finden
      if (!companyId) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          companyId = usersSnapshot.docs[0].id;
        }
      }
      
      if (companyId) {
        await addDoc(collection(db, 'users', companyId, 'jobs'), {
          ...job,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        migratedCount++;
        console.log(`✅ Migrated job: ${job.title}`);
      } else {
        console.warn(`⚠️ Could not find company for job: ${job.title}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} jobs`);
  } catch (error) {
    console.error('❌ Error migrating jobs:', error);
  }
}

// Migration von Employees
async function migrateEmployees() {
  console.log('🔄 Migrating employees...');
  
  try {
    const oldEmployees = await getDocs(collection(db, 'employees'));
    let migratedCount = 0;
    
    for (const doc of oldEmployees.docs) {
      const employee = doc.data();
      
      // Versuche companyId zu finden
      let companyId = employee.companyId;
      
      // Falls keine companyId vorhanden, versuche sie aus users zu finden
      if (!companyId) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          companyId = usersSnapshot.docs[0].id;
        }
      }
      
      if (companyId) {
        await addDoc(collection(db, 'users', companyId, 'employees'), {
          ...employee,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        migratedCount++;
        console.log(`✅ Migrated employee: ${employee.name}`);
      } else {
        console.warn(`⚠️ Could not find company for employee: ${employee.name}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} employees`);
  } catch (error) {
    console.error('❌ Error migrating employees:', error);
  }
}

// Migration von Appointments
async function migrateAppointments() {
  console.log('🔄 Migrating appointments...');
  
  try {
    const oldAppointments = await getDocs(collection(db, 'appointments'));
    let migratedCount = 0;
    
    for (const doc of oldAppointments.docs) {
      const appointment = doc.data();
      
      // Versuche companyId zu finden
      let companyId = appointment.companyId;
      
      // Falls keine companyId vorhanden, versuche sie aus users zu finden
      if (!companyId) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          companyId = usersSnapshot.docs[0].id;
        }
      }
      
      if (companyId) {
        await addDoc(collection(db, 'users', companyId, 'appointments'), {
          ...appointment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        migratedCount++;
        console.log(`✅ Migrated appointment: ${appointment.title}`);
      } else {
        console.warn(`⚠️ Could not find company for appointment: ${appointment.title}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} appointments`);
  } catch (error) {
    console.error('❌ Error migrating appointments:', error);
  }
}

// Hauptfunktion für die Migration
async function runMigration() {
  console.log('🚀 Starting migration to user-based structure...');
  console.log('⚠️  WARNING: This will create duplicate data. Please backup your database first!');
  
  // Warten auf Bestätigung (in einer echten Umgebung würden Sie hier eine Eingabeaufforderung haben)
  console.log('⏳ Waiting 5 seconds before starting migration...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    await migrateProperties();
    await migrateJobs();
    await migrateEmployees();
    await migrateAppointments();
    
    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Test the new structure thoroughly');
    console.log('   2. Update your application to use the new structure');
    console.log('   3. Remove legacy code and Firestore rules');
    console.log('   4. Clean up old collections if everything works');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Skript ausführen
runMigration().catch(console.error);

export { runMigration }; 