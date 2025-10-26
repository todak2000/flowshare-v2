"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductionEntry } from "@/types/production"
import { Edit3, X } from "lucide-react"

interface EditEntryModalProps {
  entry: ProductionEntry | null
  open: boolean
  onClose: () => void
  onSave: (entryId: string, updates: any, editReason: string) => Promise<void>
}

export function EditEntryModal({
  entry,
  open,
  onClose,
  onSave,
}: EditEntryModalProps) {
  const [formData, setFormData] = useState({
    gross_volume: "",
    bsw_percent: "",
    temperature: "",
    api_gravity: "",
    pressure: "",
    meter_factor: "",
  })
  const [editReason, setEditReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (entry) {
      setFormData({
        gross_volume: entry.gross_volume?.toString() || "",
        bsw_percent: entry.bsw_percent?.toString() || "",
        temperature: entry.temperature?.toString() || "",
        api_gravity: entry.api_gravity?.toString() || "",
        pressure: entry.pressure?.toString() || "",
        meter_factor: entry.meter_factor?.toString() || "1.0",
      })
      setEditReason("")
      setError("")
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!editReason.trim()) {
      setError("Please provide a reason for this edit")
      return
    }

    try {
      setSaving(true)
      const updates: any = {}

      // Only include changed fields
      if (formData.gross_volume && parseFloat(formData.gross_volume) !== entry?.gross_volume) {
        updates.gross_volume = parseFloat(formData.gross_volume)
      }
      if (formData.bsw_percent && parseFloat(formData.bsw_percent) !== entry?.bsw_percent) {
        updates.bsw_percent = parseFloat(formData.bsw_percent)
      }
      if (formData.temperature && parseFloat(formData.temperature) !== entry?.temperature) {
        updates.temperature = parseFloat(formData.temperature)
      }
      if (formData.api_gravity && parseFloat(formData.api_gravity) !== entry?.api_gravity) {
        updates.api_gravity = parseFloat(formData.api_gravity)
      }
      if (formData.pressure && parseFloat(formData.pressure) !== entry?.pressure) {
        updates.pressure = parseFloat(formData.pressure)
      }
      if (formData.meter_factor && parseFloat(formData.meter_factor) !== entry?.meter_factor) {
        updates.meter_factor = parseFloat(formData.meter_factor)
      }

      if (Object.keys(updates).length === 0) {
        setError("No changes detected")
        return
      }

      await onSave(entry!.id, updates, editReason)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update entry")
    } finally {
      setSaving(false)
    }
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Production Entry
          </DialogTitle>
          <DialogDescription>
            Update production data for {new Date(entry.measurement_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Edit Reason */}
          <div className="space-y-2 border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
            <Label htmlFor="editReason" className="text-sm font-semibold">
              Reason for Edit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="editReason"
              placeholder="Explain why you're editing this entry (e.g., 'Corrected measurement error in volume reading')"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={3}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be sent to the partner for approval
            </p>
          </div>

          {/* Entry Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gross_volume">
                Gross Volume (bbls) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gross_volume"
                type="number"
                step="0.01"
                value={formData.gross_volume}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    gross_volume: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bsw_percent">
                BSW % <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bsw_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.bsw_percent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bsw_percent: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature (°F) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.01"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    temperature: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_gravity">
                API Gravity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="api_gravity"
                type="number"
                step="0.01"
                value={formData.api_gravity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    api_gravity: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pressure">Pressure (psia)</Label>
              <Input
                id="pressure"
                type="number"
                step="0.01"
                value={formData.pressure}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pressure: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meter_factor">Meter Factor</Label>
              <Input
                id="meter_factor"
                type="number"
                step="0.0001"
                value={formData.meter_factor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meter_factor: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {error && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            After saving, this entry will be marked as "Pending Approval" until the partner reviews and approves the changes.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
