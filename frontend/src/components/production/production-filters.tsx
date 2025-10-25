"use client"

import * as React from "react"
import { Calendar, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductionFilters, ProductionEntryStatus } from "@/types/production"

interface ProductionFiltersProps {
  filters: ProductionFilters
  onFiltersChange: (filters: ProductionFilters) => void
  showPartnerFilter?: boolean
  partners?: Array<{ id: string; name: string }>
}

export function ProductionFiltersComponent({
  filters,
  onFiltersChange,
  showPartnerFilter = false,
  partners = [],
}: ProductionFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const setDatePreset = (preset: 'last_6_months' | 'last_year' | 'last_3_months' | 'current_month') => {
    const now = new Date()
    let startDate: Date

    switch (preset) {
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    onFiltersChange({
      ...filters,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-xs"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      {/* Date Presets */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDatePreset('current_month')}
          className="h-8 text-xs"
        >
          <Calendar className="mr-1 h-3 w-3" />
          Current Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDatePreset('last_3_months')}
          className="h-8 text-xs"
        >
          Last 3 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDatePreset('last_6_months')}
          className="h-8 text-xs"
        >
          Last 6 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDatePreset('last_year')}
          className="h-8 text-xs"
        >
          Last Year
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Partner Filter (only for coordinators) */}
          {showPartnerFilter && partners.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Partner</label>
              <select
                value={filters.partner_id || ''}
                onChange={(e) => handleFilterChange('partner_id', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Partners</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as ProductionEntryStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value={ProductionEntryStatus.DRAFT}>Draft</option>
              <option value={ProductionEntryStatus.PENDING}>Pending</option>
              <option value={ProductionEntryStatus.APPROVED}>Approved</option>
              <option value={ProductionEntryStatus.VALIDATED}>Validated</option>
              <option value={ProductionEntryStatus.FLAGGED}>Flagged</option>
              <option value={ProductionEntryStatus.REJECTED}>Rejected</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date</label>
            <Input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">End Date</label>
            <Input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Min Temperature */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Min Temperature (°F)</label>
            <Input
              type="number"
              placeholder="e.g., 50"
              value={filters.min_temperature || ''}
              onChange={(e) => handleFilterChange('min_temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full"
            />
          </div>

          {/* Max Temperature */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Max Temperature (°F)</label>
            <Input
              type="number"
              placeholder="e.g., 120"
              value={filters.max_temperature || ''}
              onChange={(e) => handleFilterChange('max_temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full"
            />
          </div>

          {/* Min BSW */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Min BSW (%)</label>
            <Input
              type="number"
              placeholder="e.g., 0"
              min="0"
              max="100"
              step="0.1"
              value={filters.min_bsw || ''}
              onChange={(e) => handleFilterChange('min_bsw', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full"
            />
          </div>

          {/* Max BSW */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Max BSW (%)</label>
            <Input
              type="number"
              placeholder="e.g., 100"
              min="0"
              max="100"
              step="0.1"
              value={filters.max_bsw || ''}
              onChange={(e) => handleFilterChange('max_bsw', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
