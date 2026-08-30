import type {
  MinimalOnboardingInput,
  EligibilityProfile,
  FeasibilityEvaluationResponse,
  DeterministicFinancialPlan,
  BusinessArchetype
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function fetchStates() {
  const res = await fetch(`${API_BASE_URL}/geo/states`);
  if (!res.ok) throw new Error('Failed to fetch states');
  return res.json();
}

export async function fetchDistricts(stateCode: number) {
  const res = await fetch(`${API_BASE_URL}/geo/districts?state_code=${stateCode}`);
  if (!res.ok) throw new Error('Failed to fetch districts');
  return res.json();
}

export async function fetchBlocks(stateCode: number, districtCode: number) {
  const res = await fetch(`${API_BASE_URL}/geo/blocks?state_code=${stateCode}&district_code=${districtCode}`);
  if (!res.ok) throw new Error('Failed to fetch blocks');
  return res.json();
}

export async function fetchVillages(stateCode: number, districtCode: number, blockCode: number) {
  const res = await fetch(`${API_BASE_URL}/geo/villages?state_code=${stateCode}&district_code=${districtCode}&block_code=${blockCode}`);
  if (!res.ok) throw new Error('Failed to fetch villages');
  return res.json();
}

export async function fetchArchetypes(): Promise<{ archetypes: BusinessArchetype[] }> {
  const res = await fetch(`${API_BASE_URL}/business/archetypes`);
  if (!res.ok) throw new Error('Failed to fetch business archetypes');
  return res.json();
}

export async function fetchSchemesCatalog() {
  const res = await fetch(`${API_BASE_URL}/schemes/catalog`);
  if (!res.ok) throw new Error('Failed to fetch schemes catalog');
  return res.json();
}

export async function calculateDeterministicFinancialPlan(payload: {
  project_cost: number;
  available_capital: number;
  annual_family_income: number;
  social_category: string;
  verified_subsidy?: number;
  activity_type?: string;
  channel_agency_margin_pct?: number;
}): Promise<DeterministicFinancialPlan> {
  const res = await fetch(`${API_BASE_URL}/financial/calculate-deterministic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to calculate financial plan');
  return res.json();
}

export async function evaluateFeasibility(
  onboarding: MinimalOnboardingInput,
  eligibility: EligibilityProfile,
  verifiedSubsidy: number = 0.0
): Promise<FeasibilityEvaluationResponse> {
  const res = await fetch(`${API_BASE_URL}/feasibility/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      onboarding,
      eligibility,
      verified_subsidy: verifiedSubsidy
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Evaluation request failed' }));
    throw new Error(err.detail || 'Failed to evaluate feasibility');
  }
  return res.json();
}

export async function sendAdvisorChatMessage(payload: {
  report_id?: string;
  language: string;
  user_message: string;
  conversation_history?: Array<{ role: string; content: string }>;
  feasibility_context?: any;
}) {
  const res = await fetch(`${API_BASE_URL}/advisor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to send advisory chat message');
  return res.json();
}

export function getDprPdfDownloadUrl(reportId: string): string {
  return `${API_BASE_URL}/reports/export-dpr-pdf?report_id=${encodeURIComponent(reportId)}`;
}

export async function downloadDprPdf(reportId: string, reportData?: FeasibilityEvaluationResponse) {
  // Helper: trigger a browser download from a Blob
  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  };

  // 1. Try GET request — works when the report is cached in the backend session
  try {
    const res = await fetch(
      `${API_BASE_URL}/reports/export-dpr-pdf?report_id=${encodeURIComponent(reportId)}`
    );
    if (res.ok) {
      triggerBlobDownload(await res.blob(), `DPR_${reportId}.pdf`);
      return;
    }
    // Non-OK (e.g. 404 if session expired) — fall through to POST
    console.warn(`GET /export-dpr-pdf returned ${res.status}; falling back to POST with full payload.`);
  } catch (err) {
    console.warn('GET DPR download network error; falling back to POST:', err);
  }

  // 2. POST fallback — sends the full report JSON so the backend can generate the PDF
  //    without needing the server-side session cache.
  if (reportData) {
    const postRes = await fetch(`${API_BASE_URL}/reports/export-dpr-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (!postRes.ok) {
      const errDetail = await postRes.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errDetail.detail || 'Failed to generate DPR PDF');
    }
    triggerBlobDownload(await postRes.blob(), `DPR_${reportId}.pdf`);
  } else {
    // Last resort: open URL directly in a new tab (only if no reportData)
    window.open(getDprPdfDownloadUrl(reportId), '_blank');
  }
}


export async function registerUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }

  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  return data;
}
