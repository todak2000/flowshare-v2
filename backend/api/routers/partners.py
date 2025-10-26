# routes/partners.py
"""Partner (tenant user) management routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User

router = APIRouter()


@router.get("", response_model=List[User])
async def list_partners(
    user_id: str = Depends(get_current_user_id),
):
    """
    List all partners (users) in the current user's primary tenant.
    For partners and field operators, includes their organization/company name.
    """
    db = get_firestore()

    # Get current user to find their tenant_ids and role
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    current_user_role = user_data.get("role")
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        return []  # No tenant, no partners

    # Get primary tenant (first one)
    primary_tenant_id = tenant_ids[0]

    # Find all users in the same tenant
    partners_query = await users_ref.where("tenant_ids", "array_contains", primary_tenant_id).get()

    # Get tenant data for company names
    tenants_ref = db.collection(FirestoreCollections.TENANTS)
    tenant_docs = {}

    partners = []
    for doc in partners_query:
        partner_data = doc.to_dict()
        partner_role = partner_data.get("role")

        # Role-based filtering
        # If current user is a partner, only show field operators with matching partner_id
        if current_user_role == "partner":
            current_user_id = user_query[0].id
            if partner_role == "field_operator" and partner_data.get("partner_id") == current_user_id:
                # Get tenant name for this field operator
                if primary_tenant_id not in tenant_docs:
                    tenant_doc = await tenants_ref.document(primary_tenant_id).get()
                    if tenant_doc.exists:
                        tenant_docs[primary_tenant_id] = tenant_doc.to_dict()

                tenant_name = tenant_docs.get(primary_tenant_id, {}).get("name", "Unknown")
                partner_data["parent_jv"] = tenant_name
                partners.append(User(id=doc.id, **partner_data))
            # Also include other partners (for visibility)
            elif partner_role == "partner":
                # For partners, get their associated tenant/company name
                # If they have a partner_id, fetch that tenant
                partner_tenant_id = partner_data.get("partner_id") or primary_tenant_id
                if partner_tenant_id and partner_tenant_id not in tenant_docs:
                    tenant_doc = await tenants_ref.document(partner_tenant_id).get()
                    if tenant_doc.exists:
                        tenant_docs[partner_tenant_id] = tenant_doc.to_dict()

                tenant_name = tenant_docs.get(partner_tenant_id, {}).get("name", "Unknown")
                partner_data["parent_jv"] = tenant_name
                partners.append(User(id=doc.id, **partner_data))
        else:
            # Coordinator sees all partners and field operators
            # Get company name from tenant
            if primary_tenant_id not in tenant_docs:
                tenant_doc = await tenants_ref.document(primary_tenant_id).get()
                if tenant_doc.exists:
                    tenant_docs[primary_tenant_id] = tenant_doc.to_dict()

            tenant_name = tenant_docs.get(primary_tenant_id, {}).get("name", "Unknown")
            partner_data["parent_jv"] = tenant_name
            partners.append(User(id=doc.id, **partner_data))

    return partners