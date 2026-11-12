import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Scale,
  Calendar,
  Building2,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import type { LegalUpdate } from '../types.ts';

interface UpdateDetailPageProps {
  update: LegalUpdate;
  onBack: () => void;
}

export const UpdateDetailPage: React.FC<UpdateDetailPageProps> = ({ update, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanTitle = (update.title || 'Legal-Update').slice(0, 45).replace(/[/\\?%*:|"<>]/g, '');
    document.title = `${update.update_no} - ${cleanTitle} - MK Legal Bulletin`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleCopyNote = () => {
    const fullText = `
MK PROFESSIONAL LEGAL BULLETIN
Published by Manish Khandelwal & Co.
--------------------------------------------------
UPDATE NO.: ${update.update_no}
SUBJECT: ${update.title}
AUTHORITY / COURT: ${update.authority_name} (${update.authority_code})
CATEGORY: ${update.category_name}
DATE: ${update.issue_date}

[1] FACTS & BACKGROUND SUMMARY:
${update.facts || 'No factual details recorded.'}

[2] STATUTORY PROVISIONS & LEGAL CITATIONS:
${update.legal_provisions || 'No legal provisions listed.'}

[3] OPERATIVE RULING & LEGAL DEVELOPMENT:
${update.decision_development || 'No operative ruling recorded.'}

[4] CONCLUSION & PROFESSIONAL IMPLICATION (FOR CA / CS / CMA / ADVOCATES):
${update.conclusion_implications || 'No implications recorded.'}

[5] ORIGINAL REFERENCES & OFFICIAL CITATIONS:
${update.original_references || 'No references recorded.'}

--------------------------------------------------
Verified by: ${update.verified_by || 'Editorial Board, Manish Khandelwal & Co.'}
Source URL: ${update.original_url || 'https://mklegal.in'}
`.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-16">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {update.original_url && (
            <a
              href={update.original_url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Gazette</span>
            </a>
          )}

          <button
            onClick={handleCopyNote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Note' : 'Copy Citation'}</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{shareCopied ? 'Link Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Formal Letterhead */}
          <div className="border-b-2 border-slate-950 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-amber-700 block mb-1">
                  Statutory Intelligence Dossier
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-950 tracking-tight">
                  MANISH KHANDELWAL &amp; CO.
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Advocates, Chartered Accountants &amp; Corporate Regulatory Advisors
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-slate-950 text-amber-400 font-mono text-xs font-bold rounded-lg mb-1">
                  {update.update_no}
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Issue Date: <strong className="text-slate-800">{update.issue_date}</strong>
                </p>
                <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Legal Intelligence</span>
                </div>
              </div>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-semibold">
                {update.authority_name} ({update.authority_code})
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                {update.category_name}
              </span>
              {update.doc_type && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                  {update.doc_type}
                </span>
              )}
              {update.document_identifier && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-mono text-[11px] rounded-md">
                  Ref: {update.document_identifier}
                </span>
              )}
            </div>
          </div>

          {/* Subject / Title */}
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-1.5">
              Subject of Statutory Precedent
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-snug">
              {update.title}
            </h2>
          </div>

          {/* 5-Part Note Sections */}
          <div className="space-y-6 pt-2">
            {/* Section 1 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-900">
                  Facts &amp; Background Summary
                </h3>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-8">
                {update.facts || 'No factual details provided.'}
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-900">
                  Statutory Provisions &amp; Legal Citations
                </h3>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-8 font-mono text-xs">
                {update.legal_provisions || 'No legal provisions listed.'}
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-900">
                  Operative Ruling &amp; Legal Development
                </h3>
              </div>
              <div className="pl-8 border-l-2 border-slate-950 ml-3">
                <p className="text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-line pl-3">
                  {update.decision_development || 'No decision summary available.'}
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h3 className="text-xs uppercase tracking-wider font-bold text-amber-950">
                  Conclusion &amp; Professional Implication (For CA / CS / CMA / Advocates)
                </h3>
              </div>
              <div className="pl-8 border-l-2 border-amber-500 ml-3">
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line pl-3">
                  {update.conclusion_implications || 'No implications recorded.'}
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-900">
                  Original References &amp; Government Gazette Citations
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-8 font-mono">
                {update.original_references || 'No official reference cited.'}
              </p>
            </div>
          </div>

          {/* Verification Block / Signature */}
          <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">
                Editorial Certification: {update.verified_by || 'Manish Khandelwal, FCA'}
              </p>
              <p className="text-[11px] text-slate-500">
                Published by Manish Khandelwal &amp; Co. under statutory editorial verification standards.
              </p>
            </div>

            <div className="flex items-center gap-3 no-print">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Dossier</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
