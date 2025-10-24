#!/bin/bash

# Run Google Cloud Pub/Sub Emulator

echo "🚀 Starting Pub/Sub Emulator on localhost:8085..."
echo ""
echo "Press Ctrl+C to stop"
echo ""

gcloud beta emulators pubsub start --project=flowshare-v2 --host-port=localhost:8085
