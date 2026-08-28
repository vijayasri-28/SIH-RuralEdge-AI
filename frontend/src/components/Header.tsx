import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../context/LanguageContext';
import { Landmark, Globe, Mic, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSchemesCatalog: () => void;
  onOpenVoiceAdvisor: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSchemesCatalog, onOpenVoiceAdvisor }) => {
  const { language, setLanguage, t, isListening } = useLanguage();

  const languages: Array<{ code: SupportedLanguage; label: string; native: string }> = [
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'en', label: 'English', native: 'English' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Statutory Policy Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{t('income_banner')}</span>
        </div>
        <div className="flex items-center gap-3 text-emerald-200 text-[11px]">
          <span>Micro Finance (Quarterly @ 6.5%)</span>
          <span>•</span>
          <span>Term Loan (Monthly @ 8.0%)</span>
          <span>•</span>
          <span>Max 90% Financing</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('app_title')}</h1>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">{t('app_subtitle')}</p>
          </div>
        </div>

        {/* Action Controls & Language Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Statutory Scheme Catalog Button */}
          <button
            onClick={onOpenSchemesCatalog}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span className="hidden sm:inline">{t('view_schemes')}</span>
          </button>

          {/* Voice Advisor Trigger Button */}
          <button
            onClick={onOpenVoiceAdvisor}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all shadow-xs cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isListening ? 'Listening...' : t('voice_assistant')}</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </button>

          {/* Indic Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select preferred Indic language"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
