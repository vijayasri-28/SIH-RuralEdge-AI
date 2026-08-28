import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { OnboardingWizard } from './components/OnboardingWizard';
import { FeasibilityDashboard } from './components/FeasibilityDashboard';
import { VoiceAdvisorModal } from './components/VoiceAdvisorModal';
import { SchemesCatalogModal } from './components/SchemesCatalogModal';
import { evaluateFeasibility } from './services/api';
import type { FeasibilityEvaluationResponse, MinimalOnboardingInput, EligibilityProfile } from './types';
import { ShieldCheck, AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [evaluationResult, setEvaluationResult] = useState<FeasibilityEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isVoiceAdvisorOpen, setIsVoiceAdvisorOpen] = useState<boolean>(false);
  const [isSchemesCatalogOpen, setIsSchemesCatalogOpen] = useState<boolean>(false);

  const handleEvaluationComplete = async (data: {
    onboarding: MinimalOnboardingInput;
    eligibility: EligibilityProfile;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await evaluateFeasibility(data.onboarding, data.eligibility);
      setEvaluationResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEvaluationResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <Header
        onOpenSchemesCatalog={() => setIsSchemesCatalogOpen(true)}
        onOpenVoiceAdvisor={() => setIsVoiceAdvisorOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-800 rounded-xl p-4 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Evaluation Notice:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {evaluationResult ? (
          <FeasibilityDashboard
            data={evaluationResult}
            onReset={handleReset}
            onOpenVoiceAdvisor={() => setIsVoiceAdvisorOpen(true)}
          />
        ) : (
          <OnboardingWizard
            onEvaluationComplete={handleEvaluationComplete}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-800">RuralEdge AI • Smart India Hackathon 2026</span>
            <span>— NSFDC Grounded Livelihood Advisory Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Income Ceiling: ₹5,00,000 / yr</span>
            <span>•</span>
            <a href="https://nsfdc.nic.in" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
              nsfdc.nic.in
            </a>
            <span>•</span>
            <span>100% Deterministic Financial Math</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VoiceAdvisorModal
        isOpen={isVoiceAdvisorOpen}
        onClose={() => setIsVoiceAdvisorOpen(false)}
        feasibilityData={evaluationResult}
      />

      <SchemesCatalogModal
        isOpen={isSchemesCatalogOpen}
        onClose={() => setIsSchemesCatalogOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
