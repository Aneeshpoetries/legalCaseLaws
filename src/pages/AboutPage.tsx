import React from 'react';
import { ArrowLeft, Scale, ShieldCheck, BookOpen, Award, CheckCircle2, Clock } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-16">
      {/* Top Sticky Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-semibold text-slate-500">
          MK Editorial Standards &amp; Masthead
        </span>
      </div>

      {/* Main Document Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Masthead */}
          <div className="text-center border-b border-slate-200 pb-6">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-amber-700 block mb-1">
              Editorial Masthead
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-950">
              MK PROFESSIONAL LEGAL BULLETIN
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Published by Manish Khandelwal &amp; Co.  Advocates &amp; Corporate Tax Advisors
            </p>
          </div>

          {/* Section 1: Editorial Intent */}
          <div className="space-y-3">
            <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Editorial Intent &amp; Objective</span>
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              The <strong>MK Professional Legal Bulletin</strong> is a specialized regulatory intelligence
              platform created for Chartered Accountants, Company Secretaries, Corporate Advocates, and Legal
              Counsels. Our primary mission is to transform dense, multi-page statutory gazette notifications,
              circulars, and appellate tribunal judgments into actionable, professional-grade insights within hours
              of their official release.
            </p>
          </div>

          {/* Section 2: 5-Part Note Methodology */}
          <div className="space-y-3">
            <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>The 5-Part Analytical Methodology</span>
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Every legal update published in this bulletin adheres strictly to our proprietary 5-Part Research
              Framework to ensure maximum clarity, legal rigor, and professional utility:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-950 block mb-1 font-mono">
                  [1] Facts &amp; Background
                </span>
                <p className="text-xs text-slate-600">
                  Concise factual context, origin of dispute, or regulatory trigger without extraneous narrative.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-950 block mb-1 font-mono">
                  [2] Statutory Provisions
                </span>
                <p className="text-xs text-slate-600">
                  Exact sections, rules, circular references, and statutory acts invoked in the matter.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-950 block mb-1 font-mono">
                  [3] Operative Ruling
                </span>
                <p className="text-xs text-slate-600">
                  Precise ratio decidendi, operative directive, or regulatory amendment holding.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-amber-900 block mb-1 font-mono">
                  [4] Professional Implications
                </span>
                <p className="text-xs text-slate-600">
                  Concrete advisories and compliance actions for practicing professionals and corporate boards.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 mt-2">
              <span className="text-xs font-bold text-slate-950 block mb-1 font-mono">
                [5] Citations &amp; Official References
              </span>
              <p className="text-xs text-slate-600">
                Direct government gazette citations, neutral citations, and verifiable links to original source documents.
              </p>
            </div>
          </div>

          {/* Section 3: Editorial Standards */}
          <div className="space-y-3">
            <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verification &amp; Human-in-the-Loop Protocol</span>
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              While our proprietary AI engine assists in ingestion and initial draft synthesis, <strong>no bulletin entry is ever published automatically without editorial verification</strong> by qualified legal and tax professionals at Manish Khandelwal &amp; Co. Every citation and section reference is cross-verified against official gazettes before final sign-off.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-slate-200 pt-6 text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">Statutory Disclaimer:</p>
            <p>
              The content published in the MK Professional Legal Bulletin is for informational and educational
              purposes for practicing professionals and corporate counsels. It does not constitute formal legal
              counsel or tax opinion. Readers are advised to consult the primary Gazette publications and seek
              professional counsel before initiating statutory proceedings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
