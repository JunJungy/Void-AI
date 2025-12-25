#!/bin/bash

echo "=========================================="
echo "Void AI - Keystore Generation Script"
echo "=========================================="
echo ""
echo "This will create a keystore for signing your Play Store releases."
echo "IMPORTANT: Keep this keystore file and passwords safe!"
echo "           You will need them for ALL future app updates."
echo ""

KEYSTORE_DIR="android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/void-ai-release.keystore"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE_FILE" ]; then
    echo "Keystore already exists at: $KEYSTORE_FILE"
    echo "Delete it first if you want to generate a new one."
    exit 1
fi

echo "Please enter the following information:"
echo ""

read -p "Key alias (e.g., void-ai-key): " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-void-ai-key}

read -s -p "Keystore password (min 6 chars): " STORE_PASS
echo ""
read -s -p "Confirm keystore password: " STORE_PASS_CONFIRM
echo ""

if [ "$STORE_PASS" != "$STORE_PASS_CONFIRM" ]; then
    echo "Error: Passwords don't match!"
    exit 1
fi

if [ ${#STORE_PASS} -lt 6 ]; then
    echo "Error: Password must be at least 6 characters!"
    exit 1
fi

read -s -p "Key password (press Enter to use same as keystore): " KEY_PASS
echo ""
KEY_PASS=${KEY_PASS:-$STORE_PASS}

echo ""
echo "Certificate information (press Enter for defaults):"
read -p "Your name: " CN
CN=${CN:-Void AI Developer}

read -p "Organization: " O
O=${O:-Void AI}

read -p "City: " L
L=${L:-Unknown}

read -p "State: " ST
ST=${ST:-Unknown}

read -p "Country code (2 letters, e.g., US): " C
C=${C:-US}

echo ""
echo "Generating keystore..."

keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=$CN, O=$O, L=$L, ST=$ST, C=$C"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "KEYSTORE CREATED SUCCESSFULLY!"
    echo "=========================================="
    echo ""
    echo "Keystore location: $KEYSTORE_FILE"
    echo "Key alias: $KEY_ALIAS"
    echo ""
    echo "SAVE THESE CREDENTIALS SECURELY:"
    echo "  - Keystore password: (the one you entered)"
    echo "  - Key password: (the one you entered)"
    echo "  - Key alias: $KEY_ALIAS"
    echo ""
    echo "Now create a file: android/keystore/keystore.properties"
    echo "with the following content:"
    echo ""
    echo "storeFile=../keystore/void-ai-release.keystore"
    echo "storePassword=YOUR_STORE_PASSWORD"
    echo "keyAlias=$KEY_ALIAS"
    echo "keyPassword=YOUR_KEY_PASSWORD"
    echo ""
    echo "NOTE: Add android/keystore/ to .gitignore to keep it private!"
else
    echo "Error: Keystore generation failed!"
    exit 1
fi
