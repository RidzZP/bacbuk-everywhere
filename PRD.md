# PRD — Readable Books (Personal Cloud Reader)

## 1. Overview

Readable Books adalah aplikasi pembaca PDF pribadi berbasis web yang memungkinkan pengguna melanjutkan membaca buku dari perangkat mana pun tanpa kehilangan posisi halaman terakhir.

Aplikasi akan berjalan sebagai Progressive Web App (PWA), dapat di-install di Android, iPhone, Windows, dan macOS, serta di-deploy sepenuhnya di Vercel tanpa backend custom.

Sinkronisasi progress dilakukan menggunakan Firebase Authentication dan Firestore.

Target utama aplikasi adalah memberikan pengalaman seperti Kindle:

* Baca PDF di laptop
* Tutup aplikasi
* Buka aplikasi di HP
* Otomatis melanjutkan dari halaman terakhir

---

## 2. Goals

### Primary Goals

* Membaca file PDF dengan nyaman
* Menyimpan halaman terakhir secara otomatis
* Sinkronisasi progress antar device
* Login menggunakan Google
* PWA installable
* Deploy ke Vercel
* Tanpa backend custom
* Tanpa server VPS

### Non Goals (V1)

* Marketplace buku
* Upload buku publik
* Multi-user collaboration
* Annotation
* Highlight
* OCR
* AI Summary

---

## 3. Tech Stack

### Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* App Router

### PDF Engine

* PDF.js
* react-pdf

### Authentication

* Firebase Auth
* Google Sign-In

### Database

* Firestore

### Deployment

* Vercel

### PWA

* next-pwa
* Service Worker
* Web Manifest

---

## 4. User Flow

### First Visit

```text
Open App
↓
Login Google
↓
Enter Library
```

### Read Book

```text
Open Book
↓
Load Last Progress
↓
Jump To Last Page
↓
Read
↓
Auto Save Progress
```

### Continue On Another Device

```text
Login Same Google Account
↓
Open Same Book
↓
Fetch Progress From Firestore
↓
Resume Reading
```

---

## 5. Authentication Requirements

### Login

Provider:

* Google Only

### Session

* Persist login
* Auto login if session exists

### Logout

* Available from profile menu

---

## 6. Firestore Data Model

Collection Structure

```text
users
 └── {uid}
      └── books
           └── {bookId}
```

Book Progress Document

```json
{
  "bookId": "atomic-habits",
  "title": "Atomic Habits",
  "currentPage": 187,
  "totalPages": 320,
  "lastOpenedAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 7. Book Source Strategy

Books stored locally inside project.

```text
public/books
├── atomic-habits.pdf
├── deep-work.pdf
├── psychology-of-money.pdf
```

Metadata file:

```json
[
  {
    "id": "atomic-habits",
    "title": "Atomic Habits",
    "author": "James Clear",
    "file": "/books/atomic-habits.pdf"
  }
]
```

---

## 8. Pages

### Login

Route

```text
/login
```

Features

* Google Sign In
* Redirect to Library

---

### Library

Route

```text
/
```

Features

* Show all books
* Show reading progress
* Continue Reading button
* Search books

Card Example

```text
Atomic Habits
Page 187 / 320
Continue Reading
```

---

### Reader

Route

```text
/reader/[bookId]
```

Features

* Render PDF
* Next page
* Previous page
* Jump page
* Fullscreen
* Progress bar
* Auto save progress

---

## 9. Auto Save Logic

Trigger save when:

* Page changes
* Book closes
* Window unload
* Visibility changes

Debounce:

```text
1000ms
```

Firestore Update Example

```typescript
await saveProgress({
  bookId,
  currentPage,
  totalPages,
});
```

---

## 10. Resume Logic

When book opens:

```typescript
loadProgress(bookId);
jumpToSavedPage();
```

Fallback:

```text
Page 1
```

if no progress exists.

---

## 11. UI Requirements

Theme

* Clean
* Kindle-like
* Minimal

Color Mode

* Light
* Dark

Responsive

* Mobile First
* Tablet
* Desktop

---

## 12. Reader Layout

Desktop

```text
-----------------------------------
Toolbar
-----------------------------------

PDF VIEWER

-----------------------------------
Prev | Page | Next
-----------------------------------
```

Mobile

```text
------------------
Toolbar
------------------

PDF

------------------
Prev  Next
------------------
```

---

## 13. PWA Requirements

Installable:

* Android
* iPhone
* Windows
* macOS

Manifest

```json
{
  "name": "Readable Books",
  "short_name": "Readable",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

Offline Support

Cache:

* HTML
* JS
* CSS
* Fonts
* Opened PDFs

---

## 14. Security

Firestore Rules

User may only access own documents.

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

---

## 15. Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

AI Agent should populate these using the Firebase configuration supplied separately.

---

## 16. Folder Structure

```text
src
├── app
│   ├── page.tsx
│   ├── login
│   └── reader
│       └── [bookId]
│
├── components
│   ├── BookCard.tsx
│   ├── PdfReader.tsx
│   ├── ReaderToolbar.tsx
│   └── ProgressBar.tsx
│
├── lib
│   ├── firebase.ts
│   ├── auth.ts
│   ├── firestore.ts
│   └── books.ts
│
├── hooks
│   ├── useAuth.ts
│   └── useReadingProgress.ts
│
├── types
│
└── data
    └── books.json
```

---

## 17. Acceptance Criteria

### Login

* User can login with Google
* Session persists after refresh

### Library

* Books displayed correctly
* Reading progress visible

### Reader

* PDF loads successfully
* Page navigation works
* Resume page works

### Sync

* Read on laptop
* Open on phone
* Resume same page

### PWA

* Installable on Android
* Installable on iPhone
* Installable on Desktop

### Deployment

* Deploy successfully to Vercel
* No custom backend required
* Uses Firebase Auth + Firestore only

---

## 18. Future Roadmap (V2)

* Upload PDF from UI
* Bookmark pages
* Reading notes
* Highlight text
* Reading statistics
* Recently opened books
* Multiple libraries
* Import from Google Drive
* EPUB support
* Kindle-style reading dashboard
