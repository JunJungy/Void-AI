#!/bin/bash

echo "=========================================="
echo "Void AI - Android APK Build Script"
echo "=========================================="
echo ""

BUILD_TYPE=${1:-debug}

echo "Step 1: Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Web build failed!"
    exit 1
fi

echo ""
echo "Step 2: Copying web assets to Android..."
npx cap copy android

if [ $? -ne 0 ]; then
    echo "Error: Capacitor copy failed!"
    exit 1
fi

echo ""
echo "Step 3: Making gradlew executable..."
chmod +x android/gradlew

echo ""
echo "Step 4: Building Android APK ($BUILD_TYPE)..."
cd android

if [ "$BUILD_TYPE" = "release" ]; then
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
else
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

if [ $? -ne 0 ]; then
    echo "Error: Gradle build failed!"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo "BUILD SUCCESSFUL!"
echo "=========================================="
echo ""
echo "APK Location: android/$APK_PATH"
echo ""
echo "To install on device:"
echo "  adb install android/$APK_PATH"
echo ""
