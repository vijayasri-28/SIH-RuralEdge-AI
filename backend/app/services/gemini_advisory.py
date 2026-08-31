import os
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Check for Gemini API key (supports both GEMINI_API_KEY and GOOGLE_API_KEY)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

class GeminiAdvisoryService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.client = None
        self._init_client()

    def _init_client(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if self.api_key and not self.client:
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

        self._init_client()
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
        feasibility_context = feasibility_context or {}
        lang_names = {
            "hi": "Hindi (हिंदी)",
            "te": "Telugu (తెలుగు)",
            "ta": "Tamil (தமிழ்)",
            "mr": "Marathi (मराठी)",
            "bn": "Bengali (বাংলা)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "en": "English"
        }
        target_lang = lang_names.get(language, "English")

        # Extract context fields safely whether from evaluation report or live wizard state
        onb = feasibility_context.get("onboarding") or {}
        loc = onb.get("location") or feasibility_context.get("location") or {}
        geo = feasibility_context.get("geo_context") or {}
        arch = feasibility_context.get("archetype_details") or feasibility_context.get("selected_archetype") or {}
        fin = feasibility_context.get("financial_plan") or {}
        elig = feasibility_context.get("eligibility") or {}

        # Resolve location names
        village_name = loc.get("village_name") or geo.get("village_name") or ""
        block_name = loc.get("block_name") or geo.get("block_name") or ""
        district_name = loc.get("district_name") or geo.get("district_name") or ""
        state_name = loc.get("state_name") or geo.get("state_name") or ""

        loc_parts = [p for p in [village_name, block_name, district_name, state_name] if p]
        location_str = ", ".join(loc_parts) if loc_parts else "your rural catchment"

        arch_name = arch.get("name") or onb.get("business_archetype_id", "Rural Micro-Enterprise")
        category = arch.get("category", "Micro-Enterprise")

        # Financial numbers
        project_cost = fin.get("project_cost") or arch.get("benchmark_project_cost") or onb.get("custom_project_cost") or 100000.0
        approved_loan = fin.get("approved_loan") or (project_cost * 0.9 if project_cost else 90000.0)
        scheme_name = fin.get("selected_scheme_name") or ("NSFDC Micro Credit Scheme" if project_cost <= 150000 else "NSFDC Term Loan Scheme")
        interest_rate = fin.get("interest_rate_pa", 6.5)
        installment = fin.get("installment_amount", 0.0)
        moratorium_months = fin.get("moratorium_months", 3)
        social_category = elig.get("social_category", "SC")
        annual_income = elig.get("annual_family_income_inr", 240000)

        context_summary = f"""
        Location: {location_str}
        Selected Business: {arch_name} ({category})
        Project Cost: Rs {project_cost:,.2f}
        Approved NSFDC Loan: Rs {approved_loan:,.2f}
        Eligible Scheme: {scheme_name}
        Interest Rate: {interest_rate}% p.a.
        Installment: Rs {installment:,.2f}
        Moratorium: {moratorium_months} months
        Social Category: {social_category}
        Annual Family Income: Rs {annual_income:,.2f} (Ceiling <= Rs 5,00,000 p.a.)
        """

        self._init_client()
        if self.client:
            try:
                system_prompt = f"""
                You are 'Gramin Udyog Mitra' (Rural Enterprise Advisor), an expert AI advisor for rural Indian entrepreneurs under the National Scheduled Castes Finance and Development Corporation (NSFDC).

                IMPORTANT INSTRUCTIONS:
                1. You MUST respond entirely in {target_lang}.
                2. Explicitly incorporate the user's specific context:
                   - Location: {location_str}
                   - Business Activity: {arch_name}
                   - Scheme: {scheme_name} (Approved Loan: Rs {approved_loan:,.0f} @ {interest_rate}%)
                3. Address the user's question directly, courteously, and practically.
                4. Never invent conflicting financial figures; use the pre-calculated numbers provided.
                5. Remind the user that final loan sanction occurs through the District State Channelising Agency (SCA) or local bank.

                Context:
                {context_summary}

                User Message: {user_message}
                """
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=system_prompt
                )
                if response.text:
                    return {
                        "reply_text": response.text.strip(),
                        "language": language,
                        "suggested_quick_questions": self._get_suggested_questions(language),
                        "evidence_citations": [
                            "NSFDC Official Lending Guidelines 2026 (https://nsfdc.nic.in/en/faq)",
                            f"State Channelising Agency (SCA) Guidelines for {state_name or 'State'}"
                        ]
                    }
            except Exception as e:
                print(f"[GeminiAdvisoryService] Gemini live chat fallback: {e}")

        # Intelligent Multilingual Grounded Fallback Engine
        reply_text = self._build_dynamic_grounded_fallback(
            language=language,
            user_message=user_message,
            arch_name=arch_name,
            category=category,
            location_str=location_str,
            district_name=district_name,
            state_name=state_name,
            scheme_name=scheme_name,
            approved_loan=approved_loan,
            project_cost=project_cost,
            interest_rate=interest_rate,
            installment=installment,
            moratorium_months=moratorium_months,
            social_category=social_category
        )

        return {
            "reply_text": reply_text,
            "language": language,
            "suggested_quick_questions": self._get_suggested_questions(language),
            "evidence_citations": [
                "NSFDC Official Lending Guidelines (https://nsfdc.nic.in/en/faq)",
                f"State Channelising Agency (SCA) - {state_name or 'District'} Livelihood Cell"
            ]
        }

    def _get_suggested_questions(self, language: str) -> List[str]:
        questions_by_lang = {
            "te": [
                "దరఖాస్తుకు ఏయే సర్టిఫికెట్లు అవసరం?",
                "జిల్లా SCA కార్యాలయం ఎక్కడ ఉంది?",
                "మొరటోరియం వడ్డీ ఎలా లెక్కిస్తారు?"
            ],
            "hi": [
                "आवेदन के लिए कौन से दस्तावेज आवश्यक हैं?",
                "जिला SCA कार्यालय में कैसे संपर्क करें?",
                "मोराटोरियम अवधि का क्या लाभ है?"
            ],
            "ta": [
                "விண்ணப்பிக்க தேவையான ஆவணங்கள் யாவை?",
                "மாவட்ட SCA அலுவலகத்தை எவ்வாறு தொடர்புகொள்வது?",
                "மொரட்டோரியம் காலம் எவ்வாறு செயல்படுகிறது?"
            ],
            "mr": [
                "अर्जासाठी कोणती कागदपत्रे लागतात?",
                "जिल्हा SCA कार्यालयाशी कसा संपर्क साधावा?",
                "सवलत कालावधी (Moratorium) कसा मिळतो?"
            ],
            "bn": [
                "আবেদনের জন্য কী কী নথিপত্র প্রয়োজন?",
                "জেলা SCA অফিসে কীভাবে যোগাযোগ করবেন?",
                "মোরাটোরিয়াম সুবিধা কীভাবে পাওয়া যায়?"
            ],
            "kn": [
                "ಅರ್ಜಿಗೆ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು ಯಾವುವು?",
                "ಜಿಲ್ಲಾ SCA ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸುವುದು ಹೇಗೆ?",
                "ಮೊರಟೋರಿಯಂ ಅವಧಿ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?"
            ],
            "en": [
                "What documents are needed for SC certificate verification?",
                "How do I contact my local State Channelising Agency (SCA)?",
                "How is the moratorium interest calculated?"
            ]
        }
        return questions_by_lang.get(language, questions_by_lang["en"])

    def _build_dynamic_grounded_fallback(
        self,
        language: str,
        user_message: str,
        arch_name: str,
        category: str,
        location_str: str,
        district_name: str,
        state_name: str,
        scheme_name: str,
        approved_loan: float,
        project_cost: float,
        interest_rate: float,
        installment: float,
        moratorium_months: int,
        social_category: str
    ) -> str:
        """
        Generates context-aware, hyper-local Indic responses matching user query intent.
        """
        msg_lower = user_message.lower()
        loan_formatted = f"{approved_loan:,.0f}"
        cost_formatted = f"{project_cost:,.0f}"
        inst_formatted = f"{installment:,.0f}" if installment > 0 else "నిర్ణయించబడుతుంది"

        is_docs_query = any(k in msg_lower for k in ["doc", "certificate", "caste", "income", "paper", "పత్రాలు", "సర్టిఫికేట్", "దస్తావేజు", "दस्तावेज", "प्रमाणपत्र", "कागदपत्रे", "ஆவணங்கள்", "ದಾಖಲೆ"])
        is_sca_query = any(k in msg_lower for k in ["sca", "apply", "office", "bank", "branch", "contact", "దరఖాస్తు", "ఆఫీస్", "బ్యాంక్", "आवेदन", "कार्यालय", "தொடர்பு", "ಸಂಪರ್ಕ"])
        is_finance_query = any(k in msg_lower for k in ["interest", "moratorium", "rate", "emi", "installment", "loan", "వడ్డీ", "వాయిదా", "రుణం", "ब्याज", "किस्त", "कर्ज", "வட்டி", "ಬಡ್ಡಿ"])
        is_business_query = any(k in msg_lower for k in ["pottery", "chilly", "spice", "mill", "oil", "dairy", "solar", "store", "market", "demand", "వ్యాపార", "మార్కెట్", "उद्योग", "व्यवसाय", "தொழில்"])

        if language == "te":
            if is_docs_query:
                return (
                    f"నమస్కారం! {location_str} పరిధిలో {arch_name} ప్రాజెక్ట్ కోసం NSFDC రుణ దరఖాస్తుకు ఈ క్రింది ధ్రువపత్రాలు అవసరం:\n"
                    f"1. కుల ధ్రువీకరణ పత్రం ({social_category} సర్టిఫికేట్ - తహశీల్దార్ జారీ చేసినది)\n"
                    f"2. వార్షిక కుటుంబ ఆదాయ ధ్రువీకరణ పత్రం (వార్షిక ఆదాయం రూ. 5,00,000 లోపు ఉండాలి)\n"
                    f"3. ఆధార్ కార్డు మరియు నివాస ధ్రువీకరణ పత్రం\n"
                    f"4. బ్యాంక్ పాస్‌బుక్ మరియు {arch_name} యంత్రాల కొటేషన్ లేదా DPR ప్రాజెక్ట్ రిపోర్ట్."
                )
            elif is_sca_query:
                return (
                    f"నమస్కారం! {location_str} ప్రాంతంలో మీ {arch_name} యూనిట్ కొరకు NSFDC రుణం పొందడానికి, "
                    f"మీ జిల్లా కేంద్రంలోని స్టేట్ ఛానలైజింగ్ ఏజెన్సీ (SCA / SC కార్పొరేషన్) లేదా సమీప ప్రాంతీయ గ్రామీణ బ్యాంక్ (RRB) ని సంప్రదించండి. "
                    f"ఈ పోర్టల్ నుండి డౌన్‌లోడ్ చేసిన బ్యాంక్ ప్రాజెక్ట్ రిపోర్ట్ (DPR PDF) సమర్పించి {scheme_name} కింద దరఖాస్తు చేసుకోవచ్చు."
                )
            elif is_business_query:
                return (
                    f"{location_str} ప్రాంతంలో {arch_name} ({category}) ఏర్పాటు చేయడం చాలా ప్రయోజనకరమైనది. "
                    f"మొత్తం ప్రాజెక్ట్ వ్యయం దాదాపు రూ. {cost_formatted} కాగా, NSFDC {scheme_name} కింద గరిష్టంగా 90% (రూ. {loan_formatted}) రాయితీ వడ్డీతో ({interest_rate}% p.a.) రుణం లభిస్తుంది. "
                    f"స్థానిక మార్కెట్ మరియు గ్రామాల అవసరాలను తీర్చడం ద్వారా స్థిరమైన లాభాలు పొందవచ్చు."
                )
            else:
                return (
                    f"నమస్కారం! {location_str} లో మీ {arch_name} ప్రాజెక్ట్ కోసం NSFDC {scheme_name} అత్యంత అనుకూలమైనది. "
                    f"దీని కింద రూ. {loan_formatted} వరకు రాయితీ రుణం {interest_rate}% వార్షిక వడ్డీ రేటుతో లభిస్తుంది. "
                    f"{moratorium_months} నెలల మొరటోరియం కాలం తర్వాత క్రమబద్ధ వాయిదాలు చెల్లించవచ్చు. "
                    f"దరఖాస్తు ప్రక్రియ కోసం మీ జిల్లా SCA కార్యాలయాన్ని సంప్రదించండి."
                )

        elif language == "hi":
            if is_docs_query:
                return (
                    f"नमस्ते! {location_str} में {arch_name} उद्यम के लिए NSFDC ऋण आवेदन हेतु मुख्य दस्तावेज:\n"
                    f"1. जाति प्रमाण पत्र ({social_category} सत्यापन - तहसीलदार द्वारा जारी)\n"
                    f"2. आय प्रमाण पत्र (पारिवारिक आय ₹5,00,000 प्रति वर्ष से कम)\n"
                    f"3. आधार कार्ड, निवास प्रमाण पत्र व बैंक पासबुक\n"
                    f"4. {arch_name} मशीनरी कोटेशन व यह विस्तृत प्रोजेक्ट रिपोर्ट (DPR)."
                )
            elif is_sca_query:
                return (
                    f"नमस्ते! {location_str} में {arch_name} के लिए NSFDC ऋण प्राप्त करने हेतु अपने जिला मुख्यालय स्थित राज्य चैनलाइजिंग एजेंसी (SCA / SC निगम) या नजदीकी ग्रामीण बैंक से संपर्क करें। "
                    f"वहां इस DPR रिपोर्ट के साथ {scheme_name} के अंतर्गत औपचारिक आवेदन जमा करें।"
                )
            elif is_business_query:
                return (
                    f"{location_str} में {arch_name} ({category}) की स्थापना अत्यंत लाभकारी अवसर है। "
                    f"परियोजना लागत लगभग ₹{cost_formatted} है, जिसमें NSFDC {scheme_name} के तहत ₹{loan_formatted} तक का रियायती ऋण {interest_rate}% ब्याज दर पर उपलब्ध है।"
                )
            else:
                return (
                    f"नमस्ते! {location_str} में आपके {arch_name} प्रोजेक्ट के लिए NSFDC {scheme_name} अनुमोदित है। "
                    f"आपकी स्वीकृत ऋण सीमा ₹{loan_formatted} है जिसकी ब्याज दर {interest_rate}% प्रति वर्ष है। "
                    f"{moratorium_months} माह की मोराटोरियम अवधि के बाद नियमित किस्तें देय होंगी।"
                )

        elif language == "ta":
            return (
                f"வணக்கம்! {location_str} பகுதியில் உள்ள உங்கள் {arch_name} திட்டத்திற்கு NSFDC {scheme_name} மூலம் "
                f"ரூ. {loan_formatted} வரை {interest_rate}% சலுகை வட்டியில் கடன் பெறலாம். "
                f"விண்ணப்பிக்க மாவட்ட SCA அலுவலகம் அல்லது கிராம வங்கியை தொடர்பு கொள்ளவும்."
            )

        elif language == "mr":
            return (
                f"नमस्कार! {location_str} येथील आपल्या {arch_name} व्यवसायासाठी NSFDC {scheme_name} अंतर्गत "
                f"रु. {loan_formatted} चे सवलतीचे कर्ज {interest_rate}% व्याजदराने उपलब्ध आहे. "
                f"अर्जासाठी जिल्हा राज्य चॅनेलाइजिंग एजन्सी (SCA) किंवा ग्रामीण बँकेशी संपर्क साधा."
            )

        elif language == "bn":
            return (
                f"নমস্কার! {location_str} অঞ্চলে আপনার {arch_name} প্রকল্পের জন্য NSFDC {scheme_name} অধীনে "
                f"সর্বোচ্চ ₹{loan_formatted} টাকা {interest_rate}% সুদের হারে ঋণ অনুমোদিত হতে পারে। "
                f"আবেদনের জন্য জেলা SCA কার্যালয়ে যোগাযোগ করুন।"
            )

        elif language == "kn":
            return (
                f"ನಮಸ್ಕಾರ! {location_str} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ನಿಮ್ಮ {arch_name} ಯೋಜನೆಗಾಗಿ NSFDC {scheme_name} ಅಡಿಯಲ್ಲಿ "
                f"ರೂ. {loan_formatted} ಸಾಲವು {interest_rate}% ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರದಲ್ಲಿ ಲಭ್ಯವಿದೆ. "
                f"ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಜಿಲ್ಲಾ SCA ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
            )

        else:  # en (English default)
            if is_docs_query:
                return (
                    f"Hello! For setting up a {arch_name} in {location_str} under NSFDC schemes, the required documents are:\n"
                    f"1. SC Caste Certificate issued by competent revenue authority (Tahsildar)\n"
                    f"2. Income Certificate confirming annual family income is within ₹5,00,000 / year\n"
                    f"3. KYC Documents: Aadhaar card, residence proof, and bank passbook\n"
                    f"4. Equipment / Machinery quotation and this Detailed Project Report (DPR)."
                )
            elif is_sca_query:
                return (
                    f"Hello! To apply for {scheme_name} for your {arch_name} in {location_str}, "
                    f"please visit your District State Channelising Agency (SCA) office or nearest Regional Rural Bank (RRB). "
                    f"Submit your DPR along with standard KYC to initiate credit appraisal."
                )
            elif is_business_query:
                return (
                    f"Establishing a {arch_name} ({category}) in {location_str} is highly viable. "
                    f"With a benchmark project cost of ₹{cost_formatted}, NSFDC {scheme_name} can fund up to ₹{loan_formatted} (90%) "
                    f"at a concessional interest rate of {interest_rate}% p.a. with a {moratorium_months}-month moratorium."
                )
            else:
                return (
                    f"Hello! For your {arch_name} project in {location_str}, the {scheme_name} is recommended. "
                    f"Your eligible loan limit is ₹{loan_formatted} at a concessional interest rate of {interest_rate}% p.a. "
                    f"Regular installment servicing begins after a {moratorium_months}-month moratorium period."
                )

gemini_advisory_service = GeminiAdvisoryService()
