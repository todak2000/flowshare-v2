export enum ProductionEntryStatus {
  PENDING = "pending",
  APPROVED = "approved",
  FLAGGED = "flagged",
  PENDING_APPROVAL = "pending_approval",
  REJECTED = "rejected"
}

export interface ProductionEntry {
  id: string
  tenant_id: string
  partner_id: string
  submitted_by: string
  measurement_date: string
  gross_volume: number
  bsw_percent: number
  temperature: number
  api_gravity: number
  pressure?: number
  meter_factor: number
  status: ProductionEntryStatus
  validation_notes?: string
  anomaly_score?: number
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
  edited_by?: string
  edited_at?: string
  edit_reason?: string
}

export interface ProductionEntryCreate {
  tenant_id: string
  partner_id: string
  measurement_date: string
  gross_volume: number
  bsw_percent: number
  temperature: number
  api_gravity: number
  pressure?: number
  meter_factor?: number
}

export interface ProductionEntryUpdate {
  measurement_date?: string
  gross_volume?: number
  bsw_percent?: number
  temperature?: number
  api_gravity?: number
  pressure?: number
  meter_factor?: number
  status?: ProductionEntryStatus
  validation_notes?: string
  edit_reason?: string
}

export interface ProductionStats {
  partner_id: string
  partner_name: string
  total_volume: number
  percentage: number
  entry_count: number
}

export interface ProductionFilters {
  partner_id?: string
  status?: ProductionEntryStatus
  start_date?: string
  end_date?: string
  min_temperature?: number
  max_temperature?: number
  min_bsw?: number
  max_bsw?: number
}
