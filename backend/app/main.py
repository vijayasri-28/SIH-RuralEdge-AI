import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from .models.schemas import (
    FinancialCalcRequest,
    DeterministicFinancialPlanResponse,
    FeasibilityEvaluationRequest,
    FeasibilityEvaluationResponse,
    ChatAdvisoryRequest,
    ChatAdvisoryResponse,
    ExplainableDataConfidenceResponse
)
from .services.scheme_engine import scheme_engine
from .services.financial_engine import financial_engine
from .services.geo_service import geo_service
from .services.confidence_service import confidence_service
from .services.gemini_advisory import gemini_advisory_service
from .services.pdf_service import pdf_generator

app = FastAPI(
    title="RuralEdge AI - NSFDC Hyper-Local Rural Micro-Enterprise Advisory Platform",
    description="Smart India Hackathon (SIH) Solution: AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for saved reports in MVP
SAVED_REPORTS: Dict[str, Any] = {}

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RuralEdge AI Advisory Engine",
        "timestamp": datetime.now().isoformat(),
        "nsfdc_catalog_version": scheme_engine.get_all_schemes_catalog().get("catalog_version", "2026.1"),
        "income_ceiling_inr": float(scheme_engine.income_ceiling)
    }

@app.get("/api/v1/geo/states")
def get_states():
    return {"states": geo_service.get_states()}

@app.get("/api/v1/geo/districts")
def get_districts(state_code: int = Query(..., description="LGD State Code")):
    districts = geo_service.get_districts(state_code)
    if not districts:
        raise HTTPException(status_code=404, detail="No districts found for provided state code.")
    return {"districts": districts}

@app.get("/api/v1/geo/blocks")
def get_blocks(
    state_code: int = Query(...),
    district_code: int = Query(...)
):
    blocks = geo_service.get_blocks(state_code, district_code)
    if not blocks:
        raise HTTPException(status_code=404, detail="No blocks found for provided state/district.")
    return {"blocks": blocks}

@app.get("/api/v1/geo/villages")
def get_villages(
    state_code: int = Query(...),
    district_code: int = Query(...),
    block_code: int = Query(...)
):
    villages = geo_service.get_villages(state_code, district_code, block_code)
    return {"villages": villages}

@app.get("/api/v1/business/archetypes")
def get_archetypes(
    state_code: Optional[int] = Query(None, description="LGD State Code"),
    district_code: Optional[int] = Query(None, description="LGD District Code"),
    block_code: Optional[int] = Query(None, description="LGD Block Code"),
    village_code: Optional[int] = Query(None, description="LGD Village Code")
):
    return {
        "archetypes": geo_service.get_archetypes(
            state_code=state_code,
            district_code=district_code,
            block_code=block_code,
            village_code=village_code
        )
    }

@app.get("/api/v1/schemes/catalog")
def get_schemes_catalog():
    return scheme_engine.get_all_schemes_catalog()

@app.post("/api/v1/financial/calculate-deterministic", response_model=DeterministicFinancialPlanResponse)
def calculate_financial_plan(req: FinancialCalcRequest):
    """
    100% Deterministic Financial Engine Endpoint.
    Calculates loan limits, quarterly/monthly installments, DSCR, and financing gap.
    """
    res = financial_engine.calculate(
        project_cost=req.project_cost,
        available_capital=req.available_capital,
        annual_family_income=req.annual_family_income,
        social_category=req.social_category,
        verified_subsidy=req.verified_subsidy,
        activity_type=req.activity_type,
        channel_agency_margin_pct=req.channel_agency_margin_pct
    )
    return res

