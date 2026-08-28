from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional, List
from .scheme_engine import scheme_engine

class FinancialEngine:
    def calculate(
        self,
        project_cost: float,
        available_capital: float,
        annual_family_income: float,
        social_category: str,
        verified_subsidy: float = 0.0,
        activity_type: Optional[str] = "standard",
        channel_agency_margin_pct: Optional[float] = None,
        estimated_monthly_ebitda: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        100% Deterministic Financial Calculation Engine.
        Zero LLM dependency. Uses Python Decimal for exact monetary precision.
        """
        # Convert all floating inputs to Decimal for exact precision
        d_project_cost = Decimal(str(project_cost)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        d_available_capital = Decimal(str(available_capital)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        d_income = Decimal(str(annual_family_income)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        d_subsidy = Decimal(str(verified_subsidy)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        # Step 1: Scheme Evaluation
        eval_result = scheme_engine.evaluate_eligibility_and_route(
            project_cost=d_project_cost,
            annual_family_income=d_income,
            social_category=social_category
        )

        if not eval_result["eligible"]:
            return {
                "eligible": False,
                "selected_scheme_id": None,
                "selected_scheme_name": None,
                "reason_code": eval_result["reason_code"],
                "message": eval_result["message"],
                "project_cost": float(d_project_cost),
                "available_capital": float(d_available_capital),
                "verified_subsidy": float(d_subsidy),
                "maximum_loan_by_percentage": 0.0,
                "absolute_loan_cap": 0.0,
                "maximum_scheme_loan": 0.0,
                "loan_required": 0.0,
                "approved_loan": 0.0,
                "total_funding_secured": float(d_available_capital + d_subsidy),
                "financing_gap": float(max(Decimal("0.00"), d_project_cost - d_available_capital - d_subsidy)),
                "agency_margin_required": 0.0,
                "additional_agency_margin_needed": 0.0,
                "interest_rate_pa": 0.0,
                "repayment_frequency": "NONE",
                "total_periods": 0,
                "moratorium_periods": 0,
                "moratorium_months": 0,
                "moratorium_periodic_interest": 0.0,
                "active_repayment_periods": 0,
                "installment_amount": 0.0,
                "total_interest_payable": 0.0,
                "total_repayment_amount": 0.0,
                "working_capital_required": 0.0,
                "break_even_monthly_revenue": 0.0,
                "estimated_monthly_ebitda": 0.0,
                "average_dscr": 0.0,
                "is_dscr_viable": False,
                "statutory_disclaimer": "This application is an advisory and financial feasibility tool. Final eligibility, credit appraisal, margin requirements, sanction, and disbursement terms are exclusively determined by the authorized NSFDC Channelising Agency (SCA) or lending institution.",
                "schedule": []
            }

        scheme = eval_result["scheme"]
        scheme_id = scheme["scheme_id"]
        scheme_name = scheme["scheme_name"]
        limits = scheme["financial_limits"]

        # Step 2: Extract Scheme Limits
        max_loan_pct = Decimal(str(limits["max_loan_percentage"]))
        absolute_loan_cap = Decimal(str(limits["absolute_max_loan_inr"]))
        interest_rate_pa = Decimal(str(limits["beneficiary_interest_rate_pa"])) / Decimal("100.0")
        repayment_freq = limits["repayment_frequency"]
        total_periods = limits["total_periods"]
        moratorium_periods = limits["moratorium_periods"] if "moratorium_periods" in limits else limits.get("standard_moratorium_periods", 0)
        moratorium_months = limits.get("moratorium_months", limits.get("standard_moratorium_months", 0))
        active_periods = limits.get("active_repayment_periods", limits.get("standard_active_repayment_periods", total_periods - moratorium_periods))

        # Check activity-specific moratorium extension (Term loan for plantation/construction)
        if scheme_id == "NSFDC-TLS-01" and activity_type:
            act_lower = activity_type.strip().lower()
            if act_lower in ["plantation", "construction"]:
                act_cfg = limits.get("activity_specific_moratorium", {}).get(act_lower, {})
                moratorium_months = act_cfg.get("moratorium_months", 12)
                moratorium_periods = act_cfg.get("moratorium_periods", 12)
                active_periods = act_cfg.get("active_repayment_periods", 72)

        # Step 3: Statutory Loan Caps & Funding Gap Analysis
        # NSFDC Statutory max loan = min(Project Cost * 90%, Absolute Cap)
        max_loan_by_pct = (d_project_cost * (max_loan_pct / Decimal("100.0"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        scheme_max_loan = min(max_loan_by_pct, absolute_loan_cap)

        # Actual loan required = Project Cost - Available Capital - Verified Subsidy
        loan_required = max(Decimal("0.00"), d_project_cost - d_available_capital - d_subsidy)
        approved_loan = min(loan_required, scheme_max_loan)

        # Total secured funding and financing gap
        total_funding_secured = d_available_capital + approved_loan + d_subsidy
        financing_gap = max(Decimal("0.00"), d_project_cost - total_funding_secured)

        # Step 4: Optional Channel Agency Margin Requirement Analysis
        agency_margin_required = Decimal("0.00")
        additional_agency_margin_needed = Decimal("0.00")
        if channel_agency_margin_pct is not None:
            d_agency_margin_pct = Decimal(str(channel_agency_margin_pct))
            agency_margin_required = (d_project_cost * (d_agency_margin_pct / Decimal("100.0"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if d_available_capital < agency_margin_required:
                additional_agency_margin_needed = agency_margin_required - d_available_capital

        # Step 5: Installment & Amortization Math (Reducing Balance)
        if repayment_freq == "QUARTERLY":
            periodic_rate = interest_rate_pa / Decimal("4")
        else:
            periodic_rate = interest_rate_pa / Decimal("12")

        schedule: List[Dict[str, Any]] = []
        total_interest_payable = Decimal("0.00")
        installment_amount = Decimal("0.00")
        moratorium_periodic_interest = Decimal("0.00")

        if approved_loan > Decimal("0.00") and active_periods > 0:
            rate_float = float(periodic_rate)
            compound_factor = (1.0 + rate_float) ** active_periods
            installment_float = float(approved_loan) * (rate_float * compound_factor) / (compound_factor - 1.0)
            installment_amount = Decimal(str(installment_float)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            moratorium_interest_float = float(approved_loan) * rate_float
            moratorium_periodic_interest = Decimal(str(moratorium_interest_float)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            current_principal = approved_loan

            # Generate Moratorium Schedule
            for p in range(1, moratorium_periods + 1):
                int_charge = (current_principal * periodic_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                total_interest_payable += int_charge
                schedule.append({
                    "period_number": p,
                    "is_moratorium": True,
                    "opening_principal": float(current_principal),
                    "interest_charged": float(int_charge),
                    "principal_repaid": 0.0,
                    "total_installment": float(int_charge),
                    "closing_principal": float(current_principal)
                })

            # Generate Active Repayment Schedule
            for p in range(moratorium_periods + 1, total_periods + 1):
                int_charge = (current_principal * periodic_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                
                # Last period reconciliation to prevent floating round-off
                if p == total_periods:
                    pr_repaid = current_principal
                    actual_installment = pr_repaid + int_charge
                    closing_pr = Decimal("0.00")
                else:
                    pr_repaid = installment_amount - int_charge
                    if pr_repaid > current_principal:
                        pr_repaid = current_principal
                    actual_installment = pr_repaid + int_charge
                    closing_pr = current_principal - pr_repaid

                total_interest_payable += int_charge
                schedule.append({
                    "period_number": p,
                    "is_moratorium": False,
                    "opening_principal": float(current_principal),
                    "interest_charged": float(int_charge),
                    "principal_repaid": float(pr_repaid),
                    "total_installment": float(actual_installment),
                    "closing_principal": float(closing_pr)
                })
                current_principal = closing_pr

        total_repayment_amount = approved_loan + total_interest_payable

        # Step 6: Unit Economics, Break-Even & DSCR
        working_capital_required = (d_project_cost * Decimal("0.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        break_even_monthly_revenue = (installment_amount * Decimal("2.2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # DSCR calculation
        # Annual debt service
        if repayment_freq == "QUARTERLY":
            annual_debt_service = float(installment_amount * Decimal("4"))
        else:
            annual_debt_service = float(installment_amount * Decimal("12"))

        if estimated_monthly_ebitda is None:
            # Default benchmark EBITDA based on scale
            monthly_ebitda = float(d_project_cost * Decimal("0.18"))
        else:
            monthly_ebitda = estimated_monthly_ebitda

        annual_ebitda = monthly_ebitda * 12.0
        if annual_debt_service > 0:
            average_dscr = round(annual_ebitda / annual_debt_service, 2)
        else:
            average_dscr = 0.0

        is_dscr_viable = (average_dscr >= 1.5)

        return {
            "eligible": True,
            "selected_scheme_id": scheme_id,
            "selected_scheme_name": scheme_name,
            "reason_code": eval_result["reason_code"],
            "message": eval_result["message"],
            "project_cost": float(d_project_cost),
            "available_capital": float(d_available_capital),
            "verified_subsidy": float(d_subsidy),
            "maximum_loan_by_percentage": float(max_loan_by_pct),
            "absolute_loan_cap": float(absolute_loan_cap),
            "maximum_scheme_loan": float(scheme_max_loan),
            "loan_required": float(loan_required),
            "approved_loan": float(approved_loan),
            "total_funding_secured": float(total_funding_secured),
            "financing_gap": float(financing_gap),
            "agency_margin_required": float(agency_margin_required),
            "additional_agency_margin_needed": float(additional_agency_margin_needed),
            "interest_rate_pa": float(interest_rate_pa * Decimal("100.0")),
            "repayment_frequency": repayment_freq,
            "total_periods": total_periods,
            "moratorium_periods": moratorium_periods,
            "moratorium_months": moratorium_months,
            "moratorium_periodic_interest": float(moratorium_periodic_interest),
            "active_repayment_periods": active_periods,
            "installment_amount": float(installment_amount),
            "total_interest_payable": float(total_interest_payable),
            "total_repayment_amount": float(total_repayment_amount),
            "working_capital_required": float(working_capital_required),
            "break_even_monthly_revenue": float(break_even_monthly_revenue),
            "estimated_monthly_ebitda": float(monthly_ebitda),
            "average_dscr": average_dscr,
            "is_dscr_viable": is_dscr_viable,
            "statutory_disclaimer": "This application is an advisory and financial feasibility tool. Final eligibility, credit appraisal, margin requirements, sanction, and disbursement terms are exclusively determined by the authorized NSFDC Channelising Agency (SCA) or lending institution.",
            "schedule": schedule
        }

financial_engine = FinancialEngine()
