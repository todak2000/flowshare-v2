"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Copy, Eye, Trash2, Shield, AlertCircle } from "lucide-react"
import { Label } from "../ui/label"

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

export function APIKeyCard({ apiKey, onRevoke }: { apiKey: APIKey; onRevoke: (id: string) => void }) {
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
