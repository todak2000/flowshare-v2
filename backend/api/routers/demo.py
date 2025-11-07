"""Demo/Admin routes - bypasses authentication for testing."""
from fastapi import APIRouter, HTTPException, Body, status
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import sys
import uuid
import logging
import secrets
import random
from faker import Faker
from firebase_admin import auth as firebase_auth

sys.path.append("../..")

from shared.database import get_firestore, FirestoreCollections
from shared.models.production import ProductionEntry, ProductionEntryCreate, ProductionEntryStatus
from shared.models.user import UserRole
from shared.models.tenant import SubscriptionPlan, TenantSettings
from shared.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
fake = Faker()


def check_demo_access():
    """
    Check if demo endpoints are accessible.
    Demo endpoints require DEMO_PASSWORD to be configured for security and both dev and prod.
    """
    if not settings.demo_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo endpoints are not configured. Set DEMO_PASSWORD environment variable."
        )


def generate_disproportionate_multipliers(num_partners: int = 4) -> List[float]:
    """
    Generate disproportionate multipliers for partners ensuring no two are within 5% of each other.
    Returns multipliers that scale production values differently for each partner.
    """
    multipliers = []
    base = 0.5  # Start at 50% of base value
    increment = 0.15  # Minimum 15% difference between partners

    for i in range(num_partners):
        # Add some randomness but ensure minimum 15% gap
        multiplier = base + (i * increment) + random.uniform(0, 0.05)
        multipliers.append(multiplier)

    # Shuffle to avoid predictable ordering
    random.shuffle(multipliers)

    # Verify no two are within 5%
    for i in range(len(multipliers)):
        for j in range(i + 1, len(multipliers)):
            if abs(multipliers[i] - multipliers[j]) < 0.05:
                # If too close, adjust one of them
                multipliers[j] += 0.06

    return multipliers


class DemoTenantRequest(BaseModel):
    """Request to create a demo tenant with users and data."""
    password: str
    num_partners: int = 4
    generate_data_months: int = 3  # Number of months of production data to generate


class UserCredentials(BaseModel):
    """User credentials for demo purposes."""
    id: str
    email: str
    password: str
    full_name: str
    role: str
    organization: Optional[str] = None
    partner_id: Optional[str] = None


class DemoTenantResponse(BaseModel):
    """Response after creating demo tenant."""
    tenant_id: str
    tenant_name: str
    coordinator: UserCredentials
    partners: List[UserCredentials]
    field_operators: List[UserCredentials]
    production_entries_created: int
    message: str


class DemoTenantInfo(BaseModel):
    """Information about existing demo tenant."""
    tenant_id: str
    tenant_name: str
    created_at: str
    coordinator: UserCredentials
    partners: List[UserCredentials]
    field_operators: List[UserCredentials]


