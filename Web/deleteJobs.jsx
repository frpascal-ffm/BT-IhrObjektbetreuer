import React from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

// Firebase configuration from src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCi5ttsvEuAeUJOI6KMEsdKhJkkZ6sDHus",
  authDomain: "btihrobjektbetreuer.firebaseapp.com",
  projectId: "btihrobjektbetreuer",
  storageBucket: "btihrobjektbetreuer.firebasestorage.app",
  messagingSenderId: "305001906036",
  appId: "1:305001906036:web:81200a28803d6256093621"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const propertyId = 'RNhfmnqwuOu62X434jNy';

async function deletePropertyJobs() {
  try {
    console.log(`Fetching jobs for property ID: ${propertyId}...`);
    
    // Create a query to get all jobs with the specified property ID
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('propertyId', '==', propertyId)
    );
    
    // Execute the query
    const jobsSnapshot = await getDocs(jobsQuery);
    
    if (jobsSnapshot.empty) {
      console.log('No jobs found for this property.');
      return;
    }
    
    console.log(`Found ${jobsSnapshot.size} jobs to delete.`);
    
    // Create a batch to delete multiple documents
    const batch = writeBatch(db);
    let count = 0;
    
    // Queue each document for deletion
    jobsSnapshot.docs.forEach(doc => {
      console.log(`Queuing deletion for job: ${doc.id}`);
      batch.delete(doc.ref);
      count++;
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`Successfully deleted ${count} jobs for property ID ${propertyId}.`);
  } catch (error) {
    console.error('Error deleting jobs:', error);
  }
}

// Execute the function
deletePropertyJobs();

// This is just a placeholder component if this file is imported somewhere
function DeleteJobs() {
  return <div>Deleting jobs for property {propertyId}...</div>;
}

export default DeleteJobs; 