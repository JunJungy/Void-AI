#!/bin/bash

echo "=========================================="
echo "Void AI - Android Build Script"
echo "=========================================="
echo ""
echo "Usage: ./scripts/build-android.sh [debug|release|bundle]"
echo "  debug   - Debug APK for testing"
echo "  release - Signed release APK"
echo "  bundle  - Signed AAB for Play Store (recommended)"
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
echo "Step 4: Building Android ($BUILD_TYPE)..."
cd android

case "$BUILD_TYPE" in
    "release")
        if [ ! -f "keystore/keystore.properties" ]; then
            echo "Error: keystore.properties not found!"
            echo "Run ./scripts/generate-keystore.sh first to create a signing key."
            exit 1
        fi
        ./gradlew assembleRelease
        OUTPUT_PATH="app/build/outputs/apk/release/app-release.apk"
        OUTPUT_TYPE="APK"
        ;;
    "bundle")
        if [ ! -f "keystore/keystore.properties" ]; then
            echo "Error: keystore.properties not found!"
            echo "Run ./scripts/generate-keystore.sh first to create a signing key."
            exit 1
        fi
        ./gradlew bundleRelease
        OUTPUT_PATH="app/build/outputs/bundle/release/app-release.aab"
        OUTPUT_TYPE="AAB (App Bundle)"
        ;;
    *)
        ./gradlew assembleDebug
        OUTPUT_PATH="app/build/outputs/apk/debug/app-debug.apk"
        OUTPUT_TYPE="APK"
        ;;
esac

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
echo "$OUTPUT_TYPE Location: android/$OUTPUT_PATH"
echo ""

if [ "$BUILD_TYPE" = "debug" ]; then
    echo "To install on device:"
    echo "  adb install android/$OUTPUT_PATH"
elif [ "$BUILD_TYPE" = "release" ]; then
    echo "This APK is signed and ready for distribution."
    echo "You can upload it to Play Store or share directly."
elif [ "$BUILD_TYPE" = "bundle" ]; then
    echo "This AAB is ready for Google Play Store upload."
    echo "Play Store will generate optimized APKs for each device."
fi
echo ""
