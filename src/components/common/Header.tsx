import React from 'react';
import { CatHead } from './CatMascot';
import { BookOpen, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenCover: () => void;
  onOpenTutorial?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenCover,
  onOpenTutorial,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF5] px-3.5 py-2 border-b border-[#1E293B]/10 flex items-center justify-between shadow-2xs min-w-0">
      {/* Brand & Mascot */}
      <div
        className="flex items-center gap-2 cursor-pointer group min-w-0 flex-1 mr-2"
        onClick={onOpenCover}
        title="View NYC Ledger Story Cover"
      >
        <div className="flex-shrink-0 transition-transform group-hover:scale-105 active:scale-95">
          <CatHead size={36} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <h1
              className="font-extrabold text-[#1E293B] text-base sm:text-lg tracking-tight leading-none whitespace-nowrap"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              NYC Ledger
            </h1>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-300 whitespace-nowrap flex-shrink-0 leading-none"
              title="100% Offline & Private"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Offline</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold text-stone-500 tracking-wide mt-0.5 whitespace-nowrap truncate leading-tight">
            NYC Smart Expense Manager
          </p>
        </div>
      </div>

      {/* Right Actions: Guide & Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap text-xs"
            title="Beginner Tutorial Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span className="hidden sm:inline font-black" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Guide
            </span>
          </button>
        )}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#1E293B] border border-stone-200 hover:border-[#1E293B] transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap text-xs"
          title="Profile & Settings"
        >
          <Settings className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />
          <span className="hidden sm:inline font-black" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Settings
          </span>
        </button>
      </div>
    </header>
  );
};
