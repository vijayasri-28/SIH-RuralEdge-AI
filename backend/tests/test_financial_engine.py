import pytest
from decimal import Decimal
from app.services.financial_engine import financial_engine

def test_tc01_standard_micro_finance():
    """
    TC-01:
    C = Rs 1,00,000, Available Capital = Rs 10,000, Income = Rs 2,50,000, Category = SC
    Expected:
    - Micro Finance Scheme (NSFDC-MFS-01)
    - Max Loan (90%) = Rs 90,000
    - Approved Loan = Rs 90,000
    - Financing Gap = Rs 0
    - Repayment: QUARTERLY, 11 active quarters
    - Quarterly Installment ~ Rs 9,000.97
    - Moratorium Q1 Interest = Rs 1,462.50
    """
    res = financial_engine.calculate(
        project_cost=100000.0,
        available_capital=10000.0,
        annual_family_income=250000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is True
    assert res["selected_scheme_id"] == "NSFDC-MFS-01"
    assert res["maximum_loan_by_percentage"] == 90000.0
    assert res["maximum_scheme_loan"] == 90000.0
    assert res["approved_loan"] == 90000.0
    assert res["total_funding_secured"] == 100000.0
    assert res["financing_gap"] == 0.0
    assert res["repayment_frequency"] == "QUARTERLY"
    assert res["total_periods"] == 12
    assert res["moratorium_periods"] == 1
    assert res["active_repayment_periods"] == 11
    assert res["moratorium_periodic_interest"] == 1462.50
    # Installment is approximately 9000.97
    assert abs(res["installment_amount"] - 9000.97) < 20.0
    assert len(res["schedule"]) == 12

def test_tc02_micro_finance_with_financing_gap():
    """
    TC-02:
    C = Rs 1,00,000, Available Capital = Rs 2,000, Income = Rs 3,00,000, Category = SC
    Expected:
    - Loan Required = Rs 98,000
    - Max Permitted = Rs 90,000
    - Approved Loan = Rs 90,000
    - Financing Gap = Rs 8,000
    """
    res = financial_engine.calculate(
        project_cost=100000.0,
        available_capital=2000.0,
        annual_family_income=300000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is True
    assert res["selected_scheme_id"] == "NSFDC-MFS-01"
    assert res["loan_required"] == 98000.0
    assert res["maximum_scheme_loan"] == 90000.0
    assert res["approved_loan"] == 90000.0
    assert res["total_funding_secured"] == 92000.0
    assert res["financing_gap"] == 8000.0

def test_tc03_micro_finance_absolute_loan_cap():
    """
    TC-03:
    C = Rs 1,40,000, Available Capital = Rs 15,000, Income = Rs 3,50,000, Category = SC
    Expected:
    - 90% of Project Cost = Rs 1,26,000
    - Absolute Cap = Rs 1,25,000
    - Approved Loan = Rs 1,25,000
    - Total Secured = Rs 1,40,000 (15k capital + 125k loan)
    - Financing Gap = Rs 0
    """
    res = financial_engine.calculate(
        project_cost=140000.0,
        available_capital=15000.0,
        annual_family_income=350000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is True
    assert res["selected_scheme_id"] == "NSFDC-MFS-01"
    assert res["maximum_loan_by_percentage"] == 126000.0
    assert res["absolute_loan_cap"] == 125000.0
    assert res["maximum_scheme_loan"] == 125000.0
    assert res["approved_loan"] == 125000.0
    assert res["total_funding_secured"] == 140000.0
    assert res["financing_gap"] == 0.0

def test_tc04_standard_term_loan():
    """
    TC-04:
    C = Rs 5,00,000, Available Capital = Rs 50,000, Income = Rs 4,00,000, Category = SC
    Expected:
    - Term Loan (NSFDC-TLS-01)
    - Max Loan (90%) = Rs 4,50,000
    - Approved Loan = Rs 4,50,000
    - Interest = 8.0% p.a.
    - Moratorium = 6 months (Rs 3,000/mo interest)
    - Active Periods = 78 months
    - Monthly Installment ~ Rs 7,417.43
    """
    res = financial_engine.calculate(
        project_cost=500000.0,
        available_capital=50000.0,
        annual_family_income=400000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is True
    assert res["selected_scheme_id"] == "NSFDC-TLS-01"
    assert res["maximum_loan_by_percentage"] == 450000.0
    assert res["approved_loan"] == 450000.0
    assert res["interest_rate_pa"] == 8.0
    assert res["repayment_frequency"] == "MONTHLY"
    assert res["total_periods"] == 84
    assert res["moratorium_periods"] == 6
    assert res["active_repayment_periods"] == 78
    assert res["moratorium_periodic_interest"] == 3000.0
    assert abs(res["installment_amount"] - 7417.43) < 10.0
    assert len(res["schedule"]) == 84

def test_tc05_exceeds_max_project_cost():
    """
    TC-05:
    C = Rs 55,00,000, Category = SC
    Expected:
    - eligible = False
    - reason_code = "EXCEEDS_MAX_PROJECT_COST"
    """
    res = financial_engine.calculate(
        project_cost=5500000.0,
        available_capital=1000000.0,
        annual_family_income=450000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is False
    assert res["reason_code"] == "EXCEEDS_MAX_PROJECT_COST"

def test_tc06_income_ceiling_exceeded():
    """
    TC-06:
    Income = Rs 5,50,000 (> Rs 5,00,000 limit)
    Expected:
    - eligible = False
    - reason_code = "INCOME_EXCEEDS_CEILING"
    """
    res = financial_engine.calculate(
        project_cost=200000.0,
        available_capital=20000.0,
        annual_family_income=550000.0,
        social_category="SC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is False
    assert res["reason_code"] == "INCOME_EXCEEDS_CEILING"

def test_non_sc_category_ineligible():
    """
    Non-SC applicants should be ineligible for NSFDC.
    """
    res = financial_engine.calculate(
        project_cost=100000.0,
        available_capital=10000.0,
        annual_family_income=250000.0,
        social_category="OBC",
        verified_subsidy=0.0
    )

    assert res["eligible"] is False
    assert res["reason_code"] == "NOT_SC_CATEGORY"

def test_plantation_extended_moratorium():
    """
    Plantation/construction activities support a 12-month moratorium in Term Loan.
    """
    res = financial_engine.calculate(
        project_cost=300000.0,
        available_capital=30000.0,
        annual_family_income=300000.0,
        social_category="SC",
        activity_type="plantation"
    )

    assert res["eligible"] is True
    assert res["moratorium_months"] == 12
    assert res["moratorium_periods"] == 12
    assert res["active_repayment_periods"] == 72