@app.post("/api/v1/feasibility/evaluate", response_model=FeasibilityEvaluationResponse)
def evaluate_feasibility(req: FeasibilityEvaluationRequest):
    """
    Complete end-to-end evaluation pipeline:
    1. LGD Geographic context retrieval & fallback check
    2. Deterministic Financial Math & NSFDC Scheme routing
    3. 5-Dimension Explainable Data Confidence evaluation & Lineage
    4. Dynamic SWOT matrix, risk mitigation & SCA next steps
    """
    onb = req.onboarding
    elig = req.eligibility

    # Retrieve archetype
    archetype = geo_service.get_archetype_by_id(onb.business_archetype_id)
    if not archetype:
        raise HTTPException(status_code=404, detail=f"Archetype '{onb.business_archetype_id}' not found.")

    # Project cost: user custom cost or benchmark
    effective_project_cost = onb.custom_project_cost if onb.custom_project_cost and onb.custom_project_cost > 0 else float(archetype.get("benchmark_project_cost", 100000.0))

    # Retrieve geo context
    geo_ctx = geo_service.get_geo_context(
        state_code=onb.location.state_code,
        district_code=onb.location.district_code,
        block_code=onb.location.block_code,
        village_code=onb.location.village_code
    )
    fallback_level = geo_ctx.get("fallback_level", "VILLAGE")

    # Run Deterministic Financial Engine
    fin_plan = financial_engine.calculate(
        project_cost=effective_project_cost,
        available_capital=onb.available_margin_capital,
        annual_family_income=elig.annual_family_income_inr,
        social_category=elig.social_category,
        verified_subsidy=req.verified_subsidy,
        activity_type=onb.activity_type,
        channel_agency_margin_pct=elig.channel_agency_margin_pct,
        estimated_monthly_ebitda=archetype.get("estimated_monthly_ebitda")
    )

    # Evaluate 5-Dimension Data Confidence & Lineage
    confidence_res = confidence_service.evaluate(
        fallback_level=fallback_level,
        has_custom_cost=(onb.custom_project_cost is not None),
        has_experience=elig.has_prior_experience_or_training,
        scheme_id=fin_plan.get("selected_scheme_id")
    )

    # Generate Dynamic SWOT Advisory
    swot_res = gemini_advisory_service.generate_swot_and_niche_advisory(
        archetype=archetype,
        geo_context=geo_ctx,
        financial_plan=fin_plan,
        eligibility=elig.model_dump()
    )

    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    response_payload = FeasibilityEvaluationResponse(
        report_id=report_id,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        onboarding=onb,
        eligibility=elig,
        archetype_details=archetype,
        geo_context=geo_ctx,
        financial_plan=DeterministicFinancialPlanResponse(**fin_plan),
        data_confidence=confidence_res,
        swot_advisory=swot_res,
        evidence_lineage=confidence_res.lineage_items
    )

    # Persist in session cache
    SAVED_REPORTS[report_id] = response_payload.model_dump()
    return response_payload

@app.post("/api/v1/advisor/chat", response_model=ChatAdvisoryResponse)
def advisor_chat(req: ChatAdvisoryRequest):
    """
    Multilingual Indic Conversational Advisor (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, English).
    """
    feasibility_context = None
    if req.report_id and req.report_id in SAVED_REPORTS:
        feasibility_context = SAVED_REPORTS[req.report_id]
    elif req.feasibility_context:
        feasibility_context = req.feasibility_context

    res = gemini_advisory_service.chat_advisory(
        language=req.language,
        user_message=req.user_message,
        conversation_history=req.conversation_history,
        feasibility_context=feasibility_context
    )
    return res

@app.get("/api/v1/reports/export-dpr-pdf")
def export_dpr_pdf_get(
    report_id: str = Query(..., description="Report ID to export")
):
    """
    GET endpoint: Downloads a bank-ready DPR PDF by report_id (stored in session cache).
    """
    if report_id not in SAVED_REPORTS:
        raise HTTPException(
            status_code=404,
            detail=f"Report ID '{report_id}' not found in active session. Please evaluate feasibility again."
        )

    report_data = SAVED_REPORTS[report_id]
    pdf_buffer = pdf_generator.generate_dpr_pdf(report_data)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="DPR_{report_id}.pdf"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/api/v1/reports/export-dpr-pdf")
def export_dpr_pdf_post(
    payload: Dict[str, Any] = Body(..., description="Full FeasibilityEvaluationResponse JSON")
):
    """
    POST endpoint: Accepts the full report JSON body and generates a DPR PDF.
    Used as a fallback when the report_id is not in the server session cache.
    """
    if not payload or not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="A valid report JSON body must be provided."
        )

    target_id = payload.get("report_id", "REPORT")
    pdf_buffer = pdf_generator.generate_dpr_pdf(payload)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="DPR_{target_id}.pdf"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
