# Firebase Implementation Guide - Shine On Cosmetics

This guide will help you connect your project to Firebase and enable Authentication, Firestore, and Hosting.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add Project"** and name it `Shine On Cosmetics`.
3. Disable Google Analytics (optional).

## 2. Register Web App

1. Inside the project dashboard, click the **Web (</>)** icon.
2. Register the app as `ShineOnWeb`.
3. Copy the `firebaseConfig` object.

## 3. Configure the Project

1. Open `/js/firebase-config.js` in your editor.
2. Replace the placeholder values with the ones you copied.

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

## 4. Enable Authentication

1. In the Firebase Sidebar, click **Authentication**.
2. Click **Get Started**.
3. Enable **Email/Password** as a sign-in provider.

## 5. Enable Firestore Database

1. In the Firebase Sidebar, click **Firestore Database**.
2. Click **Create Database**.
3. Start in **Test Mode** (for development) and select a location.
4. Create the following collections:
   - `products`: Product documents.
   - `orders`: User orders.
   - `users`: User profile data.

## 6. Security Rules (Firestore)

Set these rules in the **Rules** tab of Firestore to allow users to read products but only write their own data:

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
      allow write: if false; // Admin only via Admin SDK/Dashboard
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /orders/{orderId} {
      allow read: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## 7. Hosting Deployment

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init project in root: `firebase init` (Select Hosting)
4. Deploy: `firebase deploy`

---

Your project is now fully connected to the Firebase ecosystem!
