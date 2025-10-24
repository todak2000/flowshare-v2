"""Authentication routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id, get_current_user_email
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User, UserCreate, UserRole

router = APIRouter()


@router.post("/register", response_model=User)
async def register_user(
    firebase_uid: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
):
    """
    Register a new user after Firebase authentication.
    This is called after the user signs up via Firebase Auth on the frontend.
    """
    db = get_firestore()

    # Check if user already exists
    users_ref = db.collection(FirestoreCollections.USERS)
    existing_user = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    if len(existing_user) > 0:
        # User already registered, return existing user
        user_data = existing_user[0].to_dict()
        return User(id=existing_user[0].id, **user_data)

    # Create new user
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()

    user_data = UserCreate(
        email=email,
        full_name=email.split("@")[0],  # Default name from email
        firebase_uid=firebase_uid,
        role=UserRole.COORDINATOR,  # Default role for first-time registration
    )

    user_doc = {
        **user_data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    await users_ref.document(user_id).set(user_doc)

    return User(id=user_id, **user_doc)


@router.get("/me", response_model=User)
async def get_current_user(
    firebase_uid: str = Depends(get_current_user_id),
):
    """Get current authenticated user."""
    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    # Find user by Firebase UID
    users = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    if len(users) == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users[0].to_dict()
    return User(id=users[0].id, **user_data)
