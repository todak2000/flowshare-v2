"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TestTube, Rocket } from "lucide-react"
import { APIKeyCard } from "./api-key-card"

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

interface ApiKeysManagerProps {
  testKeys: APIKey[]
  prodKeys: APIKey[]
  handleRevokeKey: (id: string) => void
  setNewKeyData: (data: any) => void
  setShowNewKeyDialog: (show: boolean) => void
  setNewlyCreatedKey: (key: string | null) => void
}

export function ApiKeysManager({ 
  testKeys, 
  prodKeys, 
  handleRevokeKey, 
  setNewKeyData, 
  setShowNewKeyDialog, 
  setNewlyCreatedKey 
}: ApiKeysManagerProps) {
  return (
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
                  setNewKeyData({ environment: "test" })
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
                  setNewKeyData({ environment: "production" })
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
  )
}
