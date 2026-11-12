import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Calendar,
  Layers,
  Building2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../api.ts';
import type { LegalUpdate } from '../types.ts';

interface DailyBulletinPageProps {
  onBack: () => void;
  onSelectUpdate: (update: LegalUpdate) => void;
}

export const DailyBulletinPage: React.FC<DailyBulletinPageProps> = ({
  onBack,
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
    loadBulletin(selectedDate);
  }, [selectedDate]);

  const loadBulletin = async (date: string) => {
    setLoading(true);
    try {
      const data = await api.getDailyBulletin(date);
      setBulletinData(data);
    } catch (err) {
      console.error('Failed to load daily bulletin:', err);
      setBulletinData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `MK-Daily-Legal-Bulletin-${selectedDate}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

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

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer"
            />
          </div>

          {/* Grouping Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewGrouping('category')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewGrouping === 'category' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setViewGrouping('authority')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewGrouping === 'authority' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              By Authority
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Masthead */}
          <div className="border-b-2 border-slate-950 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-amber-700 block mb-1">
                  Official Gazette &amp; Statutory Compilation
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-950 tracking-tight">
                  DAILY LEGAL &amp; REGULATORY BULLETIN
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Published by Manish Khandelwal &amp; Co.  Corporate Law, Direct Tax &amp; GST Intelligence
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg mb-1">
                  EDITION: {selectedDate}
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Total Statutory Actions: <strong className="text-slate-900">{bulletinData?.totalUpdates || 0}</strong>
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-500 mb-3" />
              <p>Compiling Daily Regulatory Dossier for {selectedDate}...</p>
            </div>
          ) : !bulletinData || bulletinData.totalUpdates === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="font-serif text-lg font-bold text-slate-800">No Statutory Actions Notified on {selectedDate}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No new circulars, notifications or judgments were gazetted for this date. Use the date picker above to review previous editions.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {(viewGrouping === 'category' ? bulletinData.categoryGroups : bulletinData.authorityGroups).map((group: any, idx: number) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    {viewGrouping === 'category' ? (
                      <Layers className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Building2 className="w-4 h-4 text-amber-600" />
                    )}
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-serif">
                      {viewGrouping === 'category' ? group.category : `${group.authority} (${group.code})`}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">({group.items.length})</span>
                  </div>

                  <div className="space-y-4">
                    {group.items.map((up: LegalUpdate) => (
                      <div
                        key={up.id}
                        onClick={() => onSelectUpdate(up)}
                        className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs mb-2">
                          <span className="font-mono font-bold text-slate-900">{up.update_no}</span>
                          <span className="text-slate-500">{up.issue_date}</span>
                        </div>

                        <h4 className="text-base font-serif font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug mb-3">
                          {up.title}
                        </h4>

                        {up.decision_development && (
                          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed mb-3">
                            {up.decision_development}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 text-slate-500">
                          <span>{up.authority_name}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                            <span>Read 5-Part Note</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer certification */}
          <div className="border-t-2 border-slate-200 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Official Daily Digest  Manish Khandelwal &amp; Co.</span>
            <span>Verified Legal Intelligence System</span>
          </div>
        </div>
      </div>
    </div>
  );
};
