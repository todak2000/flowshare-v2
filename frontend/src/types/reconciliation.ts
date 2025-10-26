export enum ReconciliationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface PartnerAllocation {
  partner_id: string
  partner_name: string
  gross_volume: number
  bsw_percent: number
  water_cut_factor: number
  net_volume_observed: number
  temperature_correction_factor: number
  api_correction_factor: number
  net_volume_standard: number
  ownership_percent: number
  allocated_volume: number
  intermediate_calculations?: Record<string, any>
}

export interface ReconciliationResult {
  total_gross_volume: number
  total_net_volume_standard: number
  total_allocated_volume: number
  shrinkage_volume: number
  shrinkage_percent: number
  partner_allocations: PartnerAllocation[]
  allocation_model_used: string
}

export interface Reconciliation {
  id: string
  tenant_id: string
  triggered_by: string
  period_start: string
  period_end: string
  terminal_volume: number
  status: ReconciliationStatus
  result?: ReconciliationResult
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface TerminalReceipt {
  id: string
  tenant_id: string
  receipt_date: string
  terminal_volume: number
  terminal_name?: string
  operator_name?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at?: string
}

export interface PaginationMeta {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface PaginatedTerminalReceipts {
  data: TerminalReceipt[]
  pagination: PaginationMeta
}
