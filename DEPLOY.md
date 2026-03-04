# LaviLog Deployment Guide

## Prerequisites

1. **Firebase project** configured (see README.md)
2. **Android Studio** installed ([download](https://developer.android.com/studio))
3. **Google Play Developer account** ($25 one-time fee at [play.google.com/console](https://play.google.com/console))

## Step 1: Firebase Configuration

### Web (`.env` file)
1. Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings
2. Under "Your apps", click the web icon `</>` to add a web app
3. Copy the config values into your `.env` file (see `.env.example`)

### Android (`google-services.json`)
1. In Firebase Console > Project Settings > "Your apps", click the Android icon
2. Register app with package name: `com.lavilog.app`
3. Download `google-services.json`
4. Replace `android/app/google-services.json` with the downloaded file

### Firestore Rules
1. In Firebase Console > Firestore Database > Rules
2. Copy the content from `firestore.rules` and publish

### Enable Auth Providers
1. In Firebase Console > Authentication > Sign-in method
2. Enable "Email/Password"
3. Enable "Google" (add your SHA-1 fingerprint for Android)

## Step 2: Get SHA-1 Fingerprint

For Google Sign-In to work on Android, Firebase needs your signing key's SHA-1:

### Debug key (for testing)
```bash
cd android
./gradlew signingReport
```
Copy the SHA-1 from the debug variant and add it in Firebase Console > Project Settings > Android app > SHA certificate fingerprints.

### Release key (for Play Store)
```bash
keytool -list -v -keystore your-release-key.jks -alias your-alias
```

## Step 3: Build and Test

```bash
# Build web + sync to Android
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

In Android Studio:
- Click "Run" (green play button) to test on emulator
- Or connect a physical device via USB

## Step 4: Generate Signed AAB for Play Store

In Android Studio:
1. Go to **Build > Generate Signed Bundle/APK**
2. Select **Android App Bundle**
3. Create a new keystore or use existing one
4. Build the release AAB

The output AAB will be at: `android/app/release/app-release.aab`

## Step 5: Publish to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in the store listing (name: "LaviLog", description, screenshots)
4. Upload the AAB file
5. Set up content rating questionnaire
6. Set pricing (free)
7. Submit for review

## Updating the App

After making code changes:
```bash
npm run cap:sync    # Build + sync to Android
npm run cap:open    # Open in Android Studio to test/build
```
