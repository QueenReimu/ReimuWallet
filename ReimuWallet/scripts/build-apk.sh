#!/usr/bin/env bash
set -e

echo "=== REIMUWALLET PRODUCTION AND DEVELOPMENT APK BUILDER ==="

echo "Step 1: Checking TypeScript types..."
npx tsc --noEmit

echo "Step 2: Testing Financial Calculations..."
npx tsx tests/financialCalculations.test.ts

echo "Step 3: Running Expo Prebuild (generates native android project with notification listener plugin)..."
npx expo prebuild --platform android --clean

echo "Step 4: Compiling APK..."
echo "To build development APK: npx eas-cli build --profile development --platform android --local"
echo "Or locally via Gradle: cd android && ./gradlew assembleDebug (produces ReimuWallet-dev.apk)"
echo "To build production APK: npx eas-cli build --profile production-apk --platform android --local"
echo "Or locally via Gradle: cd android && ./gradlew assembleRelease (produces ReimuWallet.apk)"

echo "=== BUILD PIPELINE READY ==="
