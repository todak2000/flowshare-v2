export enum UserRole {
  COORDINATOR = 'coordinator',
  PARTNER = 'partner',
  FIELD_OPERATOR = 'field_operator',
  AUDITOR = 'auditor',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  partner_id?: string;
  tenant_ids: string[];
  notification_settings: NotificationSettings;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_reports: boolean;
  email_anomaly_alerts: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  owner_id: string;
  subscription_plan: string;
  settings: TenantSettings;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  allocation_model: string;
  default_temperature_standard: number;
  default_pressure_standard: number;
}

export interface ProductionEntry {
  id: string;
  tenant_id: string;
  partner_id: string;
  measurement_date: string;
  gross_volume: number;
  bsw_percent: number;
  temperature: number;
  api_gravity: number;
  pressure?: number;
  meter_factor: number;
  status: 'pending' | 'validated' | 'flagged';
  validation_notes?: string;
  anomaly_score?: number;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface Reconciliation {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  terminal_volume: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ReconciliationResult;
  error_message?: string;
  triggered_by: string;
  created_at: string;
  completed_at?: string;
}

export interface ReconciliationResult {
  total_gross_volume: number;
  total_net_volume_standard: number;
  total_allocated_volume: number;
  shrinkage_volume: number;
  shrinkage_percent: number;
  partner_allocations: PartnerAllocation[];
  allocation_model_used: string;
}

export interface PartnerAllocation {
  partner_id: string;
  partner_name: string;
  gross_volume: number;
  bsw_percent: number;
  water_cut_factor: number;
  net_volume_observed: number;
  temperature_correction_factor: number;
  api_correction_factor: number;
  net_volume_standard: number;
  ownership_percent: number;
  allocated_volume: number;
  intermediate_calculations: Record<string, any>;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  partner_id?: string;
  notification_settings: NotificationSettings;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
}