@router.post("/demo/create-tenant", response_model=DemoTenantResponse)
async def create_demo_tenant(request: DemoTenantRequest = Body(...)):
    """
    Create a complete demo tenant with:
    - 1 Coordinator
    - N Partners (default 4)
    - N Field Operators (1 per partner)
    - Production data for last N months (excluding current month)

    All users use default password: Qwerty@12345
    All data is marked with is_demo: True for easy cleanup
    """
    check_demo_access()

    # Verify password
    if not secrets.compare_digest(request.password, settings.demo_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password"
        )

    db = get_firestore()
    now = datetime.now(timezone.utc)
    default_password = "Qwerty@12345"

    try:
        # 1. Create Tenant
        tenant_id = str(uuid.uuid4())
        tenant_name = f"Demo {fake.company()} Terminal JV"

        tenant_doc = {
            "id": tenant_id,
            "name": tenant_name,
            "owner_id": "",  # Will update with coordinator ID
            "subscription_plan": SubscriptionPlan.PROFESSIONAL.value,
            "status": "active",
            "settings": {
                "allocation_model": "api_mpms_11_1",
                "default_temperature_standard": 60.0,
                "default_pressure_standard": 14.696
            },
            "is_demo": True,  # Mark as demo data
            "created_at": now,
            "updated_at": now
        }

        await db.collection(FirestoreCollections.TENANTS).document(tenant_id).set(tenant_doc)
        logger.info(f"Created demo tenant: {tenant_id}")

        # 2. Create Coordinator
        coordinator_email = fake.email()
        coordinator_name = fake.name()

        # Create Firebase user
        coordinator_firebase = firebase_auth.create_user(
            email=coordinator_email,
            password=default_password,
            display_name=coordinator_name
        )

        coordinator_id = str(uuid.uuid4())
        coordinator_doc = {
            "id": coordinator_id,
            "firebase_uid": coordinator_firebase.uid,
            "email": coordinator_email,
            "normalized_email": coordinator_email.lower(),
            "full_name": coordinator_name,
            "phone_number": fake.phone_number(),
            "role": UserRole.COORDINATOR.value,
            "tenant_ids": [tenant_id],
            "notification_settings": {
                "email_reports": True,
                "email_anomaly_alerts": True
            },
            "subscription_plan": SubscriptionPlan.PROFESSIONAL.value,
            "is_demo": True,
            "created_at": now,
            "updated_at": now
        }

        await db.collection(FirestoreCollections.USERS).document(coordinator_id).set(coordinator_doc)

        # Update tenant owner_id
        await db.collection(FirestoreCollections.TENANTS).document(tenant_id).update({
            "owner_id": coordinator_id
        })

        coordinator_creds = UserCredentials(
            id=coordinator_id,
            email=coordinator_email,
            password=default_password,
            full_name=coordinator_name,
            role=UserRole.COORDINATOR.value
        )

        logger.info(f"Created coordinator: {coordinator_id}")

        # 3. Create Partners and Field Operators
        partners_creds = []
        field_operators_creds = []
        partner_ids = []

        for i in range(request.num_partners):
            # Create Partner
            partner_email = fake.email()
            partner_name = fake.name()
            company_name = fake.company()

            partner_firebase = firebase_auth.create_user(
                email=partner_email,
                password=default_password,
                display_name=partner_name
            )

            partner_id = str(uuid.uuid4())
            partner_ids.append(partner_id)

            partner_doc = {
                "id": partner_id,
                "firebase_uid": partner_firebase.uid,
                "email": partner_email,
                "normalized_email": partner_email.lower(),
                "full_name": partner_name,
                "phone_number": fake.phone_number(),
                "role": UserRole.PARTNER.value,
                "organization": company_name,
                "tenant_ids": [tenant_id],
                "notification_settings": {
                    "email_reports": True,
                    "email_anomaly_alerts": True
                },
                "subscription_plan": SubscriptionPlan.PROFESSIONAL.value,
                "is_demo": True,
                "created_at": now,
                "updated_at": now
            }

            await db.collection(FirestoreCollections.USERS).document(partner_id).set(partner_doc)

            partners_creds.append(UserCredentials(
                id=partner_id,
                email=partner_email,
                password=default_password,
                full_name=partner_name,
                role=UserRole.PARTNER.value,
                organization=company_name
            ))

            logger.info(f"Created partner: {partner_id}")

            # Create Field Operator for this Partner
            operator_email = fake.email()
            operator_name = fake.name()

            operator_firebase = firebase_auth.create_user(
                email=operator_email,
                password=default_password,
                display_name=operator_name
            )

            operator_id = str(uuid.uuid4())

            operator_doc = {
                "id": operator_id,
                "firebase_uid": operator_firebase.uid,
                "email": operator_email,
                "normalized_email": operator_email.lower(),
                "full_name": operator_name,
                "phone_number": fake.phone_number(),
                "role": UserRole.FIELD_OPERATOR.value,
                "partner_id": partner_id,
                "tenant_ids": [tenant_id],
                "notification_settings": {
                    "email_reports": True,
                    "email_anomaly_alerts": True
                },
                "subscription_plan": SubscriptionPlan.PROFESSIONAL.value,
                "is_demo": True,
                "created_at": now,
                "updated_at": now
            }

            await db.collection(FirestoreCollections.USERS).document(operator_id).set(operator_doc)

            field_operators_creds.append(UserCredentials(
                id=operator_id,
                email=operator_email,
                password=default_password,
                full_name=operator_name,
                role=UserRole.FIELD_OPERATOR.value,
                partner_id=partner_id,
                organization=company_name
            ))

            logger.info(f"Created field operator: {operator_id}")

        # 4. Generate Production Data for Last N Months (excluding current month)
        production_entries_created = 0

        # Get disproportionate multipliers for each partner
        partner_multipliers = generate_disproportionate_multipliers(request.num_partners)

        # Calculate date range: last N months, excluding current month
        today = datetime.now(timezone.utc)
        current_month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Start from N months ago
        start_date = current_month_start - timedelta(days=request.generate_data_months * 31)
        start_date = start_date.replace(day=1)

        # End at the last day of previous month
        end_date = current_month_start - timedelta(days=1)

        logger.info(f"Generating production data from {start_date} to {end_date}")

        # Generate data for each day
        current_date = start_date
        while current_date <= end_date:
            # Create entry for each partner
            for idx, partner_id in enumerate(partner_ids):
                multiplier = partner_multipliers[idx]

                # Base production values
                base_gross_volume = random.uniform(15000, 20000)
                gross_volume = base_gross_volume * multiplier

                entry_id = str(uuid.uuid4())
                entry_doc = {
                    "id": entry_id,
                    "tenant_id": tenant_id,
                    "partner_id": partner_id,
                    "submitted_by": partner_id,
                    "measurement_date": current_date,
                    "gross_volume": round(gross_volume, 2),
                    "bsw_percent": round(random.uniform(0.5, 3.5), 2),
                    "temperature": round(random.uniform(60, 80), 1),
                    "api_gravity": round(random.uniform(30, 40), 2),
                    "pressure": round(random.uniform(800, 1000), 1),
                    "meter_factor": 1.0,
                    "status": ProductionEntryStatus.APPROVED.value,
                    "approved_by": coordinator_id,
                    "approved_at": current_date + timedelta(hours=12),
                    "is_demo": True,  # Mark as demo data
                    "created_at": current_date,
                    "updated_at": current_date
                }

                await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).set(entry_doc)
                production_entries_created += 1

            # Move to next day
            current_date += timedelta(days=1)

        logger.info(f"Created {production_entries_created} production entries")

        return DemoTenantResponse(
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            coordinator=coordinator_creds,
            partners=partners_creds,
            field_operators=field_operators_creds,
            production_entries_created=production_entries_created,
            message=f"Demo tenant created successfully with {request.num_partners} partners and {production_entries_created} production entries"
        )

    except Exception as e:
        logger.error(f"Error creating demo tenant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create demo tenant: {str(e)}")


