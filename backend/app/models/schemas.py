from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class GeoLocation(BaseModel):
    state_code: int
    state_name: str
    district_code: int
    district_name: str
    block_code: int
    block_name: str
    village_code: Optional[int] = None
    village_name: Optional[str] = None
    fallback_level_applied: Literal["VILLAGE", "BLOCK", "DISTRICT"] = "VILLAGE"

class MinimalOnboardingInput(BaseModel):
    location: GeoLocation
    business_archetype_id: str
    available_margin_capital: float = Field(..., ge=0.0, description="Actual user-provided promoter capital in INR")
    custom_project_cost: Optional[float] = Field(None, ge=0.0, description="Optional custom project cost in INR")
    activity_type: Optional[str] = Field("standard", description="standard, plantation, or construction")

class EligibilityProfile(BaseModel):
    social_category: Literal["SC", "SafaiKaramchari", "ST", "OBC", "General", "Divyang"]
    annual_family_income_inr: float = Field(..., ge=0.0, description="Annual family income in INR")
    gender: Literal["Female", "Male", "Transgender"] = "Male"
    has_prior_experience_or_training: bool = False
    is_shg_member: bool = False
    channel_agency_margin_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional channelizing agency promoter margin requirement")

class FinancialCalcRequest(BaseModel):
    project_cost: float = Field(..., ge=0.0)
    available_capital: float = Field(..., ge=0.0)
    annual_family_income: float = Field(..., ge=0.0)
    social_category: str
    verified_subsidy: float = Field(0.0, ge=0.0)
    activity_type: Optional[str] = "standard"
    channel_agency_margin_pct: Optional[float] = None

class AmortizationScheduleItem(BaseModel):
    period_number: int
    is_moratorium: bool
    opening_principal: float
    interest_charged: float
    principal_repaid: float
    total_installment: float
    closing_principal: float

class DeterministicFinancialPlanResponse(BaseModel):
    eligible: bool
    selected_scheme_id: Optional[str] = None
    selected_scheme_name: Optional[str] = None
    reason_code: Optional[str] = None
    message: Optional[str] = None
    project_cost: float
    available_capital: float
    verified_subsidy: float
    maximum_loan_by_percentage: float
    absolute_loan_cap: float
    maximum_scheme_loan: float
    loan_required: float
    approved_loan: float
    total_funding_secured: float
    financing_gap: float
    agency_margin_required: float
    additional_agency_margin_needed: float
    interest_rate_pa: float
    repayment_frequency: str
    total_periods: int
    moratorium_periods: int
    moratorium_months: int
    moratorium_periodic_interest: float
    active_repayment_periods: int
    installment_amount: float
    total_interest_payable: float
    total_repayment_amount: float
    working_capital_required: float
    break_even_monthly_revenue: float
    estimated_monthly_ebitda: float
    average_dscr: float
    is_dscr_viable: bool
    statutory_disclaimer: str
    schedule: List[AmortizationScheduleItem] = []

class EvidenceLineageItem(BaseModel):
    attribute: str
    value: str
    source_title: str
    source_url: str
    effective_date: Optional[str] = None
    last_verified_date: Optional[str] = None
    authority: str
    confidence_tier: Literal["STATUTORY_GROUND_TRUTH", "PUBLIC_BENCHMARK", "DERIVED_HEURISTIC"]

class ExplainableDataConfidenceResponse(BaseModel):
    composite_score_pct: float
    qualitative_rating: Literal["HIGH", "MEDIUM", "LOW"]
    source_authority_score: float
    geographic_specificity_score: float
    freshness_score: float
    completeness_score: float
    consistency_score: float
    fallback_notice: Optional[str] = None
    lineage_items: List[EvidenceLineageItem] = []

class FeasibilityEvaluationRequest(BaseModel):
    onboarding: MinimalOnboardingInput
    eligibility: EligibilityProfile
    verified_subsidy: float = Field(0.0, ge=0.0)

class SWOTMatrix(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    local_niche_recommendation: str
    risk_mitigation_strategies: List[str]
    channel_agency_next_steps: List[str]

class FeasibilityEvaluationResponse(BaseModel):
    report_id: str
    created_at: str
    onboarding: MinimalOnboardingInput
    eligibility: EligibilityProfile
    archetype_details: Dict[str, Any]
    geo_context: Dict[str, Any]
    financial_plan: DeterministicFinancialPlanResponse
    data_confidence: ExplainableDataConfidenceResponse
    swot_advisory: SWOTMatrix
    evidence_lineage: List[EvidenceLineageItem]

class ChatAdvisoryRequest(BaseModel):
    report_id: Optional[str] = None
    language: str = Field("hi", description="hi (Hindi), te (Telugu), ta (Tamil), mr (Marathi), bn (Bengali), kn (Kannada), en (English)")
    user_message: str
    conversation_history: List[Dict[str, str]] = []
    feasibility_context: Optional[Dict[str, Any]] = None

class ChatAdvisoryResponse(BaseModel):
    reply_text: str
    language: str
    suggested_quick_questions: List[str] = []
    evidence_citations: List[str] = []
