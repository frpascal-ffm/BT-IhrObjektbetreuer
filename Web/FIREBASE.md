# Firebase Integration Guide

This project uses Firebase for backend services. Here's a guide on how to work with Firebase in this project.

## Setup

Firebase is already set up in this project with the following services:

- **Firebase Authentication**: For user login and registration
- **Firestore Database**: For storing structured data
- **Firebase Storage**: For storing files like images and documents

The Firebase configuration is in `src/lib/firebase.ts`.

## Available Firebase Components

### 1. Firebase Authentication (`/firebase/auth`)

A component that demonstrates how to:
- Register new users
- Sign in existing users
- Sign out users
- Get the current user

### 2. Firestore Example (`/firebase/firestore`)

A component that demonstrates how to:
- Add new documents to a collection
- Read documents from a collection
- Delete documents from a collection

## Helper Functions

We've created utility functions to make it easier to work with Firebase:

### Firestore Utilities (`src/lib/firestore.ts`)

- `getDocument`: Get a document by ID
- `getCollection`: Get all documents from a collection
- `queryDocuments`: Query documents with filters
- `addDocument`: Add a new document with auto-generated ID
- `setDocument`: Add a new document with a specified ID
- `updateDocument`: Update a document
- `deleteDocument`: Delete a document

### Usage Examples

#### Authentication

```typescript
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Sign up
const signUp = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing up:', error);
  }
};

// Sign in
const signIn = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing in:', error);
  }
};

// Sign out
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

#### Firestore

```typescript
import { addDocument, getCollection, updateDocument, deleteDocument } from '../lib/firestore';

// Add a document
const addItem = async (data) => {
  try {
    const id = await addDocument('items', data);
    return id;
  } catch (error) {
    console.error('Error adding item:', error);
  }
};

// Get all documents
const getAllItems = async () => {
  try {
    const items = await getCollection('items');
    return items;
  } catch (error) {
    console.error('Error getting items:', error);
  }
};

// Update a document
const updateItem = async (id, data) => {
  try {
    await updateDocument('items', id, data);
  } catch (error) {
    console.error('Error updating item:', error);
  }
};

// Delete a document
const deleteItem = async (id) => {
  try {
    await deleteDocument('items', id);
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};
```

## Security Rules

Firebase security rules are defined in:

- `firestore.rules` - Rules for Firestore Database
- `storage.rules` - Rules for Firebase Storage

To update these rules, use the Firebase CLI:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Deploying to Firebase

To deploy the entire application to Firebase Hosting:

1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage) 