import React, { useState, useEffect, useRef } from 'react';
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

  // Generation counters to ignore stale async responses (race condition prevention)
  const districtGenRef = useRef(0);
  const blockGenRef = useRef(0);
  const villageGenRef = useRef(0);

  // Tracks whether the initial hierarchy has been loaded so the cascade effects
  // do not fire on the very first render (initial data is fetched in loadInitialData).
  const isInitialLoadDone = useRef(false);

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

  // Load initial data — fetches states, archetypes, AND the full default geo hierarchy
  // (districts → blocks → villages for the hardcoded defaults) so the cascade effects
  // don't fire on first render and wipe the default selections.
useEffect(() => {
  const loadInitialData = async () => {
    try {
      const [statesRes, archetypesRes] = await Promise.all([
        fetchStates(),
        fetchArchetypes()
      ]);

      const loadedStates = statesRes.states || [];
      setStates(loadedStates);

      // Keep default state if it exists, otherwise use first state
      let effectiveState = selectedState;
      if (
        loadedStates.length > 0 &&
        !loadedStates.some((s: any) => s.state_code === selectedState)
      ) {
        effectiveState = loadedStates[0].state_code;
        setSelectedState(effectiveState);
      }

      const loadedArchetypes = archetypesRes.archetypes || [];
      setArchetypes(loadedArchetypes);

      if (
        loadedArchetypes.length > 0 &&
        !loadedArchetypes.some(
          (a: BusinessArchetype) => a.archetype_id === selectedArchetypeId
        )
      ) {
        setSelectedArchetypeId(loadedArchetypes[0].archetype_id);
      }

      // --- Load the full geo hierarchy for the initial defaults ---
      // Fetch districts for the effective state
      const distGen = ++districtGenRef.current;
      let effectiveDistrict = selectedDistrict;
      try {
        const distRes = await fetchDistricts(effectiveState);
        if (districtGenRef.current !== distGen) return;
        const loadedDistricts = distRes.districts || [];
        setDistricts(loadedDistricts);
        // Verify the default district belongs to this state; fall back to first if not
        if (loadedDistricts.length > 0) {
          const defaultExists = loadedDistricts.some(
            (d: any) => d.district_code === effectiveDistrict
          );
          if (!defaultExists) {
            effectiveDistrict = loadedDistricts[0].district_code;
            setSelectedDistrict(effectiveDistrict);
          }
        }
      } catch {
        setDistricts([]);
      }

      // Fetch blocks for the effective state + district
      const blkGen = ++blockGenRef.current;
      let effectiveBlock = selectedBlock;
      try {
        const blkRes = await fetchBlocks(effectiveState, effectiveDistrict);
        if (blockGenRef.current !== blkGen) return;
        const loadedBlocks = blkRes.blocks || [];
        setBlocks(loadedBlocks);
        if (loadedBlocks.length > 0) {
          const defaultExists = loadedBlocks.some(
            (b: any) => b.block_code === effectiveBlock
          );
          if (!defaultExists) {
            effectiveBlock = loadedBlocks[0].block_code;
            setSelectedBlock(effectiveBlock);
          }
        }
      } catch {
        setBlocks([]);
      }

      // Fetch villages for the effective state + district + block
      const vlgGen = ++villageGenRef.current;
      try {
        const vlgRes = await fetchVillages(effectiveState, effectiveDistrict, effectiveBlock);
        if (villageGenRef.current !== vlgGen) return;
        const loadedVillages = vlgRes.villages || [];
        setVillages(loadedVillages);
        if (loadedVillages.length > 0) {
          const defaultExists = loadedVillages.some(
            (v: any) => v.village_code === selectedVillage
          );
          if (!defaultExists) {
            setSelectedVillage(loadedVillages[0].village_code);
          }
        } else {
          setSelectedVillage(undefined);
        }
      } catch {
        setVillages([]);
        setSelectedVillage(undefined);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      // Signal that the initial load is done so the cascade effects can take over
      isInitialLoadDone.current = true;
    }
  };

  loadInitialData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// State → District
// Skips the very first render (handled by loadInitialData above).
// On subsequent state changes: clears downstream, fetches new districts, auto-selects first.
useEffect(() => {
  if (!isInitialLoadDone.current) return;
  if (!selectedState) return;

  const gen = ++districtGenRef.current;
  // Immediately clear downstream to avoid stale data being visible
  blockGenRef.current++;
  villageGenRef.current++;
  setDistricts([]);
  setBlocks([]);
  setVillages([]);
  setSelectedDistrict(0);
  setSelectedBlock(0);
  setSelectedVillage(undefined);

  const loadDistricts = async () => {
    try {
      const res = await fetchDistricts(selectedState);
      if (districtGenRef.current !== gen) return; // stale response — discard

      const loadedDistricts = res.districts || [];
      setDistricts(loadedDistricts);

      if (loadedDistricts.length > 0) {
        setSelectedDistrict(loadedDistricts[0].district_code);
      }
    } catch (error) {
      if (districtGenRef.current !== gen) return;
      console.error('Failed to load districts:', error);
      setDistricts([]);
    }
  };

  loadDistricts();
}, [selectedState]); // eslint-disable-line react-hooks/exhaustive-deps


// District → Block
// Skips the very first render (handled by loadInitialData above).
// On subsequent district changes: clears downstream, fetches blocks, auto-selects first.
useEffect(() => {
  if (!isInitialLoadDone.current) return;
  if (!selectedState || !selectedDistrict) return;

  const gen = ++blockGenRef.current;
  // Immediately clear downstream
  villageGenRef.current++;
  setBlocks([]);
  setVillages([]);
  setSelectedBlock(0);
  setSelectedVillage(undefined);

  const loadBlocks = async () => {
    try {
      const res = await fetchBlocks(selectedState, selectedDistrict);
      if (blockGenRef.current !== gen) return; // stale response — discard

      const loadedBlocks = res.blocks || [];
      setBlocks(loadedBlocks);

      if (loadedBlocks.length > 0) {
        setSelectedBlock(loadedBlocks[0].block_code);
      }
    } catch (error) {
      if (blockGenRef.current !== gen) return;
      console.error('Failed to load blocks:', error);
      setBlocks([]);
    }
  };

  loadBlocks();
}, [selectedState, selectedDistrict]); // eslint-disable-line react-hooks/exhaustive-deps


// Block → Village
// Skips the very first render (handled by loadInitialData above).
// On subsequent block changes: clears villages, fetches new ones, auto-selects first.
useEffect(() => {
  if (!isInitialLoadDone.current) return;
  if (!selectedState || !selectedDistrict || !selectedBlock) return;

  const gen = ++villageGenRef.current;
  setVillages([]);
  setSelectedVillage(undefined);

  const loadVillages = async () => {
    try {
      const res = await fetchVillages(selectedState, selectedDistrict, selectedBlock);
      if (villageGenRef.current !== gen) return; // stale response — discard

      const loadedVillages = res.villages || [];
      setVillages(loadedVillages);

      if (loadedVillages.length > 0) {
        setSelectedVillage(loadedVillages[0].village_code);
      }
      // else: leave selectedVillage as undefined — block fallback is valid
    } catch (error) {
      if (villageGenRef.current !== gen) return;
      console.error('Failed to load villages:', error);
      setVillages([]);
      setSelectedVillage(undefined);
    }
  };

  loadVillages();
}, [selectedState, selectedDistrict, selectedBlock]); // eslint-disable-line react-hooks/exhaustive-deps




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
  // Loads the full geo hierarchy for the preset atomically to avoid the cascade
  // effects overwriting preset selections with whatever the API returns first.
  const applyPreset = async (preset: 'anita' | 'ramesh' | 'shravan') => {
    type PresetConfig = {
      stateCode: number;
      districtCode: number;
      blockCode: number;
      villageCode: number;
      archetypeId: string;
      capital: number;
      cost: string;
      category: 'SC' | 'SafaiKaramchari' | 'ST' | 'OBC' | 'General';
      income: number;
      genderVal: 'Female' | 'Male' | 'Transgender';
      experience: boolean;
      activityType: string;
    };

    const presets: Record<string, PresetConfig> = {
      anita: {
        stateCode: 36, districtCode: 505, blockCode: 4310, villageCode: 574890,
        archetypeId: 'spice_chilly_grinding', capital: 15000, cost: '95000',
        category: 'SC', income: 220000, genderVal: 'Female', experience: true, activityType: 'standard'
      },
      ramesh: {
        stateCode: 9, districtCode: 178, blockCode: 1420, villageCode: 208400,
        archetypeId: 'pottery_terracotta_crafts', capital: 10000, cost: '85000',
        category: 'SC', income: 180000, genderVal: 'Male', experience: true, activityType: 'standard'
      },
      shravan: {
        stateCode: 27, districtCode: 515, blockCode: 4510, villageCode: 554300,
        archetypeId: 'cold_pressed_oil_expeller', capital: 60000, cost: '450000',
        category: 'SC', income: 340000, genderVal: 'Male', experience: true, activityType: 'standard'
      }
    };

    const cfg = presets[preset];
    if (!cfg) return;

    // Apply non-geo fields immediately
    setSelectedArchetypeId(cfg.archetypeId);
    setAvailableCapital(cfg.capital);
    setCustomCost(cfg.cost);
    setSocialCategory(cfg.category);
    setAnnualIncome(cfg.income);
    setGender(cfg.genderVal);
    setHasExperience(cfg.experience);
    setActivityType(cfg.activityType);

    // Bump all generation counters so any in-flight cascade effects are discarded
    const distGen = ++districtGenRef.current;
    const blkGen = ++blockGenRef.current;
    const vlgGen = ++villageGenRef.current;

    // Clear all dropdowns immediately to avoid momentary stale display
    setDistricts([]);
    setBlocks([]);
    setVillages([]);
    setSelectedDistrict(0);
    setSelectedBlock(0);
    setSelectedVillage(undefined);

    // Set the state — the State→District effect will fire but its fetch will be
    // discarded because we already bumped districtGenRef above.
    setSelectedState(cfg.stateCode);

    // Load the full hierarchy for the preset sequentially
    try {
      const distRes = await fetchDistricts(cfg.stateCode);
      if (districtGenRef.current !== distGen) return;
      const loadedDistricts = distRes.districts || [];
      setDistricts(loadedDistricts);
      const districtCode = loadedDistricts.some((d: any) => d.district_code === cfg.districtCode)
        ? cfg.districtCode
        : loadedDistricts[0]?.district_code ?? 0;
      setSelectedDistrict(districtCode);
      if (!districtCode) return;

      const blkRes = await fetchBlocks(cfg.stateCode, districtCode);
      if (blockGenRef.current !== blkGen) return;
      const loadedBlocks = blkRes.blocks || [];
      setBlocks(loadedBlocks);
      const blockCode = loadedBlocks.some((b: any) => b.block_code === cfg.blockCode)
        ? cfg.blockCode
        : loadedBlocks[0]?.block_code ?? 0;
      setSelectedBlock(blockCode);
      if (!blockCode) return;

      const vlgRes = await fetchVillages(cfg.stateCode, districtCode, blockCode);
      if (villageGenRef.current !== vlgGen) return;
      const loadedVillages = vlgRes.villages || [];
      setVillages(loadedVillages);
      const villageCode = loadedVillages.some((v: any) => v.village_code === cfg.villageCode)
        ? cfg.villageCode
        : loadedVillages[0]?.village_code;
      setSelectedVillage(villageCode);
    } catch (error) {
      console.error('Failed to load preset geo data:', error);
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
