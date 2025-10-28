"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Copy, Eye, EyeOff, Shield } from "lucide-react"

interface CreateApiKeyDialogProps {
  showNewKeyDialog: boolean
  newKeyData: {
    name: string
    description: string
    environment: "test" | "production"
  }
  creating: boolean
  newlyCreatedKey: string | null
  showKey: boolean
  setShowNewKeyDialog: (show: boolean) => void
  setNewKeyData: (data: any) => void
  handleCreateKey: () => void
  setNewlyCreatedKey: (key: string | null) => void
  setShowKey: (show: boolean) => void
  copyToClipboard: (text: string) => void
}

export function CreateApiKeyDialog({ 
  showNewKeyDialog,
  newKeyData,
  creating,
  newlyCreatedKey,
  showKey,
  setShowNewKeyDialog,
  setNewKeyData,
  handleCreateKey,
  setNewlyCreatedKey,
  setShowKey,
  copyToClipboard
}: CreateApiKeyDialogProps) {
  if (!showNewKeyDialog) return null

  return (
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
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
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
                  <Shield className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
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
                  disabled={creating || !newKeyData?.name?.trim()}
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
  )
}
