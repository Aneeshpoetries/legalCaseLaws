import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  Scale,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api.ts';
import type { LegalUpdate } from '../types.ts';

interface DailyBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUpdate: (update: LegalUpdate) => void;
}

export const DailyBulletinModal: React.FC<DailyBulletinModalProps> = ({
  isOpen,
  onClose,
  onSelectUpdate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [bulletinData, setBulletinData] = useState<{
    date: string;
    totalUpdates: number;
    updates: LegalUpdate[];
    categoryGroups: Array<{ category: string; slug: string; items: LegalUpdate[] }>;
    authorityGroups: Array<{ authority: string; code: string; items: LegalUpdate[] }>;
    publisher: string;
  } | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'category' | 'authority'>('category');

  useEffect(() => {
    if (isOpen) {
      loadBulletin(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const loadBulletin = async (date: string) => {
    setLoading(true);
    try {
      const data = await api.getDailyBulletin(date);
      setBulletinData(data);
    } catch (err) {
      console.error('Failed to load daily bulletin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Daily-Bulletin-${selectedDate}-MK-Legal`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  if (!isOpen) return null;

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="printable-daily-bulletin"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 printable-modal-backdrop"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col printable-modal-box">

        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-[#0b172a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white">Daily Legal Bulletin</h2>
              <p className="text-xs text-amber-300">Automated Daily Circulation • Manish Khandelwal & Co.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs"
              />
            </div>

            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setViewGrouping('category')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewGrouping === 'category' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewGrouping('authority')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewGrouping === 'authority' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
                }`}
              >
                By Authority
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print formatted Daily Bulletin or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>Print Edition</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-7 printable-scroll-body print:p-0 print:space-y-5">

          {/* ── LAW FIRM LETTERHEAD / MASTHEAD ── */}
          <div className="text-center border-b-2 border-slate-900 pb-5 print-avoid-break">
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
                  Daily Regulatory Circulation
                </p>
                <p className="text-amber-800 font-medium font-mono text-[10px] mt-0.5">
                  Official Gazette & Court Digest
                </p>
                <p className="text-slate-400 text-[10px]">Timezone: Asia/Kolkata (IST)</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-tight">
              MK PROFESSIONAL LEGAL BULLETIN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 uppercase tracking-widest mt-1 font-semibold">
              Daily Regulatory Digest & Judicial Summary
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span>Edition Date: <strong>{formattedDate}</strong></span>
              <span>•</span>
              <span>Total Verified Updates: <strong>{bulletinData?.totalUpdates || 0}</strong></span>
              <span>•</span>
              <span>Publisher: <strong>Manish Khandelwal & Co.</strong></span>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Collating official daily circulars and judgments...</p>
            </div>
          ) : bulletinData && bulletinData.totalUpdates === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-800">
                No verified new updates published on {formattedDate}.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our automated regulatory collectors continually scan CBDT, CBIC, MCA, IBBI, SEBI, RBI, and high court registries. You can inspect previous editions by selecting an earlier date in the calendar above.
              </p>
              <button
                onClick={() => setSelectedDate('2026-11-04')}
                className="mt-2 text-xs bg-amber-500 text-slate-950 font-semibold px-3 py-1.5 rounded-md hover:bg-amber-400 transition-colors print:hidden"
              >
                View 04 November 2026 Edition
              </button>
            </div>
          ) : (
            /* Content Groupings */
            <div className="space-y-7">
              {viewGrouping === 'category' ? (
                bulletinData?.categoryGroups.map((group, idx) => (
                  <section key={idx} className="space-y-3.5 print-avoid-break">
                    <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <h3 className="text-base font-serif font-bold text-slate-900 uppercase tracking-wide">
                        {group.category}
                      </h3>
                      <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full ml-auto">
                        {group.items.length} {group.items.length === 1 ? 'Update' : 'Updates'}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onSelectUpdate(item)}
                          className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-400 transition-all cursor-pointer shadow-xs print:bg-white print:border-slate-300 print-avoid-break"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded">
                                {item.update_no}
                              </span>
                              <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                {item.authority_code}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{item.issue_date}</span>
                          </div>

                          <h4 className="font-serif font-bold text-slate-950 text-base mb-2">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-3 mb-2 leading-relaxed">
                            {item.decision_development?.replace(/^[•\d\.\s]+/gm, '') || item.facts}
                          </p>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-amber-700 font-semibold print:hidden">
                            <span>Read 5-Part Structured Research</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                bulletinData?.authorityGroups.map((group, idx) => (
                  <section key={idx} className="space-y-3.5 print-avoid-break">
                    <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1.5">
                      <Building2 className="w-4 h-4 text-amber-700" />
                      <h3 className="text-base font-serif font-bold text-slate-900 uppercase tracking-wide">
                        {group.authority} ({group.code})
                      </h3>
                      <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full ml-auto">
                        {group.items.length} {group.items.length === 1 ? 'Notification' : 'Notifications'}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onSelectUpdate(item)}
                          className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-400 transition-all cursor-pointer shadow-xs print:bg-white print:border-slate-300 print-avoid-break"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded">
                              {item.update_no}
                            </span>
                            <span className="text-xs text-slate-500">{item.issue_date}</span>
                          </div>

                          <h4 className="font-serif font-bold text-slate-950 text-base mb-2">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-3 mb-2 leading-relaxed">
                            {item.decision_development?.replace(/^[•\d\.\s]+/gm, '') || item.facts}
                          </p>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-amber-700 font-semibold print:hidden">
                            <span>Read 5-Part Structured Research</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}

          {/* Bulletin Footer */}
          <div className="border-t-2 border-slate-900 pt-5 text-center text-xs text-slate-500 print-avoid-break">
            <p className="font-serif font-bold text-slate-900">
              MK PROFESSIONAL LEGAL BULLETIN • PUBLISHED BY MANISH KHANDELWAL & CO.
            </p>
            <p className="mt-0.5 text-[11px]">
              For professional advisory and representation queries, contact: legal@mklegal.in
            </p>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Circulated for corporate compliance, chartered accountants, company secretaries, insolvency professionals & advocates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
