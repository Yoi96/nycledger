import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { CatHead } from '../common/CatMascot';

interface SplashCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const SplashCoverModal: React.FC<SplashCoverModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FDFBF5] rounded-3xl border-3 border-[#1E293B] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Clean Header Bar */}
        <div className="px-4 py-3 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-amber-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CatHead size={26} />
            <span
              className="text-base font-black text-[#1E293B]"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              NYC Ledger
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold border border-amber-300">
              Cover Art
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center border-2 border-[#1E293B] shadow-2xs transition-transform active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        {/* Scrollable contents */}
        <div className="overflow-y-auto flex flex-col p-4 space-y-3 text-center">
          {/* Full-bleed Block Image Container with true uncropped ratio */}
          <div className="relative w-full rounded-2xl border-3 border-[#1E293B] shadow-[0_6px_0_#1E293B] bg-[#FFF8EB] overflow-hidden max-h-[50vh] flex items-center justify-center p-1">
            <img
              src="/cover.jpg"
              alt="NYC Ledger Cover Artwork"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(false)}
              className={`w-auto max-h-[48vh] max-w-full rounded-xl object-contain object-center transition-all duration-300 ${
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FFF8EB]">
                <CatHead size={56} />
                <span className="text-xs font-bold text-stone-600">Loading cover artwork...</span>
              </div>
            )}
          </div>

          {/* Subtitle Info under the block */}
          <div className="text-[10px] font-black text-[#1E293B] py-0.5">
            <span>Leo the NYC Cat • Manhattan Skyline • Offline Smart Ledger</span>
          </div>

          {/* Privacy statement */}
          <div className="p-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="text-[11px] leading-snug">
              <strong className="font-black text-emerald-900 mr-1">Privacy Guarantee:</strong>
              100% offline data storage on your device with zero tracking.
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-0.5">
            <button
              onClick={onStart}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FCCE4C] hover:bg-[#ebd05a] border-3 border-[#1E293B] text-[#1E293B] font-black text-sm sm:text-base shadow-[0_4px_0_#1E293B] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter NYC Ledger</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
