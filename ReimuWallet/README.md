# ReimuWallet (Android Native & Expo Application)

A production-quality, offline-first personal finance and automated ledger Android application built with React Native, Expo Router, SQLite (`expo-sqlite`), Zustand, and a native Kotlin `NotificationListenerService`.

## Features

- **100% Offline Sovereignty**: Pure local SQLite (`reimuwallet.db`) storage with zero remote telemetry or external tracking.
- **Strict Financial Logic**: Centralized calculations in `services/finance/`. Transfers move liquidity between wallets without falsely counting as income or expense (verified with 100% precision in Section 28 tests).
- **Native Android Notification Listener**: Custom Kotlin Android module (`ReimuNotificationListenerService`) configured via Expo Config Plugin (`plugins/notification-listener`). Automatically intercepts push notifications from DANA, GoPay, OVO, and Indonesian banks (BCA, Mandiri, BRI, BNI), parses amounts/merchants, and cues an in-app confirmation tray without silently inserting unverified data.
- **Budgeting & Capital Protection**: Category monthly limits with healthy, warning (>=85%), and exceeded states.
- **Savings Goals**: Milestone progress bars and quick deposits.
- **Data Portability**: Full JSON backup/restore with Zod schema verification, and CSV ledger export.
- **Security**: Local Biometric authentication and privacy balance toggles.

---

## Building Installable Android Artifacts

### 1. Build Development APK (`ReimuWallet-dev.apk`)

#### Option A: Via EAS Build (Cloud or Local Runner)
```bash
cd ReimuWallet
npm install
npx eas-cli build --profile development --platform android
```
Or for local compilation:
```bash
npx eas-cli build --profile development --platform android --local
```

#### Option B: Via Direct Android Studio / Gradle
```bash
cd ReimuWallet
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```
Output location:
`android/app/build/outputs/apk/debug/app-debug.apk` (renamed to `ReimuWallet-dev.apk`).

---

### 2. Build Production APK (`ReimuWallet.apk`)

```bash
cd ReimuWallet
npx eas-cli build --profile production-apk --platform android
```
Or locally via Gradle:
```bash
cd ReimuWallet
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
Output location:
`android/app/build/outputs/apk/release/app-release.apk` (renamed to `ReimuWallet.apk`).

---

### 3. Build Google Play Store Production Bundle (`ReimuWallet.aab`)

```bash
cd ReimuWallet
npx eas-cli build --profile production --platform android
```

---

## Running Verification Tests

Run the automated Section 28 financial calculation accuracy audit:
```bash
npx tsx ReimuWallet/tests/financialCalculations.test.ts
```
Expected output:
```
--- REIMUWALLET SECTION 28 FINANCIAL ACCURACY TEST ---
Result: PASSED (100% Accuracy)
```
