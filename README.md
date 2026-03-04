# LaviLog

Baby food & allergen tracking app with Firebase backend and Android support via Capacitor.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- A [Firebase](https://console.firebase.google.com/) project

### Installation

```bash
npm install
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** (Email/Password + Google Sign-In)
3. Enable **Cloud Firestore** and set rules from `firestore.rules`
4. Go to Project Settings > General > Your Apps > Add Web App
5. Copy the config values and create a `.env` file:

```bash
cp .env.example .env
# Then fill in your Firebase config values
```

### Running the App (Web)

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Android

1. Download `google-services.json` from Firebase Console (Project Settings > Android app) and replace the placeholder at `android/app/google-services.json`
2. To register the Android app in Firebase, use package name: `com.lavilog.app`
3. Build and sync:

```bash
npm run cap:sync
```

4. Open in Android Studio:

```bash
npm run cap:open
```

5. From Android Studio, run on emulator or generate a signed APK/AAB

### Building for Production (Web)

```bash
npm run build
npm run preview
```

## Usage

1. **Sign in** with email/password or Google
2. **Add a baby** profile on first use
3. **Add food entries** with preference (loved/okay/refused)
4. **Track allergen exposures** with 3-day follow-up
5. **Switch between babies** using the baby switcher
6. **View data** in list, calendar, or explorer modes

Data is stored in Firebase Firestore and syncs across devices.
