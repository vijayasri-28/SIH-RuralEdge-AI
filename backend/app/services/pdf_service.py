import io
from datetime import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class PDFReportGenerator:
    def generate_dpr_pdf(self, report_data: Dict[str, Any]) -> io.BytesIO:
        """
        Generates a professional, bank-ready Detailed Project Report (DPR) PDF.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom typography styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F3D3E'),
            alignment=1, # Center
            spaceAfter=6
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#4A5568'),
            alignment=1, # Center
            spaceAfter=15
        )

        h2_style = ParagraphStyle(
            'H2Style',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0F3D3E'),
            spaceBefore=10,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#2D3748')
        )

        disclaimer_style = ParagraphStyle(
            'DisclaimerStyle',
            parent=styles['Italic'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#718096')
        )

        elements = []

        # Header Badge
        fin = report_data.get("financial_plan", {})
        onb = report_data.get("onboarding", {})
        arch = report_data.get("archetype_details", {})
        geo = report_data.get("geo_context", {})
        elig = report_data.get("eligibility", {})
        swot = report_data.get("swot_advisory", {})
        conf = report_data.get("data_confidence", {})

        elements.append(Paragraph("DETAILED PROJECT REPORT (DPR)", title_style))
        elements.append(Paragraph("Rural Micro-Enterprise Credit Appraisal & Feasibility Submission<br/>Channelized under NSFDC Concessional Credit Framework", subtitle_style))
        elements.append(Spacer(1, 8))

        # Project Snapshot Table
        elements.append(Paragraph("1. Executive Project Summary", h2_style))
        loc_str = f"{geo.get('village_name', geo.get('block_name', 'Rural Village'))}, Block: {geo.get('block_name', '')}, District: {geo.get('district_name', '')}"
        
        snapshot_data = [
            [Paragraph("<b>Enterprise Activity:</b>", body_style), Paragraph(arch.get("name", "Rural Enterprise"), body_style), Paragraph("<b>Target Sector:</b>", body_style), Paragraph(arch.get("category", "Micro-Enterprise"), body_style)],
            [Paragraph("<b>Proposed Location:</b>", body_style), Paragraph(loc_str, body_style), Paragraph("<b>Target Catchment:</b>", body_style), Paragraph(f"{arch.get('market_catchment_km', 10)} km radius", body_style)],
            [Paragraph("<b>Total Project Cost:</b>", body_style), Paragraph(f"₹ {fin.get('project_cost', 0):,.2f}", body_style), Paragraph("<b>Promoter Capital:</b>", body_style), Paragraph(f"₹ {fin.get('available_capital', 0):,.2f}", body_style)],
            [Paragraph("<b>Selected Scheme:</b>", body_style), Paragraph(fin.get("selected_scheme_name", "NSFDC Scheme"), body_style), Paragraph("<b>Interest Rate:</b>", body_style), Paragraph(f"{fin.get('interest_rate_pa', 6.5)}% p.a.", body_style)],
            [Paragraph("<b>Approved Loan Limit:</b>", body_style), Paragraph(f"₹ {fin.get('approved_loan', 0):,.2f}", body_style), Paragraph("<b>Financing Gap:</b>", body_style), Paragraph(f"₹ {fin.get('financing_gap', 0):,.2f}", body_style)],
            [Paragraph("<b>Repayment Tenure:</b>", body_style), Paragraph(f"{fin.get('total_periods', 12)} {fin.get('repayment_frequency', 'Periods')}", body_style), Paragraph("<b>Moratorium:</b>", body_style), Paragraph(f"{fin.get('moratorium_months', 3)} Months ({fin.get('moratorium_periods', 1)} Period)", body_style)],
            [Paragraph("<b>Regular Installment:</b>", body_style), Paragraph(f"₹ {fin.get('installment_amount', 0):,.2f} / {fin.get('repayment_frequency', 'Period').lower()}", body_style), Paragraph("<b>DSCR Viability:</b>", body_style), Paragraph(f"{fin.get('average_dscr', 1.8)} (Bank Viable >= 1.5)", body_style)]
        ]

        t_snap = Table(snapshot_data, colWidths=[1.3*inch, 2.2*inch, 1.4*inch, 2.3*inch])
        t_snap.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_snap)
        elements.append(Spacer(1, 10))

        # Capital Structure & Funding Table
        elements.append(Paragraph("2. Capital Outlay & Means of Finance", h2_style))
        capex = arch.get("capex_breakdown", {})
        capex_rows = [[Paragraph("<b>Component / Head</b>", body_style), Paragraph("<b>Amount (INR)</b>", body_style), Paragraph("<b>Source of Funding</b>", body_style)]]
        
        for k, v in capex.items():
            head_title = k.replace("_", " ").title()
            capex_rows.append([Paragraph(head_title, body_style), Paragraph(f"₹ {v:,.2f}", body_style), Paragraph("NSFDC Loan + Equity", body_style)])
        
        capex_rows.append([Paragraph("<b>Total Project Outlay</b>", body_style), Paragraph(f"<b>₹ {fin.get('project_cost', 0):,.2f}</b>", body_style), Paragraph("<b>100.0%</b>", body_style)])

        t_capex = Table(capex_rows, colWidths=[3.2*inch, 2.0*inch, 2.0*inch])
        t_capex.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E6FFFA')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_capex)
        elements.append(Spacer(1, 10))

        # Repayment & Amortization Preview
        elements.append(Paragraph("3. Repayment & Debt Servicing Schedule (First 6 Periods)", h2_style))
        sched = fin.get("schedule", [])[:6]
        sched_rows = [[
            Paragraph("<b>Period</b>", body_style),
            Paragraph("<b>Type</b>", body_style),
            Paragraph("<b>Opening (₹)</b>", body_style),
            Paragraph("<b>Interest (₹)</b>", body_style),
            Paragraph("<b>Principal (₹)</b>", body_style),
            Paragraph("<b>Installment (₹)</b>", body_style),
            Paragraph("<b>Closing (₹)</b>", body_style)
        ]]

        for row in sched:
            p_type = "Moratorium" if row.get("is_moratorium") else "Active EMI"
            sched_rows.append([
                Paragraph(str(row.get("period_number")), body_style),
                Paragraph(p_type, body_style),
                Paragraph(f"{row.get('opening_principal', 0):,.0f}", body_style),
                Paragraph(f"{row.get('interest_charged', 0):,.0f}", body_style),
                Paragraph(f"{row.get('principal_repaid', 0):,.0f}", body_style),
                Paragraph(f"{row.get('total_installment', 0):,.0f}", body_style),
                Paragraph(f"{row.get('closing_principal', 0):,.0f}", body_style)
            ])

        t_sched = Table(sched_rows, colWidths=[0.8*inch, 1.1*inch, 1.1*inch, 1.0*inch, 1.0*inch, 1.1*inch, 1.1*inch])
        t_sched.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EDF2F7')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
            ('PADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_sched)
        elements.append(Spacer(1, 10))

        # SWOT & Strategic Advisory
        elements.append(Paragraph("4. Strategic SWOT & Risk Mitigation", h2_style))
        swot_rows = [
            [Paragraph("<b>Key Strengths:</b>", body_style), Paragraph("<br/>• ".join([""] + swot.get("strengths", [])[:2]), body_style)],
            [Paragraph("<b>Key Opportunities:</b>", body_style), Paragraph("<br/>• ".join([""] + swot.get("opportunities", [])[:2]), body_style)],
            [Paragraph("<b>Risk Mitigations:</b>", body_style), Paragraph("<br/>• ".join([""] + swot.get("risk_mitigation_strategies", [])[:2]), body_style)],
            [Paragraph("<b>SCA Application Steps:</b>", body_style), Paragraph("<br/>".join(swot.get("channel_agency_next_steps", [])[:3]), body_style)]
        ]
        t_swot = Table(swot_rows, colWidths=[2.0*inch, 5.2*inch])
        t_swot.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_swot)
        elements.append(Spacer(1, 12))

        # Statutory Disclaimer
        elements.append(Paragraph("<b>Statutory Regulatory Notice:</b>", h2_style))
        elements.append(Paragraph(fin.get("statutory_disclaimer", ""), disclaimer_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"Report Generated on {datetime.now().strftime('%d-%b-%Y %H:%M')} | Data Confidence Score: {conf.get('composite_score_pct', 92)}% ({conf.get('qualitative_rating', 'HIGH')}) | Lineage: NSFDC Gazette 2026", disclaimer_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer

pdf_generator = PDFReportGenerator()
