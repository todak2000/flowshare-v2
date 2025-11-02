#!/bin/bash

# This script sets up the necessary Google Cloud resources for the Flowshare application.
# Run this script from the Google Cloud Shell.

# --- Configuration ---
# It is recommended to set these variables in your environment or replace the placeholders.
export GCP_PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
export GCP_REGION="${GCP_REGION:-your-gcp-region}"
export GITHUB_REPO="your-github-username/your-github-repo"

# --- Derived Variables ---
export GCP_SERVICE_ACCOUNT_NAME="github-actions-deployer"
export GCP_SERVICE_ACCOUNT="${GCP_SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# --- Script ---

echo "Setting project to ${GCP_PROJECT_ID}"
gcloud config set project ${GCP_PROJECT_ID}

echo "Enabling necessary Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  pubsub.googleapis.com

echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create flowshare-repo \
  --repository-format=docker \
  --location=${GCP_REGION} \
  --description="Docker repository for Flowshare application" \
  --quiet

echo "Creating IAM Service Account for GitHub Actions..."
gcloud iam service-accounts create ${GCP_SERVICE_ACCOUNT_NAME} \
  --display-name="GitHub Actions Deployer" \
  --quiet

echo "Granting roles to the Service Account..."
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} --member="serviceAccount:${GCP_SERVICE_ACCOUNT}" --role="roles/run.admin"
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} --member="serviceAccount:${GCP_SERVICE_ACCOUNT}" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} --member="serviceAccount:${GCP_SERVICE_ACCOUNT}" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} --member="serviceAccount:${GCP_SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"

echo "Setting up Workload Identity Federation..."
gcloud iam service-accounts add-iam-policy-binding ${GCP_SERVICE_ACCOUNT} \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe ${GCP_PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/subject/repo:${GITHUB_REPO}:ref:refs/heads/main"

# --- Create Pub/Sub Topics ---
echo "Creating Pub/Sub topics..."
gcloud pubsub topics create accountant-jobs
gcloud pubsub topics create auditor-jobs
gcloud pubsub topics create communicator-jobs

# --- Create Google Secrets ---
echo "Creating secrets in Google Secret Manager..."
# Create secrets with placeholder values. Update them in the Google Cloud Console.

# Backend Secrets
echo "-----BEGIN PRIVATE KEY-----\nXXXXX==\n-----END PRIVATE KEY-----" | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=- --replication-policy=automatic
echo "your-firebase-private-key-id" | gcloud secrets create FIREBASE_PRIVATE_KEY_ID --data-file=- --replication-policy=automatic
echo "your-firebase-client-email" | gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=- --replication-policy=automatic
echo "your-firebase-client-id" | gcloud secrets create FIREBASE_CLIENT_ID --data-file=- --replication-policy=automatic
echo "your-zepto-token" | gcloud secrets create ZEPTO_TOKEN --data-file=- --replication-policy=automatic
echo "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=- --replication-policy=automatic
echo "admin" | gcloud secrets create SWAGGER_USERNAME --data-file=- --replication-policy=automatic
echo "your-strong-swagger-password" | gcloud secrets create SWAGGER_PASSWORD --data-file=- --replication-policy=automatic
echo "your-demo-password" | gcloud secrets create DEMO_PASSWORD --data-file=- --replication-policy=automatic

# Frontend Secrets
echo "your-firebase-api-key" | gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --data-file=- --replication-policy=automatic
echo "your-firebase-auth-domain" | gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=- --replication-policy=automatic
echo "your-firebase-project-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=- --replication-policy=automatic
echo "your-firebase-storage-bucket" | gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=- --replication-policy=automatic


# --- Output ---
echo "
--- Setup Complete ---

Add the following secrets to your GitHub repository secrets:

GCP_PROJECT_ID: ${GCP_PROJECT_ID}
GCP_REGION: ${GCP_REGION}
GCP_SERVICE_ACCOUNT: ${GCP_SERVICE_ACCOUNT}
GCP_WORKLOAD_IDENTITY_PROVIDER: projects/$(gcloud projects describe ${GCP_PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool

Remember to update the placeholder values for the secrets in Google Secret Manager.
"


