import os
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Check for Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class GeminiAdvisoryService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiAdvisoryService] Warning: Could not initialize google-genai client: {e}")

    def generate_swot_and_niche_advisory(
        self,
        archetype: Dict[str, Any],
        geo_context: Dict[str, Any],
        financial_plan: Dict[str, Any],
        eligibility: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates dynamic SWOT, competitor analysis, and risk mitigations.
        If Gemini is configured, it enhances the reasoning using structured prompting.
        Fallback heuristics guarantee high-quality deterministic SWOT if offline.
        """
        arch_name = archetype.get("name", "Rural Enterprise")
        category = archetype.get("category", "Micro Enterprise")
        location_desc = f"{geo_context.get('village_name', geo_context.get('block_name', 'Rural Catchment'))}, {geo_context.get('district_name', '')}"
        crops = ", ".join(geo_context.get("crops", ["Local agricultural produce"]))
        competitor_density = geo_context.get("competitor_density", {}).get(category, "Low to Medium")
        loan_amt = financial_plan.get("approved_loan", 0.0)
        scheme_name = financial_plan.get("selected_scheme_name", "NSFDC Scheme")
        gap = financial_plan.get("financing_gap", 0.0)

        # Base grounded SWOT components
        strengths = [
            f"Strong local demand in {location_desc} with direct access to regional raw materials ({crops}).",
            f"Favorable financing under {scheme_name} at concessional {financial_plan.get('interest_rate_pa', 6.5)}% interest rate with a {financial_plan.get('moratorium_months', 3)}-month moratorium.",
            f"Low initial operational overhead with estimated monthly EBITDA margin of approx 40-45% of gross revenues."
        ]

        weaknesses = [
            f"Working capital sensitivity during seasonal crop procurement peaks requiring strict cashflow discipline.",
            "Dependence on continuous single/three-phase rural power supply for machine uptime.",
        ]
        if gap > 0:
            weaknesses.append(f"Financing shortfall of Rs {gap:,.2f} requiring mobilization of additional promoter margin or equipment phase-in.")

        opportunities = [
            f"Underserved local demand radius of {archetype.get('market_catchment_km', 10)} km covering surrounding villages without modern processing facilities.",
            "Value addition potential: Brand packaging and direct retail supply to local weekly haats and village kirana stores.",
            "Opportunity to partner with local Self-Help Groups (SHGs) for raw material aggregation and distribution."
        ]

        threats = [
            "Commodity price volatility at district APMC mandis impacting raw material acquisition costs.",
            "Competition from established district-level packaged commercial brands if quality packaging is neglected.",
            "Unseasonal rains or crop yield variations in the catchment area."
        ]

        local_niche = f"Establish a specialized {arch_name} hub offering both custom job-work milling/services for local farmers and hygienic small-pack retail distribution in {location_desc}."
        
        mitigations = [
            "Maintain 30-45 days buffer inventory of essential raw materials purchased during peak harvest mandi arrivals.",
            "Install a voltage stabilizer / inverter backup to protect motors from rural power fluctuations.",
            "Diversify client base across 4-6 adjacent gram panchayats to mitigate localized demand drops."
        ]

        channel_steps = [
            "1. Obtain Caste Certificate (SC verification) and Income Certificate (<= Rs 5,00,000 p.a.) from local Tahsildar / Revenue Authority.",
            f"2. Visit the District State Channelising Agency (SCA) or nearest Regional Rural Bank (RRB) with this Detailed Project Report (DPR).",
            f"3. Submit formal loan application under {scheme_name} with machinery quotation, electricity proof, and applicant KYC.",
            "4. Track credit appraisal and SCA sanction order for prompt subsidy/concessional interest channelization."
        ]

        # If Gemini client is active, attempt AI enrichment
        if self.client:
            try:
                prompt = f"""
                You are a senior rural livelihood and MSME banking specialist in India.
                Review this verified project profile:
                - Business: {arch_name} ({category})
                - Location: {location_desc}
                - Primary catchment crops/economy: {crops}
                - Competitor density for category: {competitor_density}
                - Approved Loan: Rs {loan_amt:,.2f} under {scheme_name}
                - Financing gap: Rs {gap:,.2f}
                - Available Promoter Capital: Rs {financial_plan.get('available_capital', 0):,.2f}

                Enhance the SWOT, local niche opportunity, and risk mitigations with hyper-realistic Indian rural context.
                Output ONLY valid JSON with keys: 'strengths' (list of 3 strings), 'weaknesses' (list of 2-3 strings), 'opportunities' (list of 3 strings), 'threats' (list of 3 strings), 'local_niche_recommendation' (string), 'risk_mitigation_strategies' (list of 3 strings), 'channel_agency_next_steps' (list of 4 strings).
                Do not invent new interest rates or loan numbers.
                """
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config={"response_mime_type": "application/json"}
                )
                if response.text:
                    ai_data = json.loads(response.text)
                    return {
                        "strengths": ai_data.get("strengths", strengths),
                        "weaknesses": ai_data.get("weaknesses", weaknesses),
                        "opportunities": ai_data.get("opportunities", opportunities),
                        "threats": ai_data.get("threats", threats),
                        "local_niche_recommendation": ai_data.get("local_niche_recommendation", local_niche),
                        "risk_mitigation_strategies": ai_data.get("risk_mitigation_strategies", mitigations),
                        "channel_agency_next_steps": ai_data.get("channel_agency_next_steps", channel_steps)
                    }
            except Exception as e:
                print(f"[GeminiAdvisoryService] Gemini API call skipped/failed ({e}), using grounded template SWOT.")

        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats,
            "local_niche_recommendation": local_niche,
            "risk_mitigation_strategies": mitigations,
            "channel_agency_next_steps": channel_steps
        }

    def chat_advisory(
        self,
        language: str,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        feasibility_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Multilingual Indic conversational advisor.
        Supports Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, and English.
        """
        lang_names = {
            "hi": "Hindi (हिंदी)",
            "te": "Telugu (తెలుగు)",
            "ta": "Tamil (தமிழ்)",
            "mr": "Marathi (मराठी)",
            "bn": "Bengali (বাংলা)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "en": "English"
        }
        target_lang = lang_names.get(language, "Hindi (हिंदी)")

        # Prepare context summary
        context_str = "No active feasibility report in context."
        if feasibility_context:
            fin = feasibility_context.get("financial_plan", {})
            arch = feasibility_context.get("archetype_details", {})
            geo = feasibility_context.get("geo_context", {})
            context_str = f"""
            Active Business: {arch.get('name', 'Rural Micro-Enterprise')}
            Location: {geo.get('village_name', geo.get('block_name', ''))}, {geo.get('district_name', '')}
            Project Cost: Rs {fin.get('project_cost', 0):,.2f}
            Approved Loan: Rs {fin.get('approved_loan', 0):,.2f} under {fin.get('selected_scheme_name', 'NSFDC Scheme')}
            Interest Rate: {fin.get('interest_rate_pa', 6.5)}% p.a. ({fin.get('repayment_frequency', 'QUARTERLY')})
            Installment: Rs {fin.get('installment_amount', 0):,.2f}
            Financing Gap: Rs {fin.get('financing_gap', 0):,.2f}
            """

        system_instruction = f"""
        You are 'Gramin Udyog Mitra' (Rural Enterprise Advisor), an AI advisor for rural micro-entrepreneurs in India.
        Respond in clear, encouraging, respectful {target_lang}.
        Context:
        {context_str}
        
        Rules:
        - NEVER calculate or invent numbers; use ONLY the pre-calculated figures provided in the context.
        - For NSFDC schemes, emphasize that final sanction is subject to State Channelising Agency (SCA) or bank verification.
        - Keep answers structured, practical, and accessible for rural entrepreneurs.
        """

        if self.client:
            try:
                chat_prompt = f"{system_instruction}\n\nUser Question: {user_message}"
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=chat_prompt
                )
                if response.text:
                    return {
                        "reply_text": response.text,
                        "language": language,
                        "suggested_quick_questions": [
                            "How do I apply at the SCA office?",
                            "What documents are needed for SC certificate verification?",
                            "How does the moratorium period work?"
                        ],
                        "evidence_citations": [
                            "NSFDC Official Lending Policy (https://nsfdc.nic.in/en/faq)",
                            "State Channelising Agency (SCA) Operational Guidelines"
                        ]
                    }
            except Exception as e:
                print(f"[GeminiAdvisoryService] Gemini chat fallback: {e}")

        # Grounded multi-lingual fallback templates if Gemini is offline
        fallback_replies = {
            "hi": f"नमस्ते! आपके प्रोजेक्ट के लिए NSFDC की योजना के तहत {feasibility_context.get('financial_plan', {}).get('selected_scheme_name', 'योजना')} उपयुक्त है। आपकी अनुमोदित ऋण राशि रु {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} है जिसकी ब्याज दर {feasibility_context.get('financial_plan', {}).get('interest_rate_pa', 6.5)}% है। आवेदन करने के लिए अपने जिले की राज्य चैनलाइजिंग एजेंसी (SCA) या ग्रामीण बैंक में संपर्क करें।",
            "te": f"నమస్కారం! మీ ప్రాజెక్ట్ కోసం NSFDC {feasibility_context.get('financial_plan', {}).get('selected_scheme_name', 'స్కీమ్')} కింద రూ. {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} రుణం 6.5% వడ్డీతో అందుబాటులో ఉంది. దరఖాస్తు కోసం మీ జిల్లా స్టేట్ ఛానలైజింగ్ ఏజెన్సీ (SCA) లేదా ప్రాంతీయ గ్రామీణ బ్యాంకును సంప్రదించండి.",
            "ta": f"வணக்கம்! உங்கள் திட்டத்திற்கு NSFDC திட்டத்தின் கீழ் ரூ. {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} கடன் 6.5% வட்டியில் கிடைக்கும். விண்ணப்பிக்க மாவட்ட SCA அலுவலகம் அல்லது கிராம வங்கியை தொடர்பு கொள்ளவும்.",
            "mr": f"नमस्कार! आपल्या प्रकल्पासाठी NSFDC योजनेअंतर्गत रु. {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} चे कर्ज उपलब्ध आहे. अर्जासाठी जिल्हा चॅनेलाइजिंग एजन्सी (SCA) शी संपर्क साधा.",
            "bn": f"নমস্কার! আপনার প্রকল্পের জন্য NSFDC প্রকল্পের অধীনে {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} টাকার ঋণ উপলব্ধ। বিস্তারিত তথ্যের জন্য জেলা SCA অফিসে যোগাযোগ করুন।",
            "kn": f"ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಯೋಜನೆಗಾಗಿ NSFDC ಯೋಜನೆಯಡಿ ರೂ. {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.0f} ಸಾಲ ಲಭ್ಯವಿದೆ. ಜಿಲ್ಲಾ SCA ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            "en": f"Welcome! Based on your parameters, the {feasibility_context.get('financial_plan', {}).get('selected_scheme_name', 'NSFDC Scheme')} is suitable. Your approved loan amount is Rs {feasibility_context.get('financial_plan', {}).get('approved_loan', 0):,.2f} at {feasibility_context.get('financial_plan', {}).get('interest_rate_pa', 6.5)}% interest. Please submit this DPR to your State Channelising Agency (SCA) or local bank."
        }

        return {
            "reply_text": fallback_replies.get(language, fallback_replies["en"]),
            "language": language,
            "suggested_quick_questions": [
                "What are the required documents?",
                "How do I contact my local SCA?",
                "Can I get additional subsidy under state schemes?"
            ],
            "evidence_citations": [
                "NSFDC Operational FAQ (https://nsfdc.nic.in/en/faq)"
            ]
        }

gemini_advisory_service = GeminiAdvisoryService()
