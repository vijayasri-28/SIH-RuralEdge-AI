import json
from pathlib import Path
from decimal import Decimal
from typing import Dict, Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SCHEMES_FILE = DATA_DIR / "nsfdc_schemes_v2026.json"

class SchemeEngine:
    def __init__(self):
        with open(SCHEMES_FILE, "r", encoding="utf-8") as f:
            self.catalog = json.load(f)
        self.general_eligibility = self.catalog.get("general_eligibility", {})
        self.schemes = {s["scheme_id"]: s for s in self.catalog.get("schemes", [])}
        self.income_ceiling = Decimal(str(self.general_eligibility.get("annual_family_income_ceiling_inr", 500000)))

    def evaluate_eligibility_and_route(
        self,
        project_cost: Decimal,
        annual_family_income: Decimal,
        social_category: str
    ) -> Dict[str, Any]:
        """
        Determines statutory NSFDC eligibility and routes to the appropriate scheme.
        Zero LLM dependency.
        """
        is_sc = (social_category.strip().upper() == "SC")
        income_eligible = (annual_family_income <= self.income_ceiling)

        if not is_sc:
            return {
                "eligible": False,
                "scheme": None,
                "reason_code": "NOT_SC_CATEGORY",
                "message": "NSFDC schemes are strictly for Scheduled Caste (SC) beneficiaries. You may explore general schemes such as PMEGP, PM-MUDRA, or PMFME."
            }

        if not income_eligible:
            return {
                "eligible": False,
                "scheme": None,
                "reason_code": "INCOME_EXCEEDS_CEILING",
                "message": f"Annual family income (Rs {annual_family_income:,.2f}) exceeds the official NSFDC ceiling of Rs {self.income_ceiling:,.2f} (effective 7 January 2026)."
            }

        # Check project cost bounds
        if project_cost <= Decimal("140000.00"):
            scheme = self.schemes.get("NSFDC-MFS-01")
            return {
                "eligible": True,
                "scheme": scheme,
                "reason_code": "ROUTED_MICRO_FINANCE",
                "message": "Project cost is within Rs 1,40,000. Successfully routed to NSFDC Micro Finance Scheme."
            }
        elif project_cost <= Decimal("5000000.00"):
            scheme = self.schemes.get("NSFDC-TLS-01")
            return {
                "eligible": True,
                "scheme": scheme,
                "reason_code": "ROUTED_TERM_LOAN",
                "message": "Project cost is between Rs 1,40,001 and Rs 50,00,000. Successfully routed to NSFDC Term Loan Scheme."
            }
        else:
            return {
                "eligible": False,
                "scheme": None,
                "reason_code": "EXCEEDS_MAX_PROJECT_COST",
                "message": f"Project cost (Rs {project_cost:,.2f}) exceeds the maximum permissible NSFDC single-project limit of Rs 50,00,000."
            }

    def get_scheme_by_id(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        return self.schemes.get(scheme_id)

    def get_all_schemes_catalog(self) -> Dict[str, Any]:
        return self.catalog

scheme_engine = SchemeEngine()
