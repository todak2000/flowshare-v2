"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ProductionEntry, ProductionEntryStatus } from "@/types/production"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ApproveEntryModalProps {
  entry: ProductionEntry | null
  open: boolean
  onClose: () => void
  onApprove: (entryId: string) => Promise<void>
  onReject: (entryId: string) => Promise<void>
}

export function ApproveEntryModal({
  entry,
  open,
  onClose,
  onApprove,
  onReject,
}: ApproveEntryModalProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const handleApprove = async () => {
    try {
      setProcessing(true)
      setError("")
      await onApprove(entry!.id)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to approve entry")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setProcessing(true)
      setError("")
      await onReject(entry!.id)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject entry")
    } finally {
      setProcessing(false)
    }
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Review Entry Changes
          </DialogTitle>
          <DialogDescription>
            A coordinator has updated this production entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Edit Reason */}
          {entry.edit_reason && (
            <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <p className="text-sm font-semibold mb-2">Reason for Edit:</p>
              <p className="text-sm italic">{entry.edit_reason}</p>
            </div>
          )}

          {/* Entry Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Updated Entry Details:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Measurement Date</p>
                <p className="font-medium">
                  {new Date(entry.measurement_date).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gross Volume</p>
                <p className="font-medium">{entry.gross_volume.toFixed(2)} bbls</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">BSW %</p>
                <p className="font-medium">{entry.bsw_percent.toFixed(2)}%</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-medium">{entry.temperature.toFixed(2)}°F</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">API Gravity</p>
                <p className="font-medium">{entry.api_gravity.toFixed(2)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meter Factor</p>
                <p className="font-medium">{entry.meter_factor.toFixed(4)}</p>
              </div>

              {entry.pressure && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pressure</p>
                  <p className="font-medium">{entry.pressure.toFixed(2)} psia</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Metadata */}
          {entry.edited_at && (
            <div className="pt-4 border-t text-xs text-muted-foreground">
              <p>Edited on {new Date(entry.edited_at).toLocaleString()}</p>
            </div>
          )}

          {error && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {processing ? "Approving..." : "Approve Changes"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {processing ? "Rejecting..." : "Reject Changes"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            After approval, this entry will be marked as "Approved" and included in reconciliation calculations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
