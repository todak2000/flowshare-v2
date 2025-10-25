"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Download, RefreshCw, TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, Column } from "@/components/ui/data-table"
import { ProductionFiltersComponent } from "@/components/production/production-filters"
import { ProductionLineChart } from "@/components/charts/production-line-chart"
import { ProductionPieChart } from "@/components/charts/production-pie-chart"
import { ProductionEntryModal } from "@/components/production/production-entry-modal"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"
import {
  ProductionEntry,
  ProductionFilters,
  ProductionStats,
  ProductionEntryStatus,
} from "@/types/production"

export default function ProductionPage() {
  const router = useRouter()
  const { getTenantId, getUserRole, user } = useAuthStore()
  const [entries, setEntries] = React.useState<ProductionEntry[]>([])
  const [stats, setStats] = React.useState<ProductionStats[]>([])
  const [partners, setPartners] = React.useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [statsLoading, setStatsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(31) // Monthly partition - 31 days
  const [totalItems, setTotalItems] = React.useState(0)
  const [filters, setFilters] = React.useState<ProductionFilters>(() => {
    // Default to current month
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }
  })
  const [showCharts, setShowCharts] = React.useState(false)
  const [entryModalOpen, setEntryModalOpen] = React.useState(false)

  const userRole = getUserRole() || ''


  // Fetch partners list (for coordinators)
  React.useEffect(() => {
    const fetchPartners = async () => {
      if (userRole !== 'coordinator') return

      const tenantId = getTenantId()
      if (!tenantId) {
        console.error('No tenant_id available')
        return
      }

      try {
        const data = await apiClient.get<Array<{ id: string; name: string }>>(`/api/partners?tenant_id=${tenantId}`)
        setPartners(data)
      } catch (error) {
        console.error('Failed to fetch partners:', error)
      }
    }
    fetchPartners()
  }, [userRole, getTenantId])

  // Fetch production entries
  const fetchEntries = React.useCallback(async () => {
    const tenantId = getTenantId()
    if (!tenantId) {
      console.error('No tenant_id available, redirecting to login')
      router.push('/auth/login')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filters.partner_id && { partner_id: filters.partner_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.min_temperature !== undefined && { min_temperature: filters.min_temperature.toString() }),
        ...(filters.max_temperature !== undefined && { max_temperature: filters.max_temperature.toString() }),
        ...(filters.min_bsw !== undefined && { min_bsw: filters.min_bsw.toString() }),
        ...(filters.max_bsw !== undefined && { max_bsw: filters.max_bsw.toString() }),
      })

      const data = await apiClient.get<ProductionEntry[]>(`/api/production/entries?${params}`)
      setEntries(data)
      // Note: Backend doesn't return total count, so we estimate based on page size
      setTotalItems(data.length < pageSize ? (page - 1) * pageSize + data.length : page * pageSize + 1)
    } catch (error: any) {
      console.error('Failed to fetch production entries:', error)
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters, router, getTenantId])

  // Fetch statistics
  const fetchStats = React.useCallback(async () => {
    const tenantId = getTenantId()
    if (!tenantId) {
      console.error('No tenant_id available for fetching stats')
      setStatsLoading(false)
      return
    }

    setStatsLoading(true)
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      })

      const data = await apiClient.get<ProductionStats[]>(`/api/production/stats?${params}`)
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch production stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [filters.start_date, filters.end_date, getTenantId])

  React.useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleFiltersChange = (newFilters: ProductionFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleRefresh = () => {
    fetchEntries()
    fetchStats()
  }

  const getStatusBadge = (status: ProductionEntryStatus) => {
    const styles: Record<ProductionEntryStatus, string> = {
      [ProductionEntryStatus.DRAFT]: 'bg-muted text-muted-foreground',
      [ProductionEntryStatus.PENDING]: 'bg-warning/20 text-warning-foreground',
      [ProductionEntryStatus.APPROVED]: 'bg-success/20 text-success-foreground',
      [ProductionEntryStatus.VALIDATED]: 'bg-primary/20 text-primary-foreground',
      [ProductionEntryStatus.FLAGGED]: 'bg-destructive/20 text-destructive-foreground',
      [ProductionEntryStatus.REJECTED]: 'bg-destructive text-destructive-foreground',
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const columns: Column<ProductionEntry>[] = [
    {
      key: 'measurement_date',
      header: 'Date',
      sortable: true,
      width: '120px',
      render: (row) => new Date(row.measurement_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    {
      key: 'gross_volume',
      header: 'Gross Vol. (bbls)',
      sortable: true,
      width: '140px',
      render: (row) => row.gross_volume.toFixed(2),
    },
    {
      key: 'net_volume',
      header: 'Net Vol. (bbls)',
      sortable: true,
      width: '140px',
      render: (row) => (row.gross_volume * (1 - row.bsw_percent / 100) * row.meter_factor).toFixed(2),
    },
    {
      key: 'bsw_percent',
      header: 'BSW %',
      sortable: true,
      width: '100px',
      render: (row) => `${row.bsw_percent.toFixed(2)}%`,
    },
    {
      key: 'temperature',
      header: 'Temp (°F)',
      sortable: true,
      width: '100px',
      render: (row) => row.temperature.toFixed(1),
    },
    {
      key: 'api_gravity',
      header: 'API Gravity',
      sortable: true,
      width: '110px',
      render: (row) => row.api_gravity.toFixed(2),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => getStatusBadge(row.status),
    },
  ]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Production Data</h1>
            <p className="text-sm text-muted-foreground">
              {userRole === 'coordinator'
                ? 'View and manage production data for all partners'
                : 'View and manage your production data'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Hide Charts
                </>
              ) : (
                <>
                  <PieChartIcon className="mr-2 h-4 w-4" />
                  Show Charts
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {(userRole === 'coordinator' || userRole === 'field_operator') && (
              <Button size="sm" onClick={() => setEntryModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Filters */}
          <ProductionFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showPartnerFilter={userRole === 'coordinator'}
            partners={partners}
          />

          {/* Charts */}
          {showCharts && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProductionLineChart data={entries} />
              <ProductionPieChart stats={stats} loading={statsLoading} />
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Production Entries</h2>
            <DataTable
              data={entries}
              columns={columns}
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              loading={loading}
              emptyMessage="No production entries found. Try adjusting your filters or add a new entry."
            />
          </div>
        </div>
      </div>

      {/* Production Entry Modal */}
      <ProductionEntryModal
        open={entryModalOpen}
        onOpenChange={setEntryModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
