import React, { useState } from 'react';
import {
  Calendar,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { LegalUpdate } from '../types.ts';

interface UpdateCardProps {
  update: LegalUpdate;
  onSelect: (update: LegalUpdate) => void;
  featured?: boolean;
}

export const UpdateCard: React.FC<UpdateCardProps> = ({ update, onSelect, featured = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `${update.title} [Ref: ${update.update_no}, Published by Manish Khandelwal & Co., Dated ${update.issue_date}]`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(update.issue_date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      onClick={() => onSelect(update)}
      className={`group cursor-pointer rounded-2xl bg-white border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden ${
        featured
          ? 'border-amber-300 shadow-md ring-1 ring-amber-200 lg:col-span-2'
          : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
    >
      <div className="p-5">
        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black text-amber-400 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg tracking-wide">
              {update.update_no}
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-lg">
              {update.authority_code}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-lg">
              {update.category_name}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-bold text-gray-900 group-hover:text-black transition-colors leading-snug mb-3 ${
            featured ? 'text-xl sm:text-2xl' : 'text-base'
          }`}
        >
          {update.title}
        </h3>

        {/* Preview */}
        <div className="space-y-2.5 text-sm text-gray-600 mb-2">
          {update.decision_development && (
            <div className="border-l-2 border-amber-500 pl-3 py-1 bg-amber-50/50 rounded-r-lg">
              <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wide mb-1">
                Operative Ruling:
              </span>
              <p className="line-clamp-2 text-gray-600 leading-relaxed text-xs">
                {update.decision_development.replace(/^[•\d\.\s]+/gm, '')}
              </p>
            </div>
          )}

          {featured && update.conclusion_implications && (
            <div className="border-l-2 border-black pl-3 py-1 bg-gray-50 rounded-r-lg">
              <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wide mb-1">
                Professional Implication for CA / CS / CMA:
              </span>
              <p className="line-clamp-2 text-gray-600 leading-relaxed text-xs">
                {update.conclusion_implications.replace(/^[•\d\.\s]+/gm, '')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg font-medium text-[11px] border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </span>
          {update.view_count !== undefined && (
            <span className="hidden sm:inline text-gray-400">{update.view_count} reads</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCitation}
            className="hover:text-black p-1.5 rounded-lg transition-colors text-gray-400 flex items-center gap-1"
            title="Copy Legal Citation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 text-[11px] font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cite</span>
              </>
            )}
          </button>

          <span className="text-black font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
            <span>Read 5-Part Note</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
