import React from 'react';
import { X, Scale, ShieldCheck, BookOpen, Award, CheckCircle2, Clock } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0b172a] text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-serif font-bold">About the Publication</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-700 text-sm leading-relaxed">
          <div className="text-center border-b border-slate-200 pb-5">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-700 block mb-1">
              Editorial Masthead
            </span>
            <h3 className="text-2xl font-serif font-bold text-slate-950">
              MK PROFESSIONAL LEGAL BULLETIN
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Published by Manish Khandelwal & Co. • Advocates & Corporate Tax Advisors
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-base">
              Core Mission & Intellectual Foundation
            </h4>
            <p>
              <strong>MK Professional Legal Bulletin</strong> is an enterprise-grade AI-powered legal intelligence, regulatory monitoring, and daily circulation platform. Designed for Chartered Accountants, Company Secretaries, Cost Accountants, Insolvency Professionals, and Corporate Legal Counsels across India, it provides structured legal research on newly gazetted circulars, statutory amendments, and judicial rulings.
            </p>
            <p>
              Unlike generic legal news aggregators, every update published on this platform adheres to our strict <strong>5-Part Legal Research Standard</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs mb-1">1. Material Facts</span>
                <p className="text-xs text-slate-600">
                  Background, triggering disputes, material events, and context leading to regulatory intervention.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs mb-1">2. Statutory Provisions</span>
                <p className="text-xs text-slate-600">
                  Exact sections, subsections, rules, notifications, and binding judicial precedents.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs mb-1">3. Operative Decision</span>
                <p className="text-xs text-slate-600">
                  Verbatim ratio decidendi, statutory clarification, or amendment guidelines.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs mb-1">4. Professional Implication</span>
                <p className="text-xs text-slate-600">
                  Actionable advisory steps and procedural compliances for CA / CS / CMA / IP professionals.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="font-serif font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Strict Legal Accuracy & Verification Protocol</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Zero AI Hallucination Policy:</strong> The AI legal engine is strictly prohibited from inventing statutory provisions, citations, or judicial orders. Missing details are explicitly disclosed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Mandatory Human Gate:</strong> No AI draft is ever circulated automatically. A senior advocate or partner personally audits and verifies each update before publication.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Asia/Kolkata Midnight Daemon:</strong> Scheduled at 12:00 AM IST to purge expired temporary artifacts while permanently preserving verified legal precedents.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#0b172a] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
