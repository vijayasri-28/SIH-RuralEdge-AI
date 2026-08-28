export interface GeoLocation {
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
  block_code: number;
  block_name: string;
  village_code?: number;
  village_name?: string;
  fallback_level_applied?: 'VILLAGE' | 'BLOCK' | 'DISTRICT';
}

export interface BusinessArchetype {
  archetype_id: string;
  category: string;
  name: string;
  description: string;
  benchmark_project_cost: number;
  suggested_scale: string;
  capex_breakdown: Record<string, number>;
  typical_monthly_revenue: number;
  typical_monthly_opex: number;
  estimated_monthly_ebitda: number;
  raw_material_dependency: string;
  market_catchment_km: number;
  power_requirement: string;
}

export interface MinimalOnboardingInput {
  location: GeoLocation;
  business_archetype_id: string;
  available_margin_capital: number;
  custom_project_cost?: number;
  activity_type?: string;
}

export interface EligibilityProfile {
  social_category: 'SC' | 'SafaiKaramchari' | 'ST' | 'OBC' | 'General' | 'Divyang';
  annual_family_income_inr: number;
  gender: 'Female' | 'Male' | 'Transgender';
  has_prior_experience_or_training: boolean;
  is_shg_member?: boolean;
  channel_agency_margin_pct?: number;
}

export interface AmortizationScheduleItem {
  period_number: number;
  is_moratorium: boolean;
  opening_principal: number;
  interest_charged: number;
  principal_repaid: number;
  total_installment: number;
  closing_principal: number;
}

export interface DeterministicFinancialPlan {
  eligible: boolean;
  selected_scheme_id?: string;
  selected_scheme_name?: string;
  reason_code?: string;
  message?: string;
  project_cost: number;
  available_capital: number;
  verified_subsidy: number;
  maximum_loan_by_percentage: number;
  absolute_loan_cap: number;
  maximum_scheme_loan: number;
  loan_required: number;
  approved_loan: number;
  total_funding_secured: number;
  financing_gap: number;
  agency_margin_required: number;
  additional_agency_margin_needed: number;
  interest_rate_pa: number;
  repayment_frequency: string;
  total_periods: number;
  moratorium_periods: number;
  moratorium_months: number;
  moratorium_periodic_interest: number;
  active_repayment_periods: number;
  installment_amount: number;
  total_interest_payable: number;
  total_repayment_amount: number;
  working_capital_required: number;
  break_even_monthly_revenue: number;
  estimated_monthly_ebitda: number;
  average_dscr: number;
  is_dscr_viable: boolean;
  statutory_disclaimer: string;
  schedule: AmortizationScheduleItem[];
}

export interface EvidenceLineageItem {
  attribute: string;
  value: string;
  source_title: string;
  source_url: string;
  effective_date?: string;
  last_verified_date?: string;
  authority: string;
  confidence_tier: 'STATUTORY_GROUND_TRUTH' | 'PUBLIC_BENCHMARK' | 'DERIVED_HEURISTIC';
}

export interface ExplainableDataConfidence {
  composite_score_pct: number;
  qualitative_rating: 'HIGH' | 'MEDIUM' | 'LOW';
  source_authority_score: number;
  geographic_specificity_score: number;
  freshness_score: number;
  completeness_score: number;
  consistency_score: number;
  fallback_notice?: string;
  lineage_items: EvidenceLineageItem[];
}

export interface SWOTAdvisory {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  local_niche_recommendation: string;
  risk_mitigation_strategies: string[];
  channel_agency_next_steps: string[];
}

export interface FeasibilityEvaluationResponse {
  report_id: string;
  created_at: string;
  onboarding: MinimalOnboardingInput;
  eligibility: EligibilityProfile;
  archetype_details: BusinessArchetype;
  geo_context: Record<string, any>;
  financial_plan: DeterministicFinancialPlan;
  data_confidence: ExplainableDataConfidence;
  swot_advisory: SWOTAdvisory;
  evidence_lineage: EvidenceLineageItem[];
}
