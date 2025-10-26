"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { TerminalReceiptForm } from "@/components/reconciliation/terminal-receipt-form"
import { TerminalReceiptsTable } from "@/components/reconciliation/terminal-receipts-table"
import { ReconciliationsTable } from "@/components/reconciliation/reconciliations-table"
import { ReportViewModal } from "@/components/reconciliation/report-view-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import {
  Reconciliation,
  TerminalReceipt,
  PaginatedTerminalReceipts,
} from "@/types/reconciliation"

export default function ReconciliationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string>("")

  // Terminal receipts state
  const [receipts, setReceipts] = useState<TerminalReceipt[]>([])
  const [receiptsPagination, setReceiptsPagination] = useState({
    current_page: 1,
    page_size: 5,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  })
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [showReceiptForm, setShowReceiptForm] = useState(false)

  // Reconciliations state
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [reconciliationsLoading, setReconciliationsLoading] = useState(false)

  // Report modal state
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (tenantId) {
      fetchTerminalReceipts(1)
      fetchReconciliations()
    }
  }, [tenantId])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const userData = await apiClient.get<any>("/api/auth/me")
      setCurrentUser(userData)

      // Check role access - only coordinator and partners (NOT field operators)
      if (!["coordinator", "partner"].includes(userData.role) || userData.role === "field_operator") {
        router.push("/dashboard")
        return
      }

      // Get tenant ID
      if (userData.tenant_ids && userData.tenant_ids.length > 0) {
        setTenantId(userData.tenant_ids[0])
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchTerminalReceipts = async (page: number) => {
    try {
      setReceiptsLoading(true)
      const data = await apiClient.get<PaginatedTerminalReceipts>(
        `/api/terminal-receipts?tenant_id=${tenantId}&page=${page}&page_size=5`
      )
      setReceipts(data.data)
      setReceiptsPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch terminal receipts:", error)
    } finally {
      setReceiptsLoading(false)
    }
  }

  const fetchReconciliations = async () => {
    try {
      setReconciliationsLoading(true)
      const data = await apiClient.get<Reconciliation[]>(
        `/api/reconciliation?tenant_id=${tenantId}&limit=50`
      )
      setReconciliations(data)
    } catch (error) {
      console.error("Failed to fetch reconciliations:", error)
    } finally {
      setReconciliationsLoading(false)
    }
  }

  const handleSubmitTerminalReceipt = async (data: any) => {
    try {
      await apiClient.post("/api/terminal-receipts", data)
      setShowReceiptForm(false)
      fetchTerminalReceipts(1)
      // Reconciliation is automatically triggered on the backend
      // Refresh reconciliations list after a short delay to show the new one
      setTimeout(() => {
        fetchReconciliations()
      }, 1000)
    } catch (error) {
      console.error("Failed to submit terminal receipt:", error)
      throw error
    }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      await apiClient.delete(`/api/terminal-receipts/${receiptId}`)
      fetchTerminalReceipts(receiptsPagination.current_page)
    } catch (error) {
      console.error("Failed to delete receipt:", error)
      throw error
    }
  }

  const handleViewReport = (reconciliation: Reconciliation) => {
    setSelectedReconciliation(reconciliation)
    setReportModalOpen(true)
  }

  const handleDownloadPDF = async (reconciliationId: string) => {
    try {
      const authHeaders = await apiClient.getAuthHeaders()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reconciliation/${reconciliationId}/export/pdf`,
        {
          headers: authHeaders,
        }
      )

      if (!response.ok) throw new Error("Failed to download PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reconciliation_report_${reconciliationId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download PDF:", error)
    }
  }

  const handleDownloadCSV = async (reconciliationId: string) => {
    try {
      const authHeaders = await apiClient.getAuthHeaders()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reconciliation/${reconciliationId}/export/csv`,
        {
          headers: authHeaders,
        }
      )

      if (!response.ok) throw new Error("Failed to download CSV")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reconciliation_${reconciliationId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download CSV:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser || !["coordinator", "partner"].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only coordinators and partners can access reconciliation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reconciliation</h1>
          <p className="text-muted-foreground">
            Manage terminal receipts and view reconciliation reports
          </p>
        </div>
        {currentUser?.role === "coordinator" && (
          <Button onClick={() => setShowReceiptForm(!showReceiptForm)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {showReceiptForm ? "Hide Form" : "Add Terminal Receipt"}
          </Button>
        )}
      </div>

      {/* Terminal Receipt Form (Coordinator Only) */}
      {currentUser?.role === "coordinator" && showReceiptForm && (
        <TerminalReceiptForm
          tenantId={tenantId}
          onSubmit={handleSubmitTerminalReceipt}
          onCancel={() => setShowReceiptForm(false)}
        />
      )}

      {/* Terminal Receipts Table */}
      <TerminalReceiptsTable
        receipts={receipts}
        pagination={receiptsPagination}
        loading={receiptsLoading}
        onPageChange={fetchTerminalReceipts}
        onDelete={currentUser?.role === "coordinator" ? handleDeleteReceipt : undefined}
        userRole={currentUser?.role}
      />

      {/* Reconciliations Table */}
      <ReconciliationsTable
        reconciliations={reconciliations}
        loading={reconciliationsLoading}
        onViewReport={handleViewReport}
        onDownloadPDF={handleDownloadPDF}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* Report View Modal */}
      <ReportViewModal
        reconciliation={selectedReconciliation}
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onDownloadPDF={handleDownloadPDF}
        onDownloadCSV={handleDownloadCSV}
      />
    </div>
  )
}
