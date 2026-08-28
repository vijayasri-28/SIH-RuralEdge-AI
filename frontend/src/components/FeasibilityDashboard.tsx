import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { FeasibilityEvaluationResponse } from '../types';
import { downloadDprPdf } from '../services/api';
import {
  ShieldCheck,
  Award,
  FileDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Info,
  Calendar,
  Zap,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface FeasibilityDashboardProps {
  data: FeasibilityEvaluationResponse;
  onReset: () => void;
  onOpenVoiceAdvisor: () => void;
}

export const FeasibilityDashboard: React.FC<FeasibilityDashboardProps> = ({ data, onReset, onOpenVoiceAdvisor }) => {
  const { t } = useLanguage();
  const [showLineageDetails, setShowLineageDetails] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const fin = data.financial_plan;
  const geo = data.geo_context;
  const arch = data.archetype_details;
  const conf = data.data_confidence;
  const swot = data.swot_advisory;

  // Prepare chart data from schedule
  const chartData = (fin.schedule || []).map((item) => ({
    period: `${fin.repayment_frequency === 'QUARTERLY' ? 'Q' : 'M'}${item.period_number}`,
    principal: item.principal_repaid,
    interest: item.interest_charged,
    closingBalance: item.closing_principal,
    installment: item.total_installment
  }));

  const handleDownloadDPR = async () => {
    setIsDownloading(true);
    try {
      await downloadDprPdf(data.report_id, data);
    } catch (e) {
      console.error('Download DPR error:', e);
      alert('Failed to download DPR PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Top Banner: Status, Scheme Routing Badge & DPR Download */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{fin.selected_scheme_name || 'NSFDC Concessional Scheme'}</span>
              </span>
              <span className="text-slate-400 text-xs font-mono">Report ID: {data.report_id}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              {arch.name} ({arch.category})
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {geo.village_name ? `${geo.village_name} (Village), ` : ''}
                {geo.block_name} Block, {geo.district_name} District
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenVoiceAdvisor}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl transition-colors border border-white/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ask Voice Advisor</span>
            </button>

            <button
              onClick={handleDownloadDPR}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating DPR PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>{t('download_dpr')}</span>
                </>
              )}
            </button>


            <button
              onClick={onReset}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2.5 rounded-xl transition-colors border border-white/10 cursor-pointer"
            >
              New Evaluation
            </button>
          </div>
        </div>

        {/* Explainable Fallback Notice Alert */}
        {conf.fallback_notice && (
          <div className="mt-5 bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent Data Grounding Fallback: </span>
              <span>{conf.fallback_notice}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 4 Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Loan Limit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('approved_loan')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              90%
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-800">
            ₹ {fin.approved_loan.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Max 90% project cost cap enforced (Limit: ₹{fin.absolute_loan_cap.toLocaleString('en-IN')})
          </p>
        </div>

        {/* Concessional Interest Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('interest_rate')}</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {fin.interest_rate_pa}% <span className="text-xs font-normal text-slate-500">p.a.</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {fin.repayment_frequency} Amortization over {fin.total_periods} periods ({fin.moratorium_months}m Moratorium)
          </p>
        </div>

        {/* Regular Installment */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{t('installment')}</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹ {fin.installment_amount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Payable {fin.repayment_frequency.toLowerCase()} post {fin.moratorium_periods} moratorium period(s)
          </p>
        </div>

        {/* Financing Gap / Deficit */}
        <div className={`rounded-xl border p-4 shadow-xs ${
          fin.financing_gap > 0 ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">{t('financing_gap')}</span>
            {fin.financing_gap > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className={`text-xl font-bold ${fin.financing_gap > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
            ₹ {fin.financing_gap.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            {fin.financing_gap > 0
              ? 'Shortfall: Mobilize additional promoter capital or phase out machinery.'
              : 'Fully Funded: Capital + Approved Loan covers 100% of project cost.'}
          </p>
        </div>
      </div>

      {/* Row: Explainable Data Confidence Badge & Evidence Lineage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('evidence_title')}</h3>
              <p className="text-xs text-slate-500">Explainable 5-Dimension Grounding Framework</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <span>Confidence: {conf.composite_score_pct}%</span>
              <span>({conf.qualitative_rating})</span>
            </div>

            <button
              onClick={() => setShowLineageDetails(!showLineageDetails)}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
            >
              <span>{showLineageDetails ? 'Hide Citations' : 'View Verified Sources'}</span>
              {showLineageDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 5-Dimension Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">1. Source Authority</span>
            <span className="font-bold text-slate-900">{conf.source_authority_score}%</span>
            <span className="text-[10px] text-slate-500 block">Statutory Gazette</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">2. Geo Specificity</span>
            <span className="font-bold text-slate-900">{conf.geographic_specificity_score}%</span>
            <span className="text-[10px] text-slate-500 block">{geo.fallback_level || 'Village'} Level</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">3. Freshness</span>
            <span className="font-bold text-slate-900">{conf.freshness_score}%</span>
            <span className="text-[10px] text-slate-500 block">2026 Rules Active</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">4. Completeness</span>
            <span className="font-bold text-slate-900">{conf.completeness_score}%</span>
            <span className="text-[10px] text-slate-500 block">Verified Inputs</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">5. Verification</span>
            <span className="font-bold text-slate-900">{conf.consistency_score}%</span>
            <span className="text-[10px] text-slate-500 block">FAQ Corroborated</span>
          </div>
        </div>

        {/* Detailed Evidence Lineage Table (Expandable) */}
        {showLineageDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-2.5">Attribute / Claim</th>
                  <th className="p-2.5">Statutory Source & URL</th>
                  <th className="p-2.5">Authority</th>
                  <th className="p-2.5">Effective Date</th>
                  <th className="p-2.5">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {conf.lineage_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-medium">{item.attribute}</td>
                    <td className="p-2.5">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>{item.source_title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-2.5">{item.authority}</td>
                    <td className="p-2.5">{item.effective_date || 'Current'}</td>
                    <td className="p-2.5">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {item.confidence_tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row: Interactive Visualizations (Amortization & EBITDA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Amortization Curve */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Amortization & Debt Reduction Schedule</h3>
              <p className="text-xs text-slate-500">Principal Repayment vs Interest Burden</p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              {fin.repayment_frequency}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip
                  formatter={(val: any) => [`₹ ${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="principal" name="Principal Paid (₹)" stroke="#059669" fillOpacity={1} fill="url(#colorPrincipal)" />
                <Area type="monotone" dataKey="interest" name="Interest Charged (₹)" stroke="#D97706" fillOpacity={1} fill="url(#colorInterest)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Economics & DSCR Viability Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Unit Economics & Debt Service Coverage (DSCR)</h3>
              <p className="text-xs text-slate-500">Benchmark Viability Index</p>
            </div>
            <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
              fin.is_dscr_viable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              DSCR: {fin.average_dscr} ({fin.is_dscr_viable ? 'Bank Viable' : 'Moderate'})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Monthly Revenue Est.</span>
              <span className="font-bold text-slate-900 text-sm">₹ {arch.typical_monthly_revenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Monthly EBITDA</span>
              <span className="font-bold text-emerald-800 text-sm">₹ {arch.estimated_monthly_ebitda.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Break-Even Revenue</span>
              <span className="font-bold text-slate-900 text-sm">₹ {fin.break_even_monthly_revenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Working Capital Reserve</span>
              <span className="font-bold text-slate-900 text-sm">₹ {fin.working_capital_required.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Internal benchmark rule of thumb: An average DSCR ≥ 1.5 indicates healthy operational surplus to service regular installments post-moratorium.
          </p>
        </div>
      </div>

      {/* Row: Dynamic SWOT & Risk Mitigation Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">{t('swot_title')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Key Strengths & Advantages</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {swot.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities & Local Niche */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <span>Opportunities & Market Reach</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {swot.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">•</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Weaknesses & Operational Sensitivities</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {swot.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats & Mitigations */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-700" />
              <span>Risk Mitigations</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {swot.risk_mitigation_strategies.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-700 font-bold">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Niche Recommendation Box */}
        <div className="mt-4 bg-slate-900 text-white rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-300">Hyper-Local Niche Recommendation: </span>
            <span className="text-slate-200">{swot.local_niche_recommendation}</span>
          </div>
        </div>
      </div>

      {/* Row: Step-by-Step Channel Agency (SCA) Next Steps */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          State Channelising Agency (SCA) & Bank Application Next Steps
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {swot.channel_agency_next_steps.map((step, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] mb-2">
                {idx + 1}
              </span>
              <p className="text-slate-700 font-medium">{step.replace(/^\d+\.\s*/, '')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs">
        <p className="font-semibold text-slate-800 mb-1">Statutory Notice & Regulatory Disclaimer:</p>
        <p>{fin.statutory_disclaimer}</p>
      </div>
    </div>
  );
};
