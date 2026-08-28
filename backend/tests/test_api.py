import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["income_ceiling_inr"] == 500000.0

def test_geo_states_and_districts():
    res_states = client.get("/api/v1/geo/states")
    assert res_states.status_code == 200
    states = res_states.json()["states"]
    assert len(states) >= 3

    # Test Telangana (code 36)
    res_dist = client.get("/api/v1/geo/districts?state_code=36")
    assert res_dist.status_code == 200
    districts = res_dist.json()["districts"]
    assert len(districts) >= 2
    assert any(d["district_name"] == "Mahabubnagar" for d in districts)

def test_archetypes_endpoint():
    res = client.get("/api/v1/business/archetypes")
    assert res.status_code == 200
    archetypes = res.json()["archetypes"]
    assert len(archetypes) >= 6
    assert any(a["archetype_id"] == "mini_flour_dal_mill" for a in archetypes)

def test_schemes_catalog_endpoint():
    res = client.get("/api/v1/schemes/catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert catalog["general_eligibility"]["annual_family_income_ceiling_inr"] == 500000
    assert len(catalog["schemes"]) == 2

def test_deterministic_calculation_api():
    payload = {
        "project_cost": 100000.0,
        "available_capital": 10000.0,
        "annual_family_income": 250000.0,
        "social_category": "SC",
        "verified_subsidy": 0.0
    }
    res = client.post("/api/v1/financial/calculate-deterministic", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["eligible"] is True
    assert data["approved_loan"] == 90000.0
    assert data["repayment_frequency"] == "QUARTERLY"
    assert data["financing_gap"] == 0.0

def test_end_to_end_feasibility_evaluation():
    payload = {
        "onboarding": {
            "location": {
                "state_code": 36,
                "state_name": "Telangana",
                "district_code": 505,
                "district_name": "Mahabubnagar",
                "block_code": 4310,
                "block_name": "Kondurg",
                "village_code": 574890,
                "village_name": "Kondurg",
                "fallback_level_applied": "VILLAGE"
            },
            "business_archetype_id": "spice_chilly_grinding",
            "available_margin_capital": 15000.0,
            "activity_type": "standard"
        },
        "eligibility": {
            "social_category": "SC",
            "annual_family_income_inr": 280000.0,
            "gender": "Female",
            "has_prior_experience_or_training": True
        },
        "verified_subsidy": 0.0
    }
    res = client.post("/api/v1/feasibility/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "report_id" in data
    assert data["financial_plan"]["eligible"] is True
    assert data["data_confidence"]["qualitative_rating"] == "HIGH"
    assert len(data["swot_advisory"]["strengths"]) >= 2
    assert len(data["evidence_lineage"]) >= 2

    # Test DPR PDF Export using report_id
    rep_id = data["report_id"]
    pdf_res = client.post(f"/api/v1/reports/export-dpr-pdf?report_id={rep_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000 # Valid PDF bytes
