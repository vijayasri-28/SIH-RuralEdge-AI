import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchVillages,
  fetchArchetypes,
  calculateDeterministicFinancialPlan
} from '../services/api';
import type {
  BusinessArchetype,
  MinimalOnboardingInput,
  EligibilityProfile,
  DeterministicFinancialPlan
} from '../types';
import {
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OnboardingWizardProps {
  onEvaluationComplete: (data: {
    onboarding: MinimalOnboardingInput;
    eligibility: EligibilityProfile;
  }) => void;
  isLoading: boolean;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onEvaluationComplete, isLoading }) => {
  const { t } = useLanguage();

  // Wizard Step (1: Minimal Location & Business Activity, 2: Targeted Eligibility)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Geo state
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState<number>(36); // Default Telangana
  const [selectedDistrict, setSelectedDistrict] = useState<number>(505); // Default Mahabubnagar
  const [selectedBlock, setSelectedBlock] = useState<number>(4310); // Default Kondurg
  const [selectedVillage, setSelectedVillage] = useState<number | undefined>(574890); // Default Kondurg

  // Archetypes state
  const [archetypes, setArchetypes] = useState<BusinessArchetype[]>([]);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('mini_flour_dal_mill');
  
  // Financial inputs
  const [availableCapital, setAvailableCapital] = useState<number>(20000);
  const [customCost, setCustomCost] = useState<string>('');
  const [activityType, setActivityType] = useState<string>('standard');

  // Eligibility inputs
  const [socialCategory, setSocialCategory] = useState<'SC' | 'SafaiKaramchari' | 'ST' | 'OBC' | 'General'>('SC');
  const [annualIncome, setAnnualIncome] = useState<number>(240000);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Transgender'>('Female');
  const [hasExperience, setHasExperience] = useState<boolean>(true);
  const [channelMarginPct, setChannelMarginPct] = useState<string>('');

  // Live Quick Preview state
  const [quickPlan, setQuickPlan] = useState<DeterministicFinancialPlan | null>(null);

  // Load initial data
  useEffect(() => {
    fetchStates().then((res) => setStates(res.states || [])).catch(console.error);
    fetchArchetypes().then((res) => {
      setArchetypes(res.archetypes || []);
      if (res.archetypes?.length > 0) {
        setSelectedArchetypeId(res.archetypes[0].archetype_id);
      }
    }).catch(console.error);
  }, []);

  // Update cascading geo
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState).then((res) => {
        setDistricts(res.districts || []);
        if (res.districts?.length > 0) {
          const firstDist = res.districts[0].district_code;
          setSelectedDistrict(firstDist);
        }
      }).catch(console.error);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedDistrict) {
      fetchBlocks(selectedState, selectedDistrict).then((res) => {
        setBlocks(res.blocks || []);
        if (res.blocks?.length > 0) {
          const firstBlock = res.blocks[0].block_code;
          setSelectedBlock(firstBlock);
        }
      }).catch(console.error);
    }
  }, [selectedState, selectedDistrict]);

  useEffect(() => {
    if (selectedState && selectedDistrict && selectedBlock) {
      fetchVillages(selectedState, selectedDistrict, selectedBlock).then((res) => {
        setVillages(res.villages || []);
        if (res.villages?.length > 0) {
          setSelectedVillage(res.villages[0].village_code);
        } else {
          setSelectedVillage(undefined);
        }
      }).catch(console.error);
    }
  }, [selectedState, selectedDistrict, selectedBlock]);

  // Selected archetype object
  const selectedArchetype = archetypes.find((a) => a.archetype_id === selectedArchetypeId);
  const effectiveProjectCost = customCost && parseFloat(customCost) > 0 ? parseFloat(customCost) : (selectedArchetype?.benchmark_project_cost || 100000);

  // Recalculate quick preview deterministically
  useEffect(() => {
    calculateDeterministicFinancialPlan({
      project_cost: effectiveProjectCost,
      available_capital: availableCapital,
      annual_family_income: annualIncome,
      social_category: socialCategory,
      verified_subsidy: 0.0,
      activity_type: activityType,
      channel_agency_margin_pct: channelMarginPct ? parseFloat(channelMarginPct) : undefined
    }).then(setQuickPlan).catch(console.error);
  }, [effectiveProjectCost, availableCapital, annualIncome, socialCategory, activityType, channelMarginPct]);

  // Demo Scenario Presets for Hackathon Jury Presentation
  const applyPreset = (preset: 'anita' | 'ramesh' | 'shravan') => {
    if (preset === 'anita') {
      // Anita Devi - SC Woman Entrepreneur in Telangana (Chilly/Spice Grinding)
      setSelectedState(36); // Telangana
      setSelectedDistrict(505); // Mahabubnagar
      setSelectedBlock(4310); // Kondurg
      setSelectedVillage(574890); // Kondurg
      setSelectedArchetypeId('spice_chilly_grinding');
      setAvailableCapital(15000);
      setCustomCost('95000');
      setSocialCategory('SC');
      setAnnualIncome(220000);
      setGender('Female');
      setHasExperience(true);
      setActivityType('standard');
    } else if (preset === 'ramesh') {
      // Ramesh - SC Potter in Varanasi (Terracotta Modernization)
      setSelectedState(9); // Uttar Pradesh
      setSelectedDistrict(178); // Varanasi
      setSelectedBlock(1420); // Cholapur
      setSelectedVillage(208400); // Babatpur
      setSelectedArchetypeId('pottery_terracotta_crafts');
      setAvailableCapital(10000);
      setCustomCost('85000');
      setSocialCategory('SC');
      setAnnualIncome(180000);
      setGender('Male');
      setHasExperience(true);
      setActivityType('standard');
    } else if (preset === 'shravan') {
      // Shravan - Commercial Oil Mill (Term Loan)
      setSelectedState(27); // Maharashtra
      setSelectedDistrict(515); // Aurangabad
      setSelectedBlock(4510); // Paithan
      setSelectedVillage(554300); // Bidle
      setSelectedArchetypeId('cold_pressed_oil_expeller');
      setAvailableCapital(60000);
      setCustomCost('450000');
      setSocialCategory('SC');
      setAnnualIncome(340000);
      setGender('Male');
      setHasExperience(true);
      setActivityType('standard');
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    
    const stateObj = states.find((s) => s.state_code === selectedState);
    const distObj = districts.find((d) => d.district_code === selectedDistrict);
    const blockObj = blocks.find((b) => b.block_code === selectedBlock);
    const villageObj = villages.find((v) => v.village_code === selectedVillage);

    const onboardingPayload: MinimalOnboardingInput = {
      location: {
        state_code: selectedState,
        state_name: stateObj?.state_name || 'Telangana',
        district_code: selectedDistrict,
        district_name: distObj?.district_name || 'Mahabubnagar',
        block_code: selectedBlock,
        block_name: blockObj?.block_name || 'Kondurg',
        village_code: selectedVillage,
        village_name: villageObj?.village_name || undefined,
        fallback_level_applied: villageObj ? 'VILLAGE' : 'BLOCK'
      },
      business_archetype_id: selectedArchetypeId,
      available_margin_capital: availableCapital,
      custom_project_cost: customCost ? parseFloat(customCost) : undefined,
      activity_type: activityType
    };

    const eligibilityPayload: EligibilityProfile = {
      social_category: socialCategory,
      annual_family_income_inr: annualIncome,
      gender: gender,
      has_prior_experience_or_training: hasExperience,
      channel_agency_margin_pct: channelMarginPct ? parseFloat(channelMarginPct) : undefined
    };

    onEvaluationComplete({
      onboarding: onboardingPayload,
      eligibility: eligibilityPayload
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
      {/* Demo Persona Quick Switcher */}
      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Quick Demo Personas:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('anita')}
            className="text-xs bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Anita (Chilly Mill, ₹95k, Telangana)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ramesh')}
            className="text-xs bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-medium px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Ramesh (Pottery Unit, ₹85k, UP)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('shravan')}
            className="text-xs bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 font-medium px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Shravan (Term Loan Oil Expeller, ₹4.5L, MH)
          </button>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep === 1 ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('step1_title')}</h2>
            <p className="text-xs text-slate-500">Location, Business Category & Margin Capital</p>
          </div>
        </div>

        <div className="h-0.5 w-12 bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep === 2 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('step2_title')}</h2>
            <p className="text-xs text-slate-500">NSFDC Eligibility & Concessional Rules</p>
          </div>
        </div>
      </div>

      {/* Step 1 Form: Minimal Onboarding */}
      {currentStep === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-6">
          {/* Section A: Cascading Geographic Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{t('select_location')} (Local Government Directory - LGD Hierarchy)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_state')}</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {states.map((s) => (
                    <option key={s.state_code} value={s.state_code}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_district')}</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {districts.map((d) => (
                    <option key={d.district_code} value={d.district_code}>
                      {d.district_name} ({d.sc_population_percentage}% SC)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_block')}</label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {blocks.map((b) => (
                    <option key={b.block_code} value={b.block_code}>
                      {b.block_name} (Pop: {b.total_population?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_village')}</label>
                <select
                  value={selectedVillage || ''}
                  onChange={(e) => setSelectedVillage(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {villages.map((v) => (
                    <option key={v.village_code} value={v.village_code}>
                      {v.village_name} (Pop: {v.population?.toLocaleString()})
                    </option>
                  ))}
                  <option value="">-- Fallback to Block Benchmark --</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Business Category & Archetype Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>{t('select_archetype')}</span>
              </div>
              <span className="text-xs text-slate-500">{archetypes.length} Curated Rural Archetypes Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {archetypes.map((arch) => {
                const isSelected = arch.archetype_id === selectedArchetypeId;
                return (
                  <div
                    key={arch.archetype_id}
                    onClick={() => setSelectedArchetypeId(arch.archetype_id)}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {arch.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹ {arch.benchmark_project_cost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mb-1">{arch.name}</h3>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">{arch.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Monthly EBITDA: ₹{arch.estimated_monthly_ebitda.toLocaleString('en-IN')}</span>
                      <span>Radius: {arch.market_catchment_km} km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Financial Outlay & Promoter Margin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {t('available_margin')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">₹</div>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={availableCapital}
                  onChange={(e) => setAvailableCapital(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. 20000"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Actual own capital available for promoter investment.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {t('custom_cost')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">₹</div>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder={`Default: ₹${selectedArchetype?.benchmark_project_cost.toLocaleString('en-IN') || '1,00,000'}`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Leave blank to use verified benchmark archetype cost.</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Continue to Scheme Eligibility</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2 Form: Targeted Scheme Eligibility */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmitEvaluation} className="space-y-6">
          {/* Eligibility Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Social Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {t('social_category')} <span className="text-emerald-700 font-bold">(NSFDC Target Group)</span>
              </label>
              <select
                value={socialCategory}
                onChange={(e) => setSocialCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="SC">Scheduled Caste (SC) - Primary NSFDC Beneficiary</option>
                <option value="SafaiKaramchari">Safai Karamchari / Sanitation Worker</option>
                <option value="ST">Scheduled Tribe (ST) - Allied Scheme Routing</option>
                <option value="OBC">Other Backward Class (OBC)</option>
                <option value="General">General Category (PMEGP / MUDRA)</option>
              </select>
            </div>

            {/* Annual Family Income */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800">{t('annual_income')}</label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">Limit: ≤ ₹5.00L</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">₹</div>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. 240000"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Official ceiling: ₹5,00,000 / year (effective 7 Jan 2026).</p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">{t('gender')}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Female">Female (Eligible for special SCA priority)</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            {/* Activity Type / Extended Moratorium */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Enterprise Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="standard">Standard Micro-Enterprise (Standard Moratorium)</option>
                <option value="plantation">Plantation / Horticulture (12-Month Extended Moratorium)</option>
                <option value="construction">Rural Construction Activity (12-Month Extended Moratorium)</option>
              </select>
            </div>

            {/* Optional Channel Agency Margin Requirement */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Channel Agency Margin % (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={channelMarginPct}
                onChange={(e) => setChannelMarginPct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="e.g. 5% or 10% (Bank specific)"
              />
              <p className="text-[10px] text-slate-500 mt-1">Configurable bank promoter margin requirement.</p>
            </div>

            {/* Experience / Prior Training */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="prior_exp"
                checked={hasExperience}
                onChange={(e) => setHasExperience(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="prior_exp" className="text-xs font-medium text-slate-700 cursor-pointer">
                {t('prior_exp')}
              </label>
            </div>
          </div>

          {/* Live Deterministic Calculation Preview Box */}
          {quickPlan && (
            <div className={`p-4 rounded-xl border transition-all ${
              quickPlan.eligible
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-amber-50/60 border-amber-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {quickPlan.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-700" />
                  )}
                  <span className="text-xs font-bold text-slate-900">
                    {quickPlan.eligible ? `Routed to ${quickPlan.selected_scheme_name}` : 'Eligibility Notice'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  {quickPlan.repayment_frequency} Repayment
                </span>
              </div>

              {quickPlan.eligible ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Approved Loan Limit</span>
                    <span className="font-bold text-emerald-800 text-sm">₹ {quickPlan.approved_loan.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Beneficiary Interest</span>
                    <span className="font-bold text-slate-900">{quickPlan.interest_rate_pa}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Regular Installment</span>
                    <span className="font-bold text-slate-900">₹ {quickPlan.installment_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Financing Gap</span>
                    <span className={`font-bold ${quickPlan.financing_gap > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      ₹ {quickPlan.financing_gap.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-900 font-medium">{quickPlan.message}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>{t('calculating')}</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{t('evaluate_btn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
