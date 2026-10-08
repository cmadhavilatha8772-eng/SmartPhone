# Smartphone Telemetry Dashboard

A Firebase-powered telemetry dashboard built with React + Vite, designed for a future Android app that uploads smartphone telemetry to Firestore.

## Features

- Email/password and Google authentication
- Secure Firestore rules scoped to the authenticated user's data only
- Real-time dashboard with device status, recent telemetry, and charts
- Map view with latest known location and historical route tracing
- Responsive SaaS dashboard layout with light and dark themes
- Empty-state and loading handling

## Local setup

1. Copy `.env.example` to `.env`
2. Add your Firebase web configuration values
3. Install dependencies:
   npm install
4. Start the local dev server:
   npm run dev

## Firebase setup

1. Create a project in Firebase Console
2. Enable Email/Password auth and Google Sign-In
3. Create a Firestore Database
4. Update the security rules from `firestore.rules`
5. Add the config to `.env`

## Firebase hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

For SPA routing, keep the rewrite rule in `firebase.json` pointing all routes to `/index.html`.
