# Smartphone Telemetry Dashboard

A Firebase-powered telemetry dashboard built with React + Vite, synchronized with the SmartDeviceTracker Android app through Firestore.

## Features

- Email/password and Google authentication
- Secure Firestore rules scoped to the authenticated user's data only
- Real-time dashboard with device status, recent telemetry, and charts
- Map view with latest known location and historical route tracing
- User-configurable telemetry upload interval stored in Firestore
- Responsive SaaS dashboard layout with light and dark themes
- Empty-state and loading handling

The Settings page stores `telemetryIntervalMinutes` on the signed-in user's
Firestore document. The Android uploader must read and apply this value to
change how often it uploads; this repository contains the dashboard, not the
Android uploader. Devices are shown as active only when collection is enabled
and their `lastSeen` heartbeat is newer than the configured upload interval;
the status refreshes every 30 seconds.

### User activity

The web app records sign-in, logout, foreground/background transitions, and
throttled meaningful interactions in `userActivity/{uid}`. Online status means
the app is foregrounded and the last meaningful interaction was within the
last five minutes; a recent login by itself does not mark a user online.
After a foreground transition, the user must interact again before being shown
online.
The `/admin/activity` page is available only to Firebase Auth users with the
trusted custom claim `admin: true`; its Firestore reads are restricted by the
same claim. Set or revoke that claim only in a trusted Admin SDK environment,
never in the browser app.

The Android app writes each telemetry record to the root
`telemetry/{recordId}` collection, scoped by its authenticated `userId`, and
keeps a per-device copy under
`users/{uid}/devices/{deviceId}/sensorRecords/{recordId}`. The website listens
to the root collection, newest first, and pages through older records with
Firestore cursors. Location collection requires runtime permission and
explicit user consent in the Android app; unavailable sensor fields are not
represented as fabricated zero values.

## Local setup

1. Copy `.env.example` to `.env`
2. Add your Firebase web configuration values
3. Install dependencies:
   npm install
4. Start the local dev server:
   npm run dev

## Firebase setup

This repository is connected to the `smartdevicetracker` Firebase project. Its
default Firestore database is hosted in `asia-south1` (Mumbai), and the rules
and indexes are defined in `firestore.rules` and `firestore.indexes.json`.

1. In Firebase Console, open **Authentication → Sign-in method** and enable
   **Email/Password** and **Google** sign-in. Set a support email for Google.
2. The web app config is read from the `VITE_FIREBASE_*` values in `.env`.
   Keep `.env` local and do not commit it; use `.env.example` as the template.
3. To deploy Firestore rules and indexes after changing them, run:

   ```bash
   firebase deploy --only firestore --project smartdevicetracker
   ```

The user activity view requires the trusted Firebase Auth custom claim
`admin: true`. Assign that claim only from a trusted Admin SDK environment.
No Cloud Functions are needed for the web activity tracking; there is no
Admin SDK or service-account credential in the browser app.

## Firebase hosting

```bash
npm run lint
npm run build
firebase deploy --only hosting,firestore --project smartdevicetracker
```

For SPA routing, keep the rewrite rule in `firebase.json` pointing all routes to `/index.html`.

## Android build and tests

From the Android app repository, run:

```bash
./gradlew testDebugUnitTest assembleDebug
```
