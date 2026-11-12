import React, { useState } from 'react';
import {
  X,
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
  ArrowLeft,
  Download,
  Award,
} from 'lucide-react';
import type { LegalUpdate } from '../types.ts';

interface UpdateDetailModalProps {
  update: LegalUpdate | null;
  onClose: () => void;
}

export const UpdateDetailModal: React.FC<UpdateDetailModalProps> = ({ update, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  if (!update) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    // Set descriptive title so browser suggests this exact name when saving as PDF
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
DATE: ${update.issue_date}

1. FACTS
${update.facts || 'N/A'}

2. REFERENCE SECTIONS / LEGAL PROVISIONS
${update.legal_provisions || 'N/A'}

3. DECISION / LEGAL DEVELOPMENT
${update.decision_development || 'N/A'}

4. CONCLUSION & PROFESSIONAL IMPLICATION
${update.conclusion_implications || 'N/A'}

5. ORIGINAL SOURCE & REFERENCE
${update.original_references || 'N/A'}
Permanent URL: ${window.location.origin}/bulletin/${update.category_slug}/${update.slug}
--------------------------------------------------
Verified Legal Intelligence by Manish Khandelwal & Co.
`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/bulletin/${update.category_slug}/${update.slug}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const formattedDate = new Date(update.issue_date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="printable-legal-update"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 printable-modal-backdrop"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col printable-modal-box">

        {/* Modal Action Header (Hidden on print) */}
        <div className="bg-[#0b172a] text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/30 print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded">
              {update.update_no}
            </span>
            <span className="text-xs text-amber-300 hidden sm:inline">
              {update.authority_code} • {update.category_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print formatted legal research note or export PDF"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopyNote}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Copy complete structured note"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Note</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Copy permanent share link"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-7 text-slate-800 printable-scroll-body print:p-0 print:space-y-5">

          {/* ── LAW FIRM LETTERHEAD / MASTHEAD (Prints impeccably) ── */}
          <div className="border-b-2 border-slate-900 pb-5 print-avoid-break">
            {/* Top Firm Ribbon */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-black text-amber-400 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                  <Scale className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-serif font-bold text-slate-950 tracking-wider uppercase leading-none">
                    MANISH KHANDELWAL & CO.
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">
                    Advocates, Corporate & Tax Consultants • New Delhi / India
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500 leading-tight">
                <p className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                  Official Regulatory Circulation
                </p>
                <p className="text-amber-800 font-medium font-mono text-[10px] mt-0.5">
                  Precedent Registry: MK-PLB
                </p>
                <p className="text-slate-400 text-[10px]">Edition: Professional Legal Intelligence</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-950 tracking-tight">
                MK PROFESSIONAL LEGAL BULLETIN
              </h2>
              <p className="text-xs text-slate-600 uppercase tracking-widest mt-1 font-semibold">
                Structured Precedent Note & Statutory Intelligence Digest
              </p>
            </div>

            {/* Metadata Box */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                  UPDATE REF NO.
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{update.update_no}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                  AUTHORITY / COURT
                </span>
                <span className="font-semibold text-amber-900">{update.authority_name} ({update.authority_code})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                  DATE OF ISSUE
                </span>
                <span className="font-semibold text-slate-900">{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                  PRACTICE AREA
                </span>
                <span className="font-semibold text-slate-900">{update.category_name}</span>
              </div>
            </div>

            {/* Document Subject Box */}
            <div className="mt-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-300 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                SUBJECT / STATUTORY NOTIFICATION
              </span>
              <p className="text-base sm:text-lg font-serif font-bold text-slate-950 leading-snug">
                {update.title}
              </p>
            </div>
          </div>

          {/* ── SECTION 1: FACTS ── */}
          <section className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-black text-amber-400 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-wide uppercase">
                FACTS & BACKGROUND SUMMARY
              </h3>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm pl-8">
              {update.facts || 'No factual details provided.'}
            </div>
          </section>

          {/* ── SECTION 2: REFERENCE SECTIONS / LEGAL PROVISIONS ── */}
          <section className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-black text-amber-400 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-wide uppercase">
                STATUTORY PROVISIONS & LEGAL CITATIONS
              </h3>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm pl-8">
              {update.legal_provisions || 'No legal provisions listed.'}
            </div>

            {/* Citation references if available */}
            {update.references && update.references.length > 0 && (
              <div className="ml-8 mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs rounded-lg overflow-hidden">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-700">Act / Statute</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-700">Section / Rule</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-700">Case / Circular Ref</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-slate-700">Official Citation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {update.references.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 font-medium text-slate-900">{r.act_name}</td>
                        <td className="px-3 py-1.5 text-slate-700">{r.section || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-700">{r.circular_or_case_ref || '—'}</td>
                        <td className="px-3 py-1.5 text-amber-800 font-mono">{r.citation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 3: DECISION / LEGAL DEVELOPMENT ── */}
          <section className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-black text-amber-400 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-wide uppercase">
                OPERATIVE RULING & LEGAL DEVELOPMENT
              </h3>
            </div>
            <div className="bg-slate-50 border-l-4 border-slate-900 p-4 rounded-r-xl text-slate-800 leading-relaxed whitespace-pre-line text-sm ml-8">
              {update.decision_development || 'No decision summary available.'}
            </div>
          </section>

          {/* ── SECTION 4: CONCLUSION & PROFESSIONAL IMPLICATIONS ── */}
          <section className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-amber-950 tracking-wide uppercase">
                CONCLUSION & PROFESSIONAL IMPLICATION (FOR CA / CS / CMA / ADVOCATES)
              </h3>
            </div>
            <div className="bg-amber-50/70 border-l-4 border-amber-600 p-4 rounded-r-xl text-amber-950 leading-relaxed whitespace-pre-line text-sm ml-8">
              {update.conclusion_implications || 'No implications recorded.'}
            </div>
          </section>

          {/* ── SECTION 5: ORIGINAL SOURCE & REFERENCE ── */}
          <section className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-black text-amber-400 flex items-center justify-center font-bold text-xs">
                5
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-wide uppercase">
                ORIGINAL SOURCE REFERENCE & AUTHENTICATION
              </h3>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm pl-8">
              {update.original_references || 'No source references recorded.'}
            </div>

            {update.original_url && (
              <div className="pl-8 pt-1">
                <a
                  href={update.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-semibold underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 print:hidden" />
                  <span>Access Official Gazette / Source Document: {update.original_url}</span>
                </a>
              </div>
            )}
          </section>

          {/* ── EDITORIAL VERIFICATION & LEGAL SIGN-OFF FOOTER ── */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl print-avoid-break">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-slate-950 block text-xs">
                  VERIFIED STATUTORY PRECEDENT
                </span>
                <span className="text-[11px] text-slate-600">
                  {update.verified_by
                    ? `Vetted & Certified by: ${update.verified_by}`
                    : 'Certified & Published by Editorial Board, Manish Khandelwal & Co.'}
                </span>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-500 font-mono space-y-0.5">
              {update.file_hash_sha256 && (
                <p>
                  <span className="text-slate-400">INTEGRITY SHA-256: </span>
                  <span className="text-slate-700 font-bold">{update.file_hash_sha256.slice(0, 24)}...</span>
                </p>
              )}
              <p className="text-slate-400 font-sans">
                Permanent Ref: {typeof window !== 'undefined' ? `${window.location.origin}/bulletin/${update.category_slug}/${update.slug}` : ''}
              </p>
              <p className="text-slate-400 font-sans italic text-[9px]">
                Strictly for professional advisory & legal compliance reference.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
