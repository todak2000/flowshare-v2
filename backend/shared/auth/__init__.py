"""Authentication utilities."""
from .firebase_auth import (
    verify_firebase_token,
    get_current_user_id,
    get_current_user_email,
    get_user_role,
    get_user_tenant_ids,
    get_tenant_subscription_plan,
    require_plan,
)
from .api_key_auth import (
    verify_api_key,
    get_tenant_from_api_key,
    generate_api_key,
    hash_api_key,
)

__all__ = [
    "verify_firebase_token",
    "get_current_user_id",
    "get_current_user_email",
    "get_user_role",
    "get_user_tenant_ids",
    "get_tenant_subscription_plan",
    "require_plan",
    "verify_api_key",
    "get_tenant_from_api_key",
    "generate_api_key",
    "hash_api_key",
]
