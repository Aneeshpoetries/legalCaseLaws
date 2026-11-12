import React, { useState, useEffect } from 'react';
import {
  Scale,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  Lock,
  LogOut,
  FileText,
  Info,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import type { Category } from '../types.ts';

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onOpenSearch: () => void;
  onOpenDailyBulletin: () => void;
  onOpenAbout: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenSearch,
  onOpenDailyBulletin,
  onOpenAbout,
  onOpenAdmin,
  isAdminLoggedIn,
  onLogoutAdmin,
}) => {
  const [kolkataTime, setKolkataTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setKolkataTime(now.toLocaleString('en-IN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#0b172a] text-white border-b border-[#c29b38]/30">
      {/* Top Utility Editorial Ribbon */}
      <div className="bg-[#070e1b] border-b border-slate-800 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium tracking-wide">
              <Scale className="w-3.5 h-3.5" />
              MANISH KHANDELWAL & CO.
            </span>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>IST (Asia/Kolkata): {kolkataTime || 'Loading...'}</span>
            </span>
            <span className="hidden lg:inline-block text-slate-500">|</span>
            <span className="hidden lg:flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Verified Legal Research
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAbout}
              className="text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Editorial Board</span>
            </button>

            <span className="text-slate-600">|</span>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdmin}
                  className="bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-semibold px-2.5 py-0.5 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Console</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="Sign out"
                  className="text-slate-400 hover:text-red-400 transition-colors p-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-950/40 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b172a] rounded-[10px] flex items-center justify-center">
                <Scale className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" />
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-amber-400 font-semibold mb-0.5">
                Official Law & Tax Intelligence
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
                MK PROFESSIONAL LEGAL BULLETIN
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Published Daily by{' '}
                <span className="font-semibold text-slate-100">Manish Khandelwal & Co.</span>{' '}
                • Automated Regulatory Monitoring & Structured Legal Precedents
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDailyBulletin}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 text-sm tracking-wide"
            >
              <FileText className="w-4 h-4" />
              <span>Daily Circulation</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Search updates"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Search Index</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden bg-slate-800 p-2.5 rounded-lg text-slate-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Category Navigation Ribbon */}
      <nav className="bg-[#0f1f38] border-t border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 min-w-max py-1.5">
          <button
            onClick={() => {
              onSelectCategory('');
              setMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              selectedCategory === ''
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Updates
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                {cat.published_updates_count !== undefined && cat.published_updates_count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-900 text-amber-300' : 'bg-slate-700/60 text-slate-300'
                    }`}
                  >
                    {cat.published_updates_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3">
          <p className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
            Browse Legal Categories
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSelectCategory('');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded text-left text-xs ${
                selectedCategory === '' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              All Jurisdictions
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded text-left text-xs ${
                  selectedCategory === cat.slug ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
