"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Key, Copy, Eye, EyeOff, Trash2, CheckCircle, AlertCircle,
  Book, Code, Zap, Shield, TestTube, Rocket, Plus
} from "lucide-react"
import Link from "next/link"

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

export default function SCADASetupPage() {
  const { user } = useAuthStore()
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    description: "",
    environment: "test" as "test" | "production"
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
        environment: "test"
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

  const testKeys = apiKeys.filter(k => k.environment === "test")
  const prodKeys = apiKeys.filter(k => k.environment === "production")

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">SCADA Integration Setup</h1>
        <p className="text-muted-foreground">
          Connect your SCADA systems and IoT devices to FlowShare using secure API keys
        </p>
      </div>

      {/* Quick Start Guide */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Create Test API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Start with a test key to safely experiment without affecting live data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Test Your Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Use our interactive documentation to test API calls and verify your setup
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Go Live</h4>
                <p className="text-sm text-muted-foreground">
                  Create a production key and deploy to your SCADA system
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <Link href="/dashboard/scada-docs">
              <Button>
                <Book className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
            </Link>
            <Link href="/dashboard/scada-docs#test">
              <Button variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Try Interactive Testing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="test" className="gap-2">
            <TestTube className="h-4 w-4" />
            Test Keys ({testKeys.length})
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Rocket className="h-4 w-4" />
            Production Keys ({prodKeys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test API Keys
                </span>
                <Button
                  onClick={() => {
                    setNewKeyData({ ...newKeyData, environment: "test" })
                    setShowNewKeyDialog(true)
                    setNewlyCreatedKey(null)
                  }}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test Key
                </Button>
              </CardTitle>
              <CardDescription>
                Test keys submit data to a separate testing collection. Perfect for development and testing without affecting production data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No test API keys yet</p>
                  <p className="text-sm">Create one to start testing your SCADA integration</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testKeys.map((key) => (
                    <APIKeyCard key={key.id} apiKey={key} onRevoke={handleRevokeKey} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Production API Keys
                </span>
                <Button
                  onClick={() => {
                    setNewKeyData({ ...newKeyData, environment: "production" })
                    setShowNewKeyDialog(true)
                    setNewlyCreatedKey(null)
                  }}
                  size="sm"
                  variant="default"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Production Key
                </Button>
              </CardTitle>
              <CardDescription>
                Production keys submit data to your live production collection. Use these for your deployed SCADA systems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prodKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Rocket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No production API keys yet</p>
                  <p className="text-sm">Create one when you're ready to go live</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prodKeys.map((key) => (
                    <APIKeyCard key={key.id} apiKey={key} onRevoke={handleRevokeKey} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      {showNewKeyDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                Create {newKeyData.environment === "test" ? "Test" : "Production"} API Key
              </CardTitle>
              <CardDescription>
                {newKeyData.environment === "test"
                  ? "Test keys are safe for development and testing"
                  : "Production keys submit live data - use with caution"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {newlyCreatedKey ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold">API Key Created Successfully!</p>
                        <p className="text-sm text-muted-foreground">
                          ⚠️ This is the only time you'll see this key. Copy it now and store it securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={newlyCreatedKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newlyCreatedKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Security Reminders</p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                          <li>Never share this key publicly or commit it to version control</li>
                          <li>Store it securely (environment variables, secrets manager)</li>
                          <li>If compromised, revoke it immediately and create a new one</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        setShowNewKeyDialog(false)
                        setNewlyCreatedKey(null)
                        setShowKey(false)
                      }}
                      className="flex-1"
                    >
                      I've Saved the Key
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Key Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Production SCADA System #1"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What will this key be used for?"
                      value={newKeyData.description}
                      onChange={(e) =>
                        setNewKeyData({ ...newKeyData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleCreateKey}
                      disabled={creating || !newKeyData.name.trim()}
                      className="flex-1"
                    >
                      {creating ? "Creating..." : "Create API Key"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewKeyDialog(false)
                        setNewKeyData({
                          name: "",
                          description: "",
                          environment: "test"
                        })
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Do
              </h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Store API keys in environment variables</li>
                <li>Use test keys during development</li>
                <li>Rotate production keys periodically</li>
                <li>Monitor API key usage in the logs</li>
                <li>Revoke unused or compromised keys immediately</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Don't
              </h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Never commit API keys to version control</li>
                <li>Don't share keys via email or chat</li>
                <li>Don't use production keys for testing</li>
                <li>Don't hardcode keys in your application</li>
                <li>Don't reuse keys across environments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// API Key Card Component
function APIKeyCard({ apiKey, onRevoke }: { apiKey: APIKey; onRevoke: (id: string) => void }) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const isTest = apiKey.environment === "test"
  const lastUsed = apiKey.last_used_at
    ? new Date(apiKey.last_used_at).toLocaleDateString()
    : "Never"

  const handleViewKey = () => {
    setShowPasswordDialog(true)
  }

  const copyKey = () => {
    navigator.clipboard.writeText(`${apiKey.key_prefix}...`)
    alert("Key prefix copied! Note: Full keys cannot be retrieved after creation.")
  }

  return (
    <>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm md:text-base">{apiKey.name}</h4>
              <Badge className="w-max" variant={isTest ? "secondary" : "default"}>
                {isTest ? "Test" : "Production"}
              </Badge>
              {apiKey.is_active ? (
                <Badge variant="outline" className="text-green-500 border-green-500 w-max">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-destructive border-destructive w-max">
                  Revoked
                </Badge>
              )}
            </div>
            {apiKey.description && (
              <p className="text-sm text-muted-foreground">{apiKey.description}</p>
            )}
          </div>
          {apiKey.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRevoke(apiKey.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Key className="h-3 w-3 shrink-0" />
              <code className="text-xs">{apiKey.key_prefix}...</code>
            </div>
            <div className="hidden md:block">Last used: {lastUsed}</div>
            <div className="hidden lg:block">Created: {new Date(apiKey.created_at).toLocaleDateString()}</div>
          </div>

          {apiKey.is_active && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyKey}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Prefix
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewKey}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Password Verification Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verify Your Identity
              </CardTitle>
              <CardDescription>
                For security reasons, API keys cannot be retrieved after creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Security Note</p>
                    <p className="text-muted-foreground mt-1">
                      For security, API keys are hashed and cannot be retrieved.
                      If you've lost your key, please revoke this one and create a new one.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Key Information</Label>
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{apiKey.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prefix:</span>
                    <code className="font-mono text-xs">{apiKey.key_prefix}...</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <Badge variant={isTest ? "secondary" : "default"} className="text-xs">
                      {isTest ? "Test" : "Production"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(apiKey.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Used:</span>
                    <span>{lastUsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={copyKey}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Prefix
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