@router.get("/demo/tenants", response_model=List[DemoTenantInfo])
async def get_demo_tenants():
    """
    Get all demo tenants with their login credentials.
    """
    check_demo_access()

    db = get_firestore()

    try:
        # Get all demo tenants
        tenants_ref = db.collection(FirestoreCollections.TENANTS)
        demo_tenants_query = tenants_ref.where("is_demo", "==", True)
        demo_tenants_docs = await demo_tenants_query.get()

        demo_tenants_info = []

        for tenant_doc in demo_tenants_docs:
            tenant_data = tenant_doc.to_dict()
            tenant_id = tenant_data["id"]

            # Get all users for this tenant
            users_ref = db.collection(FirestoreCollections.USERS)
            users_query = users_ref.where("tenant_ids", "array_contains", tenant_id).where("is_demo", "==", True)
            users_docs = await users_query.get()

            coordinator = None
            partners = []
            field_operators = []

            for user_doc in users_docs:
                user_data = user_doc.to_dict()

                user_cred = UserCredentials(
                    id=user_data["id"],
                    email=user_data["email"],
                    password="Qwerty@12345",  # Default password
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    organization=user_data.get("organization"),
                    partner_id=user_data.get("partner_id")
                )

                if user_data["role"] == UserRole.COORDINATOR.value:
                    coordinator = user_cred
                elif user_data["role"] == UserRole.PARTNER.value:
                    partners.append(user_cred)
                elif user_data["role"] == UserRole.FIELD_OPERATOR.value:
                    field_operators.append(user_cred)

            if coordinator:  # Only include if we found a coordinator
                demo_tenants_info.append(DemoTenantInfo(
                    tenant_id=tenant_id,
                    tenant_name=tenant_data["name"],
                    created_at=tenant_data["created_at"].isoformat(),
                    coordinator=coordinator,
                    partners=partners,
                    field_operators=field_operators
                ))

        return demo_tenants_info

    except Exception as e:
        logger.error(f"Error fetching demo tenants: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch demo tenants: {str(e)}")


class DeleteDemoTenantRequest(BaseModel):
    """Request to delete a demo tenant."""
    tenant_id: str
    password: str


