#!/usr/bin/env python3
"""
Create Pub/Sub topics and subscriptions for local development.

Run this after starting the Pub/Sub emulator:
  export PUBSUB_EMULATOR_HOST=localhost:8085
  python create-pubsub-topics.py
"""

import os
from google.cloud import pubsub_v1
from google.api_core.exceptions import AlreadyExists

# Ensure we're using the emulator
if "PUBSUB_EMULATOR_HOST" not in os.environ:
    print("⚠️  Warning: PUBSUB_EMULATOR_HOST not set")
    print("Set it with: export PUBSUB_EMULATOR_HOST=localhost:8085")
    print("")

PROJECT_ID = "flowshare-v2"

# Topics and their subscriptions
TOPICS = {
    "production-entry-created": ["production-entry-created-sub"],
    "entry-flagged": ["entry-flagged-sub"],
    "reconciliation-triggered": ["reconciliation-triggered-sub"],
    "reconciliation-complete": ["reconciliation-complete-sub"],
    "invitation-created": ["invitation-created-sub"]
}


def create_topics_and_subscriptions():
    """Create all required Pub/Sub topics and subscriptions."""
    publisher = pubsub_v1.PublisherClient()
    subscriber = pubsub_v1.SubscriberClient()

    print(f"📝 Creating topics and subscriptions in project: {PROJECT_ID}")
    print("")

    for topic_name, subscriptions in TOPICS.items():
        # Create topic
        topic_path = publisher.topic_path(PROJECT_ID, topic_name)
        try:
            publisher.create_topic(request={"name": topic_path})
            print(f"✅ Created topic: {topic_name}")
        except AlreadyExists:
            print(f"ℹ️  Topic already exists: {topic_name}")
        except Exception as e:
            print(f"❌ Error creating topic {topic_name}: {e}")
            continue

        # Create subscriptions
        for sub_name in subscriptions:
            subscription_path = subscriber.subscription_path(PROJECT_ID, sub_name)
            try:
                subscriber.create_subscription(
                    request={
                        "name": subscription_path,
                        "topic": topic_path,
                        "ack_deadline_seconds": 60,
                    }
                )
                print(f"  ✅ Created subscription: {sub_name}")
            except AlreadyExists:
                print(f"  ℹ️  Subscription already exists: {sub_name}")
            except Exception as e:
                print(f"  ❌ Error creating subscription {sub_name}: {e}")

    print("")
    print("🎉 Setup complete!")
    print("")
    print("Topics created:")
    for topic in TOPICS.keys():
        print(f"  • {topic}")
    print("")
    print("You can now start the agent services.")


if __name__ == "__main__":
    create_topics_and_subscriptions()
