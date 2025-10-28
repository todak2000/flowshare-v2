export interface Partner {
  id: string;
  name: string;
  organization?: string;
}

export interface TestData {
  gross_volume: string;
  bsw_percent: string;
  temperature: string;
  api_gravity: string;
}

export interface SCADADocsInteractiveTestProps {
  testApiKey: string;
  onApiKeyChange: (key: string) => void;
  testPartnerId: string;
  onPartnerIdChange: (id: string) => void;
  partners: Partner[];
  loadingPartners: boolean;
  testData: TestData;
  onTestDataChange: (data: TestData) => void;
  testResponse: any;
  testing: boolean;
  testError: string | null;
  onTestAPI: () => void;
  onCopyCode: (code: string) => void;
  userRole?: string;
}


export const TEST_DATA_FIELDS = [
  {
    id: "gross_volume",
    label: "Gross Volume (BBL)",
    key: "gross_volume" as keyof TestData,
  },
  {
    id: "bsw_percent",
    label: "BSW %",
    key: "bsw_percent" as keyof TestData,
  },
  {
    id: "temperature",
    label: "Temperature (°F)",
    key: "temperature" as keyof TestData,
  },
  {
    id: "api_gravity",
    label: "API Gravity",
    key: "api_gravity" as keyof TestData,
  },
] as const;

// Response field configurations for JSON display
export const RESPONSE_FIELDS = [
  { key: "id", type: "string" as const },
  { key: "tenant_id", type: "string" as const },
  { key: "partner_id", type: "string" as const },
  { key: "gross_volume", type: "number" as const },
  { key: "bsw_percent", type: "number" as const },
  { key: "temperature", type: "number" as const },
  { key: "api_gravity", type: "number" as const },
  { key: "status", type: "string" as const },
  { key: "environment", type: "string" as const },
  { key: "created_at", type: "string" as const },
] as const;

export const API_PARAMETERS = [
  {
    name: "partner_id",
    type: "string",
    required: true,
    description: "ID of the partner submitting data",
  },
  {
    name: "gross_volume",
    type: "number",
    required: true,
    description: "Gross volume in barrels",
  },
  {
    name: "bsw_percent",
    type: "number",
    required: true,
    description: "Basic Sediment & Water percentage",
  },
  {
    name: "temperature",
    type: "number",
    required: true,
    description: "Temperature in °F",
  },
  {
    name: "api_gravity",
    type: "number",
    required: true,
    description: "API gravity",
  },
  {
    name: "measurement_date",
    type: "string",
    required: true,
    description: "ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)",
  },
];

export const RESPONSE_EXAMPLE = `{
  "id": "entry-uuid",
  "tenant_id": "tenant-id",
  "partner_id": "partner-123",
  "gross_volume": 1000.5,
  "bsw_percent": 2.5,
  "temperature": 60.0,
  "api_gravity": 35.0,
  "measurement_date": "2025-10-27T12:00:00Z",
  "status": "pending",
  "environment": "test",
  "created_at": "2025-10-27T12:01:00Z",
  "created_by": "scada_api"
}`;

export const ERROR_CODES = [
  {
    code: 401,
    title: "Unauthorized",
    description: "Invalid or missing API key",
  },
  {
    code: 403,
    title: "Forbidden",
    description: "API key is revoked or expired",
  },
  {
    code: 404,
    title: "Not Found",
    description: "Partner ID does not exist",
  },
  {
    code: 422,
    title: "Validation Error",
    description: "Invalid data format or missing required fields",
  },
  {
    code: 500,
    title: "Internal Server Error",
    description: "Server error - contact support",
  },
];