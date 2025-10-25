"""User management routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User, NotificationSettings

router = APIRouter()


class UserUpdate(BaseModel):
    """User update model."""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    notification_settings: Optional[NotificationSettings] = None


@router.patch("/me", response_model=User)
async def update_my_profile(
    user_update: UserUpdate,
    firebase_uid: str = Depends(get_current_user_id),
):
    """Update the current user's profile."""
    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    # Find user by Firebase UID
    user_query = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc_ref = user_query[0].reference
    user_id = user_query[0].id

    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)

    # Convert notification_settings to dict if provided
    if "notification_settings" in update_data and update_data["notification_settings"]:
        update_data["notification_settings"] = update_data["notification_settings"].model_dump()

    update_data["updated_at"] = datetime.now(timezone.utc)

    await user_doc_ref.update(update_data)

    # Fetch updated user
    updated_doc = await user_doc_ref.get()
    return User(id=user_id, **updated_doc.to_dict())
