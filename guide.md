# Readable Books - Guide Setup

This guide provides simple instructions on how to set up and run the **Readable Books** application.

## 1. Firebase Setup

This project uses **Firebase Auth** (for Google Sign-In) and **Cloud Firestore** (to sync reading progress).

### A. Enable Google Sign-In
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select the `readable-books` project.
3. In the left menu, click **Build** > **Authentication**.
4. Go to the **Sign-in method** tab.
5. Click **Add new provider**, select **Google**, enable it, choose a project support email, and click **Save**.

### B. Setup Cloud Firestore Database
1. In the left menu, click **Build** > **Firestore Database**.
2. Click **Create database** (choose your closest server region).
3. Select **Start in test mode** or **production mode**.
4. Once the database is created, navigate to the **Rules** tab and paste the following security rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
      && request.auth.uid == userId;
    }

  }
}
```
5. Click **Publish**.

---

## 2. Local Development

To run the application locally, follow these steps:

### A. Environment Configuration
The environment variables are already populated inside `.env.local` at the root of the project using the configuration provided in `firebase.config.json`.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCeyHnqfBHpasqygIZVzn0Cho7ZsEWtfQw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=readable-books.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=readable-books
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=readable-books.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=865838092640
NEXT_PUBLIC_FIREBASE_APP_ID=1:865838092640:web:664afb982289718a770e05
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-62TVJT2QYY
```

### B. Run Development Server
Run the following command to start the app in development mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 3. PWA Installation

Once the app is running:
- **On Desktop (Chrome/Edge)**: An "Install App" button will appear in the library header, or click the install icon in the browser address bar.
- **On Mobile (Safari/Chrome)**:
  - iOS Safari: Click the **Share** button, then select **Add to Home Screen**.
  - Android Chrome: Tap the three-dot menu, then select **Install app** or follow the prompt.

---

## 4. Reading Progress & Syncing

- **Auto-Save**: Progress is saved automatically 1000ms after you stop changing pages, when navigating back to the library, switching tabs/minimizing the window, or closing the tab.
- **Syncing**: Log in with the same Google Account on multiple devices (phone, tablet, computer). Opening any book will automatically fetch your last read position and jump directly to that page.
