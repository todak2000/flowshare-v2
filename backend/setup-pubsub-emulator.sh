#!/bin/bash

# Setup script for Google Cloud Pub/Sub Emulator

echo "🚀 Setting up Pub/Sub Emulator for local development..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Install Pub/Sub emulator component
echo "📦 Installing Pub/Sub emulator component..."
gcloud components install pubsub-emulator

# Set emulator host
export PUBSUB_EMULATOR_HOST=localhost:8085

echo ""
echo "✅ Pub/Sub emulator setup complete!"
echo ""
echo "To start the emulator, run:"
echo "  gcloud beta emulators pubsub start --project=flowshare-v2 --host-port=localhost:8085"
echo ""
echo "Set this environment variable in your terminal:"
echo "  export PUBSUB_EMULATOR_HOST=localhost:8085"
