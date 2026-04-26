# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite bundle
npm run lint         # ESLint
npm run preview      # Preview production build

# Android / Capacitor
npm run cap:sync     # Build then sync to Capacitor Android project
npm run cap:open     # Open Android Studio
```

There are no automated tests in this project.

## Tech Stack

**LaviLog** is a Hebrew-language baby food and allergen tracking app — a hybrid React + Capacitor app that runs as a web app and as a native Android app.

- **Frontend**: React 18 + TypeScript, Vite
- **Backend**: Firebase (Auth + Firestore)
- **Mobile**: Capacitor 6 (Android bridge)
- **Styling**: Custom CSS — no Tailwind or component library
- **State**: React hooks only (`useState`, `useMemo`, `useCallback`) — no Redux or Context API

## Architecture

### Data Flow

```
Firebase Auth → useAppData (hook) → component state → UI
                     ↕
              Firestore (real-time listeners / onSnapshot)
```

The main custom hook `src/hooks/useAppData.ts` owns all app data. It sets up Firestore listeners for the active user's babies, foods, and exposures, filters by the selected baby, and exposes mutation helpers. Components receive data and callbacks as props.

### Firestore Schema

```
users/{userId}
├── babies/{babyId}
├── foods/{foodId}       ← FoodEntry, scoped by babyId field
└── exposures/{exposureId}  ← AllergenExposure, scoped by babyId field
```

Rules in `firestore.rules` allow read/write only when `request.auth.uid == userId`.

### Firebase Initialization (`src/firebase.ts`)

Two auth paths: standard Firebase Web SDK for browsers, and `@capacitor-firebase/authentication` plugin for Android. The `src/services/authService.ts` abstracts this with a single API.

### Navigation

No router library. Tab selection (`activeTab` state) is persisted to localStorage. Five tabs render their page component directly: Home | Calendar | Add | Insights | Settings.

### Key Files

| File | Purpose |
|---|---|
| `src/types.ts` | All data model types (`Baby`, `FoodEntry`, `AllergenExposure`, `ExposureDay`, `Reaction`) |
| `src/hooks/useAppData.ts` | Central state hook — Firestore listeners, active baby, CRUD helpers |
| `src/services/dataService.ts` | Raw Firestore operations (add, update, delete, migrate from localStorage) |
| `src/services/authService.ts` | Auth (email/password, Google Sign-in, web + native) |
| `src/utils/exposureUtils.ts` | Allergen exposure business logic (3-day protocol, day status, reactions) |
| `src/utils/utils.ts` | Hebrew localization helpers, date formatting |
| `src/utils/foodIcons.ts` | Food name → emoji mapping |
| `src/firebase.ts` | Firebase app + Firestore + Auth initialization |

### Allergen Exposure Protocol

A core domain concept: each `AllergenExposure` tracks a 3-day allergen introduction with an `ExposureDay[3]` tuple. Each day records status (`pending | completed | skipped`), meal details, and any `Reaction`. The `exposureUtils.ts` file contains all logic for determining active exposures, computed colors, and reaction severity.

### Environment Variables

Firebase config is read from `.env` with `VITE_` prefix (e.g., `VITE_FIREBASE_API_KEY`). The `.env` file is not committed.

### Conventions

- All UI strings and comments are in Hebrew.
- Dates stored as ISO `YYYY-MM-DD` strings; timestamps as `toISOString()`.
- IDs generated with `crypto.randomUUID()`.
- Android package ID: `com.lavilog.app`.
