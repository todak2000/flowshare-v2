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
  partners?: Array<{ id: string; name: string; organization?: string }>
}

export function ProductionFiltersComponent({
  filters,
  onFiltersChange,
  showPartnerFilter = false,
  partners = [],
}: ProductionFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState<string | null>('current_month')

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined })
    setActivePreset(null) // Clear active preset when manual filter is applied
  }

  const clearFilters = () => {
    onFiltersChange({})
    setActivePreset(null)
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
    setActivePreset(preset)
  }

  const setMonthPreset = (monthOffset: number) => {
    const now = new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

    onFiltersChange({
      ...filters,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })
    setActivePreset(`month_${monthOffset}`)
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
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activePreset === 'current_month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatePreset('current_month')}
            className="h-8 text-xs"
          >
            <Calendar className="mr-1 h-3 w-3" />
            Current Month
          </Button>
          <Button
            variant={activePreset === 'last_3_months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatePreset('last_3_months')}
            className="h-8 text-xs"
          >
            Last 3 Months
          </Button>
          <Button
            variant={activePreset === 'last_6_months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatePreset('last_6_months')}
            className="h-8 text-xs"
          >
            Last 6 Months
          </Button>
          <Button
            variant={activePreset === 'last_year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatePreset('last_year')}
            className="h-8 text-xs"
          >
            Last Year
          </Button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Or select a specific month:</span>
          <select
            onChange={(e) => setMonthPreset(parseInt(e.target.value))}
            value={activePreset?.startsWith('month_') ? activePreset.replace('month_', '') : ''}
            className="h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const offset = -i
              const date = new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1)
              return (
                <option key={offset} value={offset}>
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              )
            })}
          </select>
        </div>
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
                    {partner.organization || partner.name}
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
              <option value={ProductionEntryStatus.PENDING}>Pending</option>
              <option value={ProductionEntryStatus.APPROVED}>Approved</option>
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
