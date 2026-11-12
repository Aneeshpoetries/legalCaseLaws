import React from 'react';
import { Scale, ShieldCheck, Clock, Mail, Phone, MapPin } from 'lucide-react';
import type { Category } from '../types.ts';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onOpenDailyBulletin: () => void;
  onOpenAbout: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenDailyBulletin,
  onOpenAbout,
  onOpenAdmin,
}) => {
  return (
    <footer className="w-full bg-[#070e1b] text-slate-300 border-t-2 border-[#c29b38]/40 print:hidden">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Credential */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-400 block">
                  MANISH KHANDELWAL & CO.
                </span>
                <span className="text-base font-serif font-bold text-white tracking-wide">
                  Legal Intelligence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Official regulatory intelligence and legal circulation portal published daily by Manish Khandelwal & Co., Advocates and Corporate Tax Advisors.
            </p>

            <div className="text-xs space-y-1.5 text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Structured 5-Part Verified Research</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Daily Circulation at 00:00 AM IST</span>
              </div>
            </div>
          </div>

          {/* Legal Categories (Dynamic) */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-serif font-bold text-amber-400 tracking-wider">
              Legal Domains
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectCategory(c.slug)}
                    className="hover:text-amber-300 transition-colors text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Services */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-serif font-bold text-amber-400 tracking-wider">
              Circulation Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenDailyBulletin}
                  className="hover:text-amber-300 transition-colors"
                >
                  Latest Daily Bulletin Edition
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAbout}
                  className="hover:text-amber-300 transition-colors"
                >
                  Editorial Board & Standards
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-amber-300 transition-colors"
                >
                  Administrator Portal
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Data Lifecycle: Midnight Asia/Kolkata Clean-up
                </span>
              </li>
            </ul>
          </div>

          {/* Firm Chambers Contact */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-serif font-bold text-amber-400 tracking-wider">
              Chambers & Inquiries
            </h4>
            <div className="text-xs text-slate-400 space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Advocates & Tax Counsel Chambers, Bar Council Chambers, New Delhi, India</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>bulletin@mklegal.in</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>+91 11 4982 7100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          <p>
            <strong>DISCLAIMER AS PER BAR COUNCIL OF INDIA RULES:</strong> As per the rules of the Bar Council of India, advocates are prohibited from soliciting work or advertising in any form. This bulletin is published strictly for academic legal intelligence, regulatory compliance information, and professional knowledge dissemination among corporate and tax practitioners. Nothing on this website constitutes legal advice or creates an advocate-client relationship.
          </p>
        </div>

        {/* Bottom Ribbon */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-3 border-t border-slate-900 pt-4">
          <p>
            © {new Date().getFullYear()} <strong>Manish Khandelwal & Co.</strong> All Rights Reserved. MK Professional Legal Bulletin.
          </p>
          <div className="flex items-center gap-4">
            <span>Verified Knowledge Base</span>
            <span>•</span>
            <span>Asia/Kolkata 00:00 IST Daemon Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
