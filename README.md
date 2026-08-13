# Readable Books

Readable Books is a personal cloud-based PDF reader built as a Progressive Web App (PWA). It provides a Kindle-like reading experience, allowing users to read local PDF books and seamlessly synchronize their reading progress across all devices.

## 🚀 Features

- **Google Sign-In**: Secure and fast authentication using Firebase Auth.
- **Reading Progress Sync**: Automatically saves and restores the last opened page for each book in Cloud Firestore.
- **Auto-Save**: Saves reading progress on page change (debounced), tab close, visibility changes, or unloading.
- **Premium Kindle Aesthetics**: Cozy cream/slate minimal layouts, customizable stylized book covers, and distraction-free interface.
- **PWA Ready**: Installable on Android, iOS, Windows, and macOS.
- **Offline Support**: Service worker caching allows reading opened PDFs and UI navigation offline.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, React 19)
- **Styling**: Tailwind CSS
- **PDF Engine**: `react-pdf` / `pdfjs-dist`
- **Database & Auth**: Firebase (Authentication & Firestore)
- **Deployment**: Vercel

---

## 💻 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env.local` is present with the Firebase keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📘 Documentation
For a complete setup guide including Firebase console configuration and Firestore security rules, see [guide.md](file:///c:/Users/USER/Documents/ZUL/SERVICES/readable-books/guide.md).
