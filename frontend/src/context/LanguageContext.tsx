import React, { createContext, useContext, useState } from 'react';

export type SupportedLanguage = 'hi' | 'te' | 'ta' | 'mr' | 'bn' | 'kn' | 'en';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isListening: boolean;
  startVoiceInput: (onTranscript: (text: string) => void) => void;
  stopVoiceInput: () => void;
  speakText: (text: string) => void;
}

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  hi: {
    app_title: 'ग्रामीण एज एआई (RuralEdge AI)',
    app_subtitle: 'ग्रामीण सूक्ष्म उद्यमियों के लिए राष्ट्रीय अनुसूचित जाति वित्त एवं विकास निगम (NSFDC) व्यावसायिक परामर्शदाता',
    step1_title: 'चरण 1: बुनियादी विवरण',
    step2_title: 'चरण 2: पात्रता एवं योजना चयन',
    select_location: 'कार्यस्थल / गांव चुनें',
    select_state: 'राज्य चुनें',
    select_district: 'जिला चुनें',
    select_block: 'ब्लॉक / मंडल चुनें',
    select_village: 'ग्राम पंचायत / गांव चुनें',
    select_archetype: 'व्यवसाय श्रेणी चुनें',
    available_margin: 'उपलब्ध पूंजी / मार्जिन मनी (₹)',
    custom_cost: 'परियोजना लागत (वैकल्पिक ₹)',
    social_category: 'सामाजिक श्रेणी',
    annual_income: 'वार्षिक पारिवारिक आय (₹)',
    gender: 'लिंग',
    prior_exp: 'क्या आपके पास संबंधित व्यवसाय का पूर्व अनुभव या प्रशिक्षण है?',
    evaluate_btn: 'व्यावसायिक व्यवहार्यता एवं ऋण विश्लेषण देखें',
    calculating: 'ऋण सीमाएं एवं व्यवहार्यता विश्लेषण जारी है...',
    feasibility_score: 'व्यवहार्यता स्कोर',
    approved_loan: 'स्वीकृत ऋण सीमा (NSFDC)',
    interest_rate: 'ब्याज दर',
    installment: 'नियमित किस्त',
    moratorium: 'मोराटोरियम अवधि',
    financing_gap: 'वित्तीय अंतर (Financing Gap)',
    swot_title: 'रणनीतिक विश्लेषण (SWOT) एवं स्थानीय मांग',
    evidence_title: 'डेटा प्रामाणिकता एवं कानूनी संदर्भ',
    voice_assistant: 'आवाज सहायक (Voice Advisor)',
    download_dpr: 'बैंक-प्रोजेक्ट रिपोर्ट (DPR PDF) डाउनलोड करें',
    view_schemes: 'NSFDC योजना नियमावली देखें',
    income_banner: 'NSFDC संशोधित आय सीमा: ₹5,00,000 प्रति वर्ष (प्रभावी 7 जनवरी 2026)',
    statutory_note: 'अस्वीकरण: यह एक परामर्श एवं वित्तीय व्यवहार्यता उपकरण है। अंतिम ऋण स्वीकृति राज्य चैनलाइजिंग एजेंसी (SCA) या बैंक द्वारा निर्धारित की जाती है।'
  },
  te: {
    app_title: 'రూరల్ ఎడ్జ్ AI (RuralEdge AI)',
    app_subtitle: 'గ్రామీణ సూక్ష్మ పారిశ్రామికవేత్తల కోసం NSFDC వ్యాపార మరియు ఆర్థిక సలహాదారు',
    step1_title: 'దశ 1: ప్రాథమిక వివరాలు',
    step2_title: 'దశ 2: అర్హత & పథకం ఎంపిక',
    select_location: 'గ్రామం / ప్రాంతం ఎంచుకోండి',
    select_state: 'రాష్ట్రం ఎంచుకోండి',
    select_district: 'జిల్లా ఎంచుకోండి',
    select_block: 'మండలం ఎంచుకోండి',
    select_village: 'గ్రామ పంచాయతీ / గ్రామం',
    select_archetype: 'వ్యాపార రకం ఎంచుకోండి',
    available_margin: 'మీ వద్ద ఉన్న స్వంత పెట్టుబడి (₹)',
    custom_cost: 'ప్రాజెక్ట్ వ్యయం (ఐచ్ఛికం ₹)',
    social_category: 'సామాజిక వర్గం',
    annual_income: 'వార్షిక కుటుంబ ఆదాయం (₹)',
    gender: 'లింగం',
    prior_exp: 'మీకు ఈ వ్యాపారంలో ముందస్తు అనుభవం లేదా శిక్షణ ఉందా?',
    evaluate_btn: 'వ్యాపార సాధ్యాసాధ్యాలు & లోన్ విశ్లేషణ చూడండి',
    calculating: 'రుణ అర్హత & ఆర్థిక ప్రణాళిక లెక్కించబడుతోంది...',
    feasibility_score: 'సాధ్యాసాధ్యాల స్కోరు',
    approved_loan: 'ఆమోదించబడిన గరిష్ట రుణం (NSFDC)',
    interest_rate: 'వడ్డీ రేటు',
    installment: 'నెలవారీ / త్రైమాసిక వాయిదా',
    moratorium: 'మొరటోరియం కాలం',
    financing_gap: 'మిగిలిన నిధుల లోటు (Financing Gap)',
    swot_title: 'వ్యూహాత్మక విశ్లేషణ (SWOT) & స్థానిక డిమాండ్',
    evidence_title: 'డేటా మూలాలు & అధికారిక నిబంధనలు',
    voice_assistant: 'వాయిస్ అసిస్టెంట్ (Voice Advisor)',
    download_dpr: 'బ్యాంక్ ప్రాజెక్ట్ రిపోర్ట్ (DPR PDF) డౌన్‌లోడ్ చేయండి',
    view_schemes: 'NSFDC పథకాల వివరాలు',
    income_banner: 'NSFDC నూతన ఆదాయ పరిమితి: ₹5,00,000 / సంవత్సరం (7 జనవరి 2026 నుండి అమల్లో ఉంది)',
    statutory_note: 'గమనిక: ఇది కేవలం ఆర్థిక ప్రణాళిక మరియు సలహా సాధనం. తుది రుణ మంజూరును రాష్ట్ర ఛానలైజింగ్ ఏజెన్సీ (SCA) లేదా బ్యాంక్ నిర్ణయిస్తుంది.'
  },
  ta: {
    app_title: 'ரூரல் எட்ஜ் AI (RuralEdge AI)',
    app_subtitle: 'கிராமப்புற குறுந்தொழில் முனைவோருக்கான NSFDC வணிக ஆலோசனை உதவியாளர்',
    step1_title: 'படி 1: அடிப்படை விவரங்கள்',
    step2_title: 'படி 2: தகுதி & திட்ட தேர்வு',
    select_location: 'இடத்தை தேர்வு செய்யவும்',
    select_state: 'மாநிலம்',
    select_district: 'மாவட்டம்',
    select_block: 'ஒன்றியம்',
    select_village: 'கிராமம்',
    select_archetype: 'தொழில் வகை',
    available_margin: 'இருப்பு நிதி / சுய மூலதனம் (₹)',
    custom_cost: 'திட்ட செலவு (விருப்பத்திற்குரியது ₹)',
    social_category: 'சமூக பிரிவு',
    annual_income: 'ஆண்டு குடும்ப வருமானம் (₹)',
    gender: 'பாலினம்',
    prior_exp: 'முன் அனுபவம் அல்லது பயிற்சி உள்ளதா?',
    evaluate_btn: 'வணிக சாத்தியக்கூறு மற்றும் கடன் மதிப்பீட்டை காண்க',
    calculating: 'கணக்கிடப்படுகிறது...',
    feasibility_score: 'சாத்தியக்கூறு மதிப்பெண்',
    approved_loan: 'அங்கீகரிக்கப்பட்ட கடன் வரம்பு',
    interest_rate: 'வட்டி விகிதம்',
    installment: 'தவணைத் தொகை',
    moratorium: 'மொரட்டோரியம் காலம்',
    financing_gap: 'நிதி பற்றாக்குறை',
    swot_title: 'SWOT பகுப்பாய்வு & சந்தை வாய்ப்புகள்',
    evidence_title: 'அரசு விதிகளின் ஆதாரம்',
    voice_assistant: 'குரல் உதவியாளர்',
    download_dpr: 'DPR திட்ட அறிக்கையை பதிவிறக்குக (PDF)',
    view_schemes: 'NSFDC திட்ட வழிகாட்டி',
    income_banner: 'NSFDC வருமான உச்சவரம்பு: ₹5,00,000 (7 ஜனவரி 2026 முதல்)',
    statutory_note: 'அறிவிப்பு: இறுதி கடன் அனுமதியை மாவட்ட SCA அல்லது வங்கி மட்டுமே தீர்மானிக்கும்.'
  },
  mr: {
    app_title: 'रूरल एज एआय (RuralEdge AI)',
    app_subtitle: 'ग्रामीण सूक्ष्म उद्योजकांसाठी NSFDC व्यवसाय आणि वित्तीय सल्लागार',
    step1_title: 'टप्पा १: प्राथमिक माहिती',
    step2_title: 'टप्पा २: पात्रता आणि योजना निवड',
    select_location: 'स्थान / गाव निवडा',
    select_state: 'राज्य निवडा',
    select_district: 'जिल्हा निवडा',
    select_block: 'तालुका निवडा',
    select_village: 'गाव निवडा',
    select_archetype: 'व्यवसाय प्रकार निवडा',
    available_margin: 'स्वतःचे भांडवल (₹)',
    custom_cost: 'प्रकल्प खर्च (ऐच्छिक ₹)',
    social_category: 'सामाजिक प्रवर्ग',
    annual_income: 'वार्षिक कौटुंबिक उत्पन्न (₹)',
    gender: 'लिंग',
    prior_exp: 'व्यवसायाचा पूर्वअनुभव किंवा प्रशिक्षण आहे का?',
    evaluate_btn: 'व्यवसाय व्यवहार्यता आणि कर्ज विश्लेषण पहा',
    calculating: 'कर्ज गणना सुरु आहे...',
    feasibility_score: 'व्यवहार्यता गुण',
    approved_loan: 'मंजूर कर्ज मर्यादा (NSFDC)',
    interest_rate: 'व्याज दर',
    installment: 'नियमित हप्ता',
    moratorium: 'सवलत कालावधी (Moratorium)',
    financing_gap: 'निधीतील तूट (Financing Gap)',
    swot_title: 'SWOT विश्लेषण आणि स्थानिक मागणी',
    evidence_title: 'डेटा स्रोत व कायदेशीर संदर्भ',
    voice_assistant: 'व्हॉइस सल्लागार',
    download_dpr: 'बँक प्रकल्प अहवाल (DPR PDF) डाउनलोड करा',
    view_schemes: 'NSFDC योजना नियमावली',
    income_banner: 'NSFDC सुधारित उत्पन्न मर्यादा: ₹५,००,००० प्रति वर्ष (७ जानेवारी २०२६ पासून लागू)',
    statutory_note: 'सूचना: अंतिम कर्ज मंजुरी राज्य चॅनेलाइजिंग एजन्सी (SCA) किंवा बँकेद्वारे केली जाते.'
  },
  bn: {
    app_title: 'রুরাল এজ এআই (RuralEdge AI)',
    app_subtitle: 'গ্রামীণ ক্ষুদ্র উদ্যোক্তাদের জন্য NSFDC ব্যবসায়িক উপদেষ্টা',
    step1_title: 'ধাপ ১: প্রাথমিক বিবরণ',
    step2_title: 'ধাপ ২: যোগ্যতা ও প্রকল্প নির্বাচন',
    select_location: 'স্থান / গ্রাম নির্বাচন করুন',
    select_state: 'রাজ্য',
    select_district: 'জেলা',
    select_block: 'ব্লক',
    select_village: 'গ্রাম',
    select_archetype: 'ব্যবসার ধরন',
    available_margin: 'উপলব্ধ নিজস্ব মূলধন (₹)',
    custom_cost: 'প্রকল্প ব্যয় (ঐচ্ছিক ₹)',
    social_category: 'সামাজিক শ্রেণী',
    annual_income: 'বার্ষিক পারিবারিক আয় (₹)',
    gender: 'লিঙ্গ',
    prior_exp: 'পূর্ব অভিজ্ঞতা বা প্রশিক্ষণ আছে কি?',
    evaluate_btn: 'ব্যবসায়িক সম্ভাব্যতা ও ঋণ বিশ্লেষণ দেখুন',
    calculating: 'হিসাব করা হচ্ছে...',
    feasibility_score: 'সম্ভাব্যতা স্কোর',
    approved_loan: 'অনুমোদিত সর্বোচ্চ ঋণ',
    interest_rate: 'সুদের হার',
    installment: 'নিয়মিত কিস্তি',
    moratorium: 'মোরাটোরিয়াম সময়কাল',
    financing_gap: 'তহবিলের ঘাটতি',
    swot_title: 'SWOT বিশ্লেষণ ও স্থানীয় চাহিদা',
    evidence_title: 'উপাত্তের নির্ভুলতা ও উৎস',
    voice_assistant: 'ভয়েস সহায়ক',
    download_dpr: 'ব্যাংক প্রকল্প রিপোর্ট (DPR PDF) ডাউনলোড করুন',
    view_schemes: 'NSFDC প্রকল্প নির্দেশিকা',
    income_banner: 'NSFDC বার্ষিক আয়ের সর্বোচ্চ সীমা: ₹৫,০০,০০০ (৭ জানুয়ারি ২০২৬ থেকে কার্যকর)',
    statutory_note: 'আইনি বিজ্ঞপ্তি: চূড়ান্ত ঋণ মঞ্জুরির সিদ্ধান্ত SCA বা ব্যাংক কর্তৃপক্ষ দ্বারা নির্ধারিত হয়।'
  },
  kn: {
    app_title: 'ರೂರಲ್ ಎಡ್ಜ್ AI (RuralEdge AI)',
    app_subtitle: 'ಗ್ರಾಮೀಣ ಸೂಕ್ಷ್ಮ ಉದ್ಯಮಿಗಳಿಗಾಗಿ NSFDC ವ್ಯಾಪಾರ ಮತ್ತು ಹಣಕಾಸು ಸಲಹೆಗಾರ',
    step1_title: 'ಹಂತ 1: ಪ್ರಾಥಮಿಕ ವಿವರಗಳು',
    step2_title: 'ಹಂತ 2: ಅರ್ಹತೆ ಮತ್ತು ಯೋಜನೆ ಆಯ್ಕೆ',
    select_location: 'ಗ್ರಾಮ / ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ',
    select_state: 'ರಾಜ್ಯ',
    select_district: 'ಜಿಲ್ಲೆ',
    select_block: 'ತಾಲೂಕು',
    select_village: 'ಗ್ರಾಮ',
    select_archetype: 'ವ್ಯಾಪಾರದ ಪ್ರಕಾರ',
    available_margin: 'ಲಭ್ಯವಿರುವ ಸ್ವಂತ ಬಂಡವಾಳ (₹)',
    custom_cost: 'ಯೋಜನಾ ವೆಚ್ಚ (ಐಚ್ಛಿಕ ₹)',
    social_category: 'ಸಾಮಾಜಿಕ ವರ್ಗ',
    annual_income: 'ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ (₹)',
    gender: 'ಲಿಂಗ',
    prior_exp: 'ಪೂರ್ವ ಅನುಭವ ಅಥವಾ ತರಬೇತಿ ಇದೆಯೇ?',
    evaluate_btn: 'ವ್ಯಾಪಾರ ಕಾರ್ಯಸಾಧ್ಯತೆ ಮತ್ತು ಸಾಲ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ',
    calculating: 'ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...',
    feasibility_score: 'ಕಾರ್ಯಸಾಧ್ಯತೆಯ ಅಂಕ',
    approved_loan: 'ಅನುಮೋದಿತ ಸಾಲದ ಮಿತಿ',
    interest_rate: 'ಬಡ್ಡಿ ದರ',
    installment: 'ಕಂತಿನ ಮೊತ್ತ',
    moratorium: 'ಮೊರಟೋರಿಯಂ ಅವಧಿ',
    financing_gap: 'ಹಣಕಾಸಿನ ಕೊರತೆ',
    swot_title: 'SWOT ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಸ್ಥಳೀಯ ಬೇಡಿಕೆ',
    evidence_title: 'ದೃಢೀಕೃತ ಮೂಲಗಳು',
    voice_assistant: 'ಧ್ವನಿ ಸಹಾಯಕ',
    download_dpr: 'DPR ಯೋಜನಾ ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (PDF)',
    view_schemes: 'NSFDC ಯೋಜನೆ ನಿಯಮಾವಳಿ',
    income_banner: 'NSFDC ಆದಾಯ ಮಿತಿ: ₹5,00,000 / ವರ್ಷ (7 ಜನವರಿ 2026 ರಿಂದ ಜಾರಿಯಲ್ಲಿದೆ)',
    statutory_note: 'ಗಮನಿಸಿ: ಅಂತಿಮ ಸಾಲ ಅನುಮೋದನೆಯನ್ನು ಜಿಲ್ಲಾ SCA ಅಥವಾ ಬ್ಯಾಂಕ್ ನಿರ್ಧರಿಸುತ್ತದೆ.'
  },
  en: {
    app_title: 'RuralEdge AI',
    app_subtitle: 'AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs',
    step1_title: 'Step 1: Location & Business Activity',
    step2_title: 'Step 2: Eligibility & Scheme Routing',
    select_location: 'Select Location & Catchment',
    select_state: 'State',
    select_district: 'District',
    select_block: 'Block / Tehsil',
    select_village: 'Gram Panchayat / Village',
    select_archetype: 'Business Category & Archetype',
    available_margin: 'Available Promoter Capital / Margin (₹)',
    custom_cost: 'Custom Project Cost (Optional ₹)',
    social_category: 'Social Category',
    annual_income: 'Annual Family Income (₹)',
    gender: 'Gender',
    prior_exp: 'Do you have prior training or experience in this enterprise activity?',
    evaluate_btn: 'Evaluate Feasibility & Structure Financing',
    calculating: 'Executing Deterministic Financial Amortization & NSFDC Routing...',
    feasibility_score: 'Feasibility Score',
    approved_loan: 'Approved NSFDC Loan Limit',
    interest_rate: 'Interest Rate',
    installment: 'Regular Installment',
    moratorium: 'Moratorium Period',
    financing_gap: 'Financing Shortfall (Gap)',
    swot_title: 'Strategic SWOT & Hyper-Local Catchment',
    evidence_title: 'Explainable Data Confidence & Lineage',
    voice_assistant: 'Voice Advisor',
    download_dpr: 'Download Bank-Ready DPR (PDF)',
    view_schemes: 'View Official NSFDC Schemes Catalog',
    income_banner: 'Official NSFDC Income Ceiling: ₹5,00,000 / annum (Effective 7 January 2026)',
    statutory_note: 'Statutory Notice: This is an advisory & financial structuring tool. Final credit appraisal and disbursement are exclusively determined by the authorized State Channelising Agency (SCA) or lending bank.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isListening, setIsListening] = useState<boolean>(false);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const startVoiceInput = (onTranscript: (text: string) => void) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your query.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      const langCodes: Record<SupportedLanguage, string> = {
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        kn: 'kn-IN',
        en: 'en-IN'
      };

      recognition.lang = langCodes[language] || 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) onTranscript(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCodes: Record<SupportedLanguage, string> = {
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        kn: 'kn-IN',
        en: 'en-IN'
      };
      utterance.lang = langCodes[language] || 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS error:', e);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isListening,
        startVoiceInput,
        stopVoiceInput,
        speakText
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
