"""FlowshareGPT chat routes."""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import UserRole
from shared.models.production import ProductionEntryStatus
from shared.ai import GeminiService
from google.cloud.firestore_v1 import FieldFilter

router = APIRouter()
gemini_service = GeminiService()


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


@router.post("/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Stream chat responses for FlowshareGPT.

    Partners can only access their own production data.
    Coordinators can access all partner data under their tenant.
    """
    db = get_firestore()

    # Get user's tenant by querying with firebase_uid
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where(filter=FieldFilter("firebase_uid", "==", user_id)).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    actual_user_id = user_doc.id  # Get the actual document ID
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=400, detail="User has no associated tenant")

    tenant_id = tenant_ids[0]  # Use first tenant

    # Get tenant information
    tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
    tenant_name = "your organization"
    if tenant_doc.exists:
        tenant_data = tenant_doc.to_dict()
        tenant_name = tenant_data.get("name", "your organization")

    # Get user name
    user_name = user_data.get("full_name") or user_data.get("email", "").split("@")[0]

    # Gather production data context based on user role
    context = await gather_production_context(db, actual_user_id, user_role, tenant_id)

    # Add tenant and user info to context
    context["tenant_name"] = tenant_name
    context["user_name"] = user_name

    # Convert conversation history to the format expected by Gemini
    history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

    # Stream the response
    async def generate_response():
        async for chunk in gemini_service.chat_stream(
            message=request.message,
            context=context,
            user_role=user_role,
            conversation_history=history
        ):
            yield chunk

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
    )


async def gather_production_context(
    db,
    user_id: str,
    user_role: str,
    tenant_id: str
) -> Dict[str, Any]:
    """
    Gather production data context for the AI assistant.

    Returns relevant production data and statistics based on user role.
    """
    context = {
        "partner_data": [],
        "recent_entries": [],
        "reconciliations": []
    }

    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    # Date range: last 90 days
    cutoff_date = datetime.utcnow() - timedelta(days=90)

    try:
        if user_role == UserRole.PARTNER:
            # Partners can only see their own data
            # Get production entries for this partner
            entries_query = await entries_ref.where("tenant_id", "==", tenant_id) \
                .where("partner_id", "==", user_id) \
                .where("measurement_date", ">=", cutoff_date) \
                .limit(100) \
                .get()

            entries = [{"id": doc.id, **doc.to_dict()} for doc in entries_query]
            context["recent_entries"] = entries

            # Calculate partner statistics
            total_volume = sum(entry.get("gross_volume", 0) for entry in entries)
            approved_entries = [e for e in entries if e.get("status") == ProductionEntryStatus.APPROVED.value]
            flagged_entries = [e for e in entries if e.get("status") == ProductionEntryStatus.FLAGGED.value]

            # Get partner name
            partner_doc = await db.collection(FirestoreCollections.USERS).document(user_id).get()
            partner_name = "Your Organization"
            if partner_doc.exists:
                partner_data = partner_doc.to_dict()
                partner_name = partner_data.get("organization") or partner_data.get("full_name", "Your Organization")

            context["partner_data"] = [{
                "name": partner_name,
                "total_volume": total_volume,
                "entry_count": len(entries),
                "approved_count": len(approved_entries),
                "flagged_count": len(flagged_entries),
            }]

        elif user_role in [UserRole.COORDINATOR, UserRole.FIELD_OPERATOR]:
            # Coordinators and field operators can see all partner data in their tenant
            entries_query = await entries_ref.where("tenant_id", "==", tenant_id) \
                .where("measurement_date", ">=", cutoff_date) \
                .limit(500) \
                .get()

            entries = [{"id": doc.id, **doc.to_dict()} for doc in entries_query]
            context["recent_entries"] = entries

            # Group by partner
            partner_stats = {}
            for entry in entries:
                partner_id = entry.get("partner_id")
                if partner_id not in partner_stats:
                    partner_stats[partner_id] = {
                        "partner_id": partner_id,
                        "total_volume": 0,
                        "entry_count": 0,
                        "approved_count": 0,
                        "flagged_count": 0,
                    }

                partner_stats[partner_id]["total_volume"] += entry.get("gross_volume", 0)
                partner_stats[partner_id]["entry_count"] += 1

                if entry.get("status") == ProductionEntryStatus.APPROVED.value:
                    partner_stats[partner_id]["approved_count"] += 1
                elif entry.get("status") == ProductionEntryStatus.FLAGGED.value:
                    partner_stats[partner_id]["flagged_count"] += 1

            # Fetch partner names
            for partner_id in partner_stats.keys():
                partner_doc = await db.collection(FirestoreCollections.USERS).document(partner_id).get()
                if partner_doc.exists:
                    partner_data = partner_doc.to_dict()
                    partner_stats[partner_id]["name"] = partner_data.get("organization") or partner_data.get("full_name", f"Partner {partner_id[-6:]}")
                else:
                    partner_stats[partner_id]["name"] = f"Partner {partner_id[-6:]}"

            context["partner_data"] = list(partner_stats.values())

        # Get recent reconciliations with full details (for all roles)
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliations_query = await reconciliations_ref.where("tenant_id", "==", tenant_id) \
            .order_by("created_at", direction="DESCENDING") \
            .limit(10) \
            .get()

        reconciliation_details = []
        for doc in reconciliations_query:
            data = doc.to_dict()
            rec_detail = {
                "id": doc.id,
                "period_start": data.get("period_start").isoformat() if data.get("period_start") else None,
                "period_end": data.get("period_end").isoformat() if data.get("period_end") else None,
                "status": data.get("status"),
                "terminal_volume": data.get("terminal_volume"),
                "total_allocated_volume": data.get("result", {}).get("total_allocated_volume"),
                "shrinkage_volume": data.get("result", {}).get("shrinkage_volume"),
                "shrinkage_percent": data.get("result", {}).get("shrinkage_percent"),
                "allocation_model": data.get("result", {}).get("allocation_model_used"),
                "partner_allocations": data.get("result", {}).get("partner_allocations", []),
            }
            reconciliation_details.append(rec_detail)

        context["reconciliations"] = reconciliation_details

    except Exception as e:
        # Log error but don't fail - just provide empty context
        print(f"Error gathering production context: {e}")

    return context
