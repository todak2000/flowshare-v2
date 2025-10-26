"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon, DropletIcon } from "lucide-react"

interface TerminalReceiptFormProps {
  tenantId: string
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
}

export function TerminalReceiptForm({
  tenantId,
  onSubmit,
  onCancel,
}: TerminalReceiptFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    terminal_volume: "",
    terminal_name: "",
    operator_name: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        tenant_id: tenantId,
        receipt_date: new Date(formData.receipt_date).toISOString(),
        terminal_volume: parseFloat(formData.terminal_volume),
        terminal_name: formData.terminal_name || undefined,
        operator_name: formData.operator_name || undefined,
        notes: formData.notes || undefined,
      })

      // Reset form
      setFormData({
        receipt_date: new Date().toISOString().split("T")[0],
        terminal_volume: "",
        terminal_name: "",
        operator_name: "",
        notes: "",
      })
    } catch (error) {
      console.error("Failed to submit terminal receipt:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DropletIcon className="h-5 w-5 text-primary" />
          Record Terminal Receipt
        </CardTitle>
        <CardDescription>
          Enter the terminal volume received to trigger reconciliation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Receipt Date *
              </Label>
              <Input
                id="receipt_date"
                name="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminal_volume">Terminal Volume (bbls) *</Label>
              <Input
                id="terminal_volume"
                name="terminal_volume"
                type="number"
                step="0.01"
                placeholder="e.g., 50000.00"
                value={formData.terminal_volume}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminal_name">Terminal Name</Label>
              <Input
                id="terminal_name"
                name="terminal_name"
                type="text"
                placeholder="e.g., Terminal A"
                value={formData.terminal_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator_name">Operator Name</Label>
              <Input
                id="operator_name"
                name="operator_name"
                type="text"
                placeholder="e.g., John Doe"
                value={formData.operator_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this receipt..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Terminal Receipt"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