@router.post("/demo/delete-tenant")
async def delete_demo_tenant(request: DeleteDemoTenantRequest = Body(...)):
    """
    Delete a demo tenant and all associated data:
    - Users (and their Firebase auth accounts)
    - Production entries
    - Terminal receipts
    - Reconciliations
    - Tenant record

    Only deletes data marked with is_demo: True
    """
    check_demo_access()

    # Verify password
    if not secrets.compare_digest(request.password, settings.demo_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password"
        )

    db = get_firestore()

    deleted_counts = {
        "users": 0,
        "production_entries": 0,
        "terminal_receipts": 0,
        "reconciliations": 0
    }

    try:
        # Verify tenant is demo
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(request.tenant_id).get()
        if not tenant_doc.exists:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant_data = tenant_doc.to_dict()
        if not tenant_data.get("is_demo"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete non-demo tenant"
            )

        # Delete users and their Firebase accounts
        logger.info(f"Deleting users for tenant: {request.tenant_id}")
        users_ref = db.collection(FirestoreCollections.USERS)
        users_query = users_ref.where("tenant_ids", "array_contains", request.tenant_id).where("is_demo", "==", True)
        users_docs = await users_query.get()

        for user_doc in users_docs:
            user_data = user_doc.to_dict()

            # Delete Firebase auth account
            try:
                firebase_auth.delete_user(user_data["firebase_uid"])
                logger.info(f"Deleted Firebase user: {user_data['firebase_uid']}")
            except Exception as e:
                logger.warning(f"Failed to delete Firebase user {user_data['firebase_uid']}: {str(e)}")

            # Delete Firestore user document
            await user_doc.reference.delete()
            deleted_counts["users"] += 1

        logger.info(f"Deleted {deleted_counts['users']} users")

        # Delete production entries
        logger.info(f"Deleting production entries for tenant: {request.tenant_id}")
        production_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        production_query = production_ref.where("tenant_id", "==", request.tenant_id).where("is_demo", "==", True)
        production_docs = await production_query.get()

        for doc in production_docs:
            await doc.reference.delete()
            deleted_counts["production_entries"] += 1

        logger.info(f"Deleted {deleted_counts['production_entries']} production entries")

        # Delete terminal receipts
        logger.info(f"Deleting terminal receipts for tenant: {request.tenant_id}")
        receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)
        receipts_query = receipts_ref.where("tenant_id", "==", request.tenant_id).where("is_demo", "==", True)
        receipts_docs = await receipts_query.get()

        for doc in receipts_docs:
            await doc.reference.delete()
            deleted_counts["terminal_receipts"] += 1

        logger.info(f"Deleted {deleted_counts['terminal_receipts']} terminal receipts")

        # Delete reconciliations
        logger.info(f"Deleting reconciliations for tenant: {request.tenant_id}")
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliations_query = reconciliations_ref.where("tenant_id", "==", request.tenant_id).where("is_demo", "==", True)
        reconciliations_docs = await reconciliations_query.get()

        for doc in reconciliations_docs:
            await doc.reference.delete()
            deleted_counts["reconciliations"] += 1

        logger.info(f"Deleted {deleted_counts['reconciliations']} reconciliations")

        # Delete tenant
        await db.collection(FirestoreCollections.TENANTS).document(request.tenant_id).delete()
        logger.info(f"Deleted tenant: {request.tenant_id}")

        return {
            "message": "Demo tenant deleted successfully",
            "deleted_counts": deleted_counts
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting demo tenant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete demo tenant: {str(e)}")


class DemoProductionEntryCreate(BaseModel):
    """Production entry without authentication."""
    tenant_id: str
    partner_id: str
    measurement_date: str
    gross_volume: float
    bsw_percent: float
    temperature: float
    api_gravity: float
    pressure: Optional[float] = None
    meter_factor: float = 1.0


@router.post("/demo/production/entries")
async def create_demo_production_entry(entry: DemoProductionEntryCreate = Body(...)):
    """
    Create production entry without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    check_demo_access()  # Verify environment and configuration
    db = get_firestore()
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    entry_doc = {
        "tenant_id": entry.tenant_id,
        "partner_id": entry.partner_id,
        "submitted_by": entry.partner_id,  # Use partner_id as submitter
        "measurement_date": datetime.fromisoformat(entry.measurement_date.replace('Z', '+00:00')),
        "gross_volume": entry.gross_volume,
        "bsw_percent": entry.bsw_percent,
        "temperature": entry.temperature,
        "api_gravity": entry.api_gravity,
        "pressure": entry.pressure,
        "meter_factor": entry.meter_factor,
        "status": ProductionEntryStatus.APPROVED.value,  # Auto-approve demo data
        "approved_by": entry.partner_id,  # Auto-approve by partner
        "approved_at": now,
        "created_at": now,
        "updated_at": now,
    }

    await entries_ref.document(entry_id).set(entry_doc)

    return {"id": entry_id, **entry_doc}


@router.delete("/demo/production/entries/{entry_id}")
async def delete_demo_production_entry(entry_id: str):
    """
    Delete production entry without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    check_demo_access()  # Verify environment and configuration
    db = get_firestore()
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    entry_doc = await entries_ref.document(entry_id).get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Entry not found")

    await entries_ref.document(entry_id).delete()

    return {"message": "Entry deleted successfully"}


@router.delete("/demo/terminal-receipts/{receipt_id}")
async def delete_demo_terminal_receipt(receipt_id: str):
    """
    Delete terminal receipt without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    check_demo_access()  # Verify environment and configuration
    db = get_firestore()
    receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)

    receipt_doc = await receipts_ref.document(receipt_id).get()

    if not receipt_doc.exists:
        raise HTTPException(status_code=404, detail="Receipt not found")

    await receipts_ref.document(receipt_id).delete()

    return {"message": "Receipt deleted successfully"}


@router.delete("/demo/reconciliation/{reconciliation_id}")
async def delete_demo_reconciliation(reconciliation_id: str):
    """
    Delete reconciliation without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    check_demo_access()  # Verify environment and configuration
    db = get_firestore()
    reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)

    reconciliation_doc = await reconciliations_ref.document(reconciliation_id).get()

    if not reconciliation_doc.exists:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    await reconciliations_ref.document(reconciliation_id).delete()

    return {"message": "Reconciliation deleted successfully"}


