"use client"

import { useApiKeys } from "@/hooks/useApiKeys"
import { ScadaSetupHeader } from "@/components/scada/scada-setup-header"
import { QuickStartGuide } from "@/components/scada/quick-start-guide"
import { ApiKeysManager } from "@/components/scada/api-keys-manager"
import { CreateApiKeyDialog } from "@/components/scada/create-api-key-dialog"
import { SecurityBestPractices } from "@/components/scada/security-best-practices"

export default function SCADASetupPage() {
  const {
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
    handleCreateKey,
    handleRevokeKey,
    copyToClipboard,
  } = useApiKeys()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ScadaSetupHeader />
      <QuickStartGuide />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ApiKeysManager
          testKeys={testKeys}
          prodKeys={prodKeys}
          handleRevokeKey={handleRevokeKey}
          setNewKeyData={setNewKeyData}
          setShowNewKeyDialog={setShowNewKeyDialog}
          setNewlyCreatedKey={setNewlyCreatedKey}
        />
      )}

      <CreateApiKeyDialog
        showNewKeyDialog={showNewKeyDialog}
        newKeyData={newKeyData}
        creating={creating}
        newlyCreatedKey={newlyCreatedKey}
        showKey={showKey}
        setShowNewKeyDialog={setShowNewKeyDialog}
        setNewKeyData={setNewKeyData}
        handleCreateKey={handleCreateKey}
        setNewlyCreatedKey={setNewlyCreatedKey}
        setShowKey={setShowKey}
        copyToClipboard={copyToClipboard}
      />

      <SecurityBestPractices />
    </div>
  )
}