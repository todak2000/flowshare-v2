"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { apiClient } from "@/lib/api-client"

interface APIKey {
  id: string
  name: string
  description: string
  key_prefix: string
  environment: "test" | "production"
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export function useApiKeys() {
  const { user } = useAuthStore()
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    description: "",
    environment: "test" as "test" | "production",
  })
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    fetchAPIKeys()
  }, [user])

  const fetchAPIKeys = async () => {
    if (!user || !user.tenant_ids.length) return

    try {
      setLoading(true)
      const tenantId = user.tenant_ids[0]
      const keys = await apiClient.get<APIKey[]>(`/api/api-keys?tenant_id=${tenantId}`)
      setApiKeys(keys)
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!user || !user.tenant_ids.length) return
    if (!newKeyData.name.trim()) {
      alert("Please enter a name for the API key")
      return
    }

    try {
      setCreating(true)
      const tenantId = user.tenant_ids[0]
      const response = await apiClient.post<any>(
        `/api/api-keys?tenant_id=${tenantId}`,
        newKeyData
      )

      setNewlyCreatedKey(response.key)
      setShowKey(true)
      fetchAPIKeys()

      // Reset form
      setNewKeyData({
        name: "",
        description: "",
        environment: "test",
      })

      // Keep dialog open to show the key
    } catch (error) {
      console.error("Failed to create API key:", error)
      alert("Failed to create API key. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return
    }

    if (!user || !user.tenant_ids.length) return

    try {
      const tenantId = user.tenant_ids[0]
      await apiClient.delete(`/api/api-keys/${keyId}?tenant_id=${tenantId}`)
      fetchAPIKeys()
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      alert("Failed to revoke API key. Please try again.")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const testKeys = apiKeys.filter((k) => k.environment === "test")
  const prodKeys = apiKeys.filter((k) => k.environment === "production")

  return {
    apiKeys,
    loading,
    creating,
    showNewKeyDialog,
    newKeyData,
    newlyCreatedKey,
    showKey,
    testKeys,
    prodKeys,
    setShowNewKeyDialog,
    setNewKeyData,
    setNewlyCreatedKey,
    setShowKey,
    fetchAPIKeys,
    handleCreateKey,
    handleRevokeKey,
    copyToClipboard,
  }
}