class BulkDeleteRequest(BaseModel):
    """Request to delete all data for a tenant."""
    tenant_id: str
    password: str


@router.post("/demo/delete-all-data")
async def delete_all_demo_data(request: BulkDeleteRequest = Body(...)):
    """
    Delete all production entries, terminal receipts, and reconciliations for a tenant.
    WARNING: This bypasses all auth checks - use only in development.
    Requires password configured via DEMO_PASSWORD environment variable.
    """
    check_demo_access()  # Verify environment and configuration

    # Verify password using constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(request.password, settings.demo_password):
        logger.warning(f"Invalid demo password attempt for tenant: {request.tenant_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password"
        )

    db = get_firestore()

    deleted_counts = {
        "production_entries": 0,
        "terminal_receipts": 0,
        "reconciliations": 0
    }

    try:
        # Delete production entries
        logger.info(f"Deleting production entries for tenant: {request.tenant_id}")
        production_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        production_query = production_ref.where("tenant_id", "==", request.tenant_id)
        production_docs = await production_query.get()

        for doc in production_docs:
            await doc.reference.delete()
            deleted_counts["production_entries"] += 1

        logger.info(f"Deleted {deleted_counts['production_entries']} production entries")

        # Delete terminal receipts
        logger.info(f"Deleting terminal receipts for tenant: {request.tenant_id}")
        receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)
        receipts_query = receipts_ref.where("tenant_id", "==", request.tenant_id)
        receipts_docs = await receipts_query.get()

        for doc in receipts_docs:
            await doc.reference.delete()
            deleted_counts["terminal_receipts"] += 1

        logger.info(f"Deleted {deleted_counts['terminal_receipts']} terminal receipts")

        # Delete reconciliations
        logger.info(f"Deleting reconciliations for tenant: {request.tenant_id}")
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliations_query = reconciliations_ref.where("tenant_id", "==", request.tenant_id)
        reconciliations_docs = await reconciliations_query.get()

        for doc in reconciliations_docs:
            await doc.reference.delete()
            deleted_counts["reconciliations"] += 1

        logger.info(f"Deleted {deleted_counts['reconciliations']} reconciliations")

        return {
            "message": "All demo data deleted successfully",
            "deleted_counts": deleted_counts
        }

    except Exception as e:
        logger.error(f"Error deleting demo data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete data: {str(e)}")
