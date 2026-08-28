import React, { useState, useEffect } from 'react';
import { fetchSchemesCatalog } from '../services/api';
import {
  X,
  BookOpen,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface SchemesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemesCatalogModal: React.FC<SchemesCatalogModalProps> = ({ isOpen, onClose }) => {
  const [catalog, setCatalog] = useState<any>(null);

  useEffect(() => {
    if (isOpen && !catalog) {
      fetchSchemesCatalog().then(setCatalog).catch(console.error);
    }
  }, [isOpen, catalog]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Official NSFDC Schemes Catalog</h3>
              <p className="text-xs text-emerald-200">Statutory Concessional Credit Guidelines & Gazette Rules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statutory Income Ceiling Notice */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 block mb-0.5">
                Current Annual Family Income Ceiling: ₹5,00,000 (Effective 7 January 2026)
              </span>
              <p className="text-emerald-800">
                Target community is Scheduled Castes (SC) living with annual family income up to ₹5.00 Lakh. Official statutory basis: NSFDC Enhanced Annual Family Income Ceiling Notification.
              </p>
              <a
                href="https://nsfdc.nic.in/en/faq"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-900 font-bold underline mt-1.5"
              >
                <span>Verify on NSFDC Official FAQ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Primary MVP Schemes Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary MVP Schemes Supported
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Micro Finance Scheme */}
              <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    NSFDC-MFS-01
                  </span>
                  <span className="text-xs font-bold text-slate-900">Project Cost: ≤ ₹1,40,000</span>
                </div>
                <h5 className="text-sm font-bold text-slate-900 mb-1">Micro Finance Scheme</h5>
                <p className="text-xs text-slate-600 mb-3">
                  Micro-credit for small income-generating activities with 3-year quarterly repayments.
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-200 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Financing:</span>
                    <span className="font-semibold">Up to 90% (Max ₹1,25,000)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Interest Rate:</span>
                    <span className="font-semibold text-emerald-800">6.5% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Repayment:</span>
                    <span className="font-semibold">Quarterly (11 Active + 1 Moratorium)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moratorium:</span>
                    <span className="font-semibold">3 Months (Simple Interest)</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                  <a
                    href="https://nsfdc.nic.in/en/micro-credit-scheme"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1"
                  >
                    <span>Official MFS Guidelines</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Term Loan Scheme */}
              <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    NSFDC-TLS-01
                  </span>
                  <span className="text-xs font-bold text-slate-900">Project Cost: ₹1.4L - ₹50L</span>
                </div>
                <h5 className="text-sm font-bold text-slate-900 mb-1">Term Loan Scheme</h5>
                <p className="text-xs text-slate-600 mb-3">
                  Term financing for commercial, agro-processing, or service micro-enterprises.
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-200 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Financing:</span>
                    <span className="font-semibold">Up to 90% (Max ₹45,00,000)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Interest Rate:</span>
                    <span className="font-semibold text-teal-800">8.0% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Repayment:</span>
                    <span className="font-semibold">Monthly (78 Active + 6 Moratorium)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Extended Moratorium:</span>
                    <span className="font-semibold">12 Months (Plantation/Construction)</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                  <a
                    href="https://nsfdc.nic.in/en/term-loan-scheme"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1"
                  >
                    <span>Official TLS Guidelines</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Post-MVP / Out of Scope Schemes Note */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <h5 className="font-bold text-slate-800 mb-1.5">Schemes Outside MVP Scope (mvp_not_implemented_schemes):</h5>
            <p className="text-slate-600 mb-2">
              The following official NSFDC products are recognized but intentionally scheduled for post-MVP integration:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Ajeevika Microfinance Yojana (AMY)',
                'Udyamita Nidhi Yojana (UNY)',
                'Education Loan Scheme (ELS)',
                'Mahila Samriddhi Yojana (MSY)',
                'Swachhta Udyami Yojana (SUY)',
                'Laghu Vyavasay Yojana (LVY)',
                'Green Business Scheme'
              ].map((sch, i) => (
                <span key={i} className="bg-white border border-slate-300 text-slate-700 px-2.5 py-1 rounded-md text-[11px]">
                  {sch}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
