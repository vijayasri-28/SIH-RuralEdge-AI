import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { OnboardingWizard } from './components/OnboardingWizard';
import { FeasibilityDashboard } from './components/FeasibilityDashboard';
import { VoiceAdvisorModal } from './components/VoiceAdvisorModal';
import { SchemesCatalogModal } from './components/SchemesCatalogModal';
import { evaluateFeasibility } from './services/api';
import type { FeasibilityEvaluationResponse, MinimalOnboardingInput, EligibilityProfile } from './types';
import { AlertCircle, Sprout, Zap, Users, BookOpen, Microchip, ShieldCheck} from 'lucide-react';
import './App.css';

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
    <div className="page-container">
      {/* Header */}
      <Header
        onOpenSchemesCatalog={() => setIsSchemesCatalogOpen(true)}
        onOpenVoiceAdvisor={() => setIsVoiceAdvisorOpen(true)}
      />

      {/* Main Container */}
      <main className="main-content max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 glass glass-light border-red-500/40 bg-red-900/20 text-red-200 rounded-xl p-4 flex items-start gap-3 text-xs animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
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
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="hero-section">
              <h1 className="gradient-text mb-4">RuralEdge AI</h1>
              <p className="text-lg leading-relaxed">
                Empowering rural entrepreneurs with intelligent financial feasibility analysis, government scheme routing, and personalized guidance—all powered by AI.
              </p>
            </div>

            {/* Feature Cards Showcase */}
            <div className="feature-cards stagger">
              <div className="feature-card">
                <div className="feature-card-icon">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3>AI Guidance</h3>
                <p>Intelligent assistant providing real-time advice on loan applications and business planning</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' }}>
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h3>Financial Feasibility</h3>
                <p>Deterministic analysis of project costs, loan structuring, and repayment viability</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' }}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3>Government Schemes</h3>
                <p>Automatic routing to NSFDC and government schemes based on eligibility criteria</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #059669 100%)' }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3>Personalized Assistance</h3>
                <p>Tailored recommendations based on location, business type, and demographics</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                  <Microchip className="w-5 h-5 text-white" />
                </div>
                <h3>Voice Advisor</h3>
                <p>Multilingual voice-enabled AI assistant for hands-free guidance in Indian languages</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }}>
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3>Verified Data</h3>
                <p>All recommendations grounded in official NSFDC guidelines and statutory rules</p>
              </div>
            </div>

            {/* Call to Action */}
            <OnboardingWizard
              onEvaluationComplete={handleEvaluationComplete}
              isLoading={isLoading}
            />

            {/* Information Section */}
            <div className="glass glass-card rounded-2xl p-8 border-emerald-500/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">₹5,00,000</div>
                  <p className="text-sm text-slate-300">Annual Family Income Ceiling (NSFDC Eligible)</p>
                </div>
                <div className="text-center border-l border-r border-slate-600/30">
                  <div className="text-3xl font-bold gradient-text-teal mb-2">100%</div>
                  <p className="text-sm text-slate-300">Deterministic Financial Math</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">6.5-8%</div>
                  <p className="text-sm text-slate-300">Concessional Interest Rates (p.a.)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass glass-light border-t border-emerald-500/30 py-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">RuralEdge AI • Smart India Hackathon 2026</span>
              <span>— NSFDC Grounded Livelihood Advisory</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
              <span>Income Ceiling: ₹5,00,000 / yr</span>
              <span>•</span>
              <a href="https://nsfdc.nic.in" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                nsfdc.nic.in
              </a>
              <span>•</span>
              <span>100% Deterministic Financial Math</span>
            </div>
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
