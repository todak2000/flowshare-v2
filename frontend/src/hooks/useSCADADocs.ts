import { useState, useEffect } from "react";
import { UserProfile } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { formatDetailError } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  organization?: string;
}

interface TestData {
  gross_volume: string;
  bsw_percent: string;
  temperature: string;
  api_gravity: string;
}

export function useSCADADocs(user: UserProfile | null) {
  const [selectedLanguage, setSelectedLanguage] = useState("curl");
  const [testApiKey, setTestApiKey] = useState("");
  const [testPartnerId, setTestPartnerId] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [testData, setTestData] = useState<TestData>({
    gross_volume: "1000.5",
    bsw_percent: "2.5",
    temperature: "60.0",
    api_gravity: "35.0",
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch partners list for coordinators
  useEffect(() => {
    const fetchPartners = async () => {
      if (!user) return;

      if (user.role === "coordinator") {
        setLoadingPartners(true);
        try {
          const tenantId = user.tenant_ids[0];
          const data = await apiClient.get<any[]>(
            `/api/partners?tenant_id=${tenantId}`
          );
          const mappedPartners = data
            .filter((p) => p.role === "partner")
            .map((p) => ({
              id: p.id,
              name: p.full_name || p.name,
              organization: p.organization,
            }));
          setPartners(mappedPartners);
        } catch (error) {
          console.error("Failed to fetch partners:", error);
        } finally {
          setLoadingPartners(false);
        }
      } else if (user.partner_id) {
        setTestPartnerId(user.partner_id);
      }
    };

    fetchPartners();
  }, [user]);

  const handleTestAPI = async () => {
    if (!testApiKey || !testPartnerId) {
      setTestError("Please provide an API key and partner ID");
      return;
    }

    setTesting(true);
    setTestError(null);
    setTestResponse(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/scada/production`,
        {
          method: "POST",
          headers: {
            "X-API-Key": testApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partner_id: testPartnerId,
            gross_volume: parseFloat(testData.gross_volume),
            bsw_percent: parseFloat(testData.bsw_percent),
            temperature: parseFloat(testData.temperature),
            api_gravity: parseFloat(testData.api_gravity),
            measurement_date: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setTestError(
          `Error ${response.status}: ${
            formatDetailError(data.detail) || "Unknown error"
          }`
        );
      } else {
        setTestResponse(data);
      }
    } catch (error: any) {
      setTestError(error.message || "Failed to connect to API");
    } finally {
      setTesting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const getCodeExamples = () => {
    const apiKey = testApiKey || "YOUR_API_KEY_HERE";
    const partnerId = testPartnerId || "your-partner-id";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    return {
      curl: `curl -X POST "${baseUrl}/api/scada/production" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "partner_id": "${partnerId}",
    "gross_volume": ${testData.gross_volume},
    "bsw_percent": ${testData.bsw_percent},
    "temperature": ${testData.temperature},
    "api_gravity": ${testData.api_gravity},
    "measurement_date": "2025-10-27T12:00:00Z"
  }'`,
      python: `import requests
from datetime import datetime, timezone

API_KEY = "${apiKey}"
BASE_URL = "${baseUrl}"

def submit_production_data(partner_id, gross_volume, bsw_percent, temperature, api_gravity):
    """Submit production data to FlowShare SCADA API"""

    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "partner_id": partner_id,
        "gross_volume": gross_volume,
        "bsw_percent": bsw_percent,
        "temperature": temperature,
        "api_gravity": api_gravity,
        "measurement_date": datetime.now(timezone.utc).isoformat()
    }

    response = requests.post(
        f"{BASE_URL}/api/scada/production",
        headers=headers,
        json=payload
    )

    response.raise_for_status()
    return response.json()

# Example usage
result = submit_production_data(
    partner_id="${partnerId}",
    gross_volume=${testData.gross_volume},
    bsw_percent=${testData.bsw_percent},
    temperature=${testData.temperature},
    api_gravity=${testData.api_gravity}
)
print(f"Created entry: {result['id']}")`,
      javascript: `// Node.js / JavaScript example
const axios = require('axios');

const API_KEY = '${apiKey}';
const BASE_URL = '${baseUrl}';

async function submitProductionData(partnerId, grossVolume, bswPercent, temperature, apiGravity) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/api/scada/production\`,
      {
        partner_id: partnerId,
        gross_volume: grossVolume,
        bsw_percent: bswPercent,
        temperature: temperature,
        api_gravity: apiGravity,
        measurement_date: new Date().toISOString()
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Entry created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Error submitting data:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
submitProductionData('${partnerId}', ${testData.gross_volume}, ${testData.bsw_percent}, ${testData.temperature}, ${testData.api_gravity});`,
    };
  };

  return {
    selectedLanguage,
    setSelectedLanguage,
    testApiKey,
    setTestApiKey,
    testPartnerId,
    setTestPartnerId,
    partners,
    loadingPartners,
    testData,
    setTestData,
    testResponse,
    testing,
    testError,
    handleTestAPI,
    copyCode,
    getCodeExamples,
  };
}
