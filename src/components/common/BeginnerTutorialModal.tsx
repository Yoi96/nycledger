import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CreditCard,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Percent,
  CheckSquare,
  Rocket,
  Compass,
} from 'lucide-react';
import { CatHead } from './CatMascot';
import { FastfoodVector } from './CategoryIcon';

interface BeginnerTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLogging?: () => void;
}

export const BeginnerTutorialModal: React.FC<BeginnerTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartLogging,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('nyc_ledger_tutorial_seen_v1', 'true');
    } catch {}
    onClose();
  };

  const handleRecordFirst = () => {
    try {
      localStorage.setItem('nyc_ledger_tutorial_seen_v1', 'true');
    } catch {}
    onClose();
    onStartLogging?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FDFBF5] rounded-3xl border-3 border-[#1E293B] shadow-[0_8px_0_#1E293B] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-4 py-3 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-amber-50/70 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CatHead size={24} />
            <span
              className="text-base font-black text-[#1E293B]"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              NYC Ledger Guide
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold border border-amber-300">
              Step {currentStep}/{totalSteps}
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-stone-100 text-stone-600 hover:text-[#1E293B] text-xs font-bold border border-stone-200 transition-colors cursor-pointer shadow-2xs"
            title="Skip Tutorial"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* STEP 1: Welcome & Fresh Slate */}
          {currentStep === 1 && (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-20 h-20 mx-auto flex items-center justify-center transform hover:scale-105 transition-transform">
                <CatHead size={72} />
              </div>

              <div>
                <h3
                  className="text-xl font-black text-[#1E293B] leading-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  Welcome to NYC Ledger! 🗽 🐾
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold leading-relaxed">
                  Your smart, 100% offline personal expense tracker built specifically for living in New York City.
                </p>
              </div>

              {/* Clean Slate Card */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-stone-200 text-left space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Fresh Blank Slate (Zero Sample Data)</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  All default sample transactions, test rides, and demo todos have been cleared. You start with a completely clean ledger ready for your real financial life!
                </p>
              </div>

              {/* Offline Privacy Guarantee */}
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-950 leading-snug">
                  <strong className="font-black text-emerald-900 block">100% Offline & Private</strong>
                  Data lives solely in your browser storage. Works without internet inside deep NYC subway stations.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rapid 1-Tap Expense Logging */}
          {currentStep === 2 && (
            <div className="space-y-3.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] flex items-center justify-center text-[#1E293B]">
                <Plus className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3
                  className="text-xl font-black text-[#1E293B] leading-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  1-Tap Expense & Income Logging
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold">
                  Recording spending shouldn't take more than a few seconds.
                </p>
              </div>

              {/* Presets showcase */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-stone-200 text-left space-y-2 shadow-2xs">
                <div className="text-[11px] font-black text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>NYC Quick Presets (1-Tap Record)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    ☕ Starbucks Coffee ($6.50)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-[11px] font-bold text-cyan-900 flex items-center gap-1">
                    🚇 Subway OMNY ($3.00)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-900 flex items-center gap-1">
                    <FastfoodVector size={13} color="#C2410C" /> Halal Cart ($8.50)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    💵 Tech Payroll Direct Deposit
                  </span>
                </div>
              </div>

              {/* Categories & Customization */}
              <div className="p-3 rounded-2xl bg-stone-50 border-2 border-stone-200 text-left space-y-1.5">
                <div className="text-[11px] font-bold text-stone-700">
                  🎨 Customizable Categories & AI Scanner
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Manage categories in Tools, or snap a photo of any paper receipt with the built-in offline camera OCR scanner.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: NYC Subway & OMNY Fare Cap */}
          {currentStep === 3 && (
            <div className="space-y-3.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-100 border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] flex items-center justify-center text-cyan-800">
                <CreditCard className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h3
                  className="text-xl font-black text-[#1E293B] leading-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  MTA OMNY Smart Fare Cap
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold">
                  Track your weekly subway rides and unlock 100% free rides.
                </p>
              </div>

              {/* Fare cap rule */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-cyan-300 text-left space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-950">MTA 7-Day Fare Cap Rule</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-900">
                    $3.00 / ride
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  When you tap <strong>12 times</strong> in a week, you automatically unlock <strong>FREE rides</strong>! You can customize your single ride ticket fee to match regular fares, express bus, student, or senior rates.
                </p>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                  <div className="bg-cyan-500 h-full rounded-full w-2/3" />
                </div>
                <div className="text-[10px] text-stone-400 font-bold flex justify-between">
                  <span>0 rides</span>
                  <span className="text-cyan-700 font-extrabold">12 rides = Free Cap 🎉</span>
                </div>
              </div>

              {/* Built-in Tool */}
              <div className="p-2.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-left text-[11px] text-amber-950">
                💡 <strong>OMNY Tool:</strong> Tap the OMNY button to view full Google Maps transit addresses, customize your ticket fee, and log rides with 1 tap!
              </div>
            </div>
          )}

          {/* STEP 4: NYC Survival Tools */}
          {currentStep === 4 && (
            <div className="space-y-3.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-200 border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] flex items-center justify-center text-[#1E293B]">
                <Sparkles className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h3
                  className="text-xl font-black text-[#1E293B] leading-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  NYC Practical Survival Tools
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold">
                  Handcrafted utilities tailored to daily life in New York City.
                </p>
              </div>

              {/* Tools List */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div className="font-black text-xs text-[#1E293B]">NYC Sales Tax</div>
                  <div className="text-[10px] text-stone-500 leading-tight">
                    8.875% tax calculator with clothing &lt;$110 0% tax exemption!
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="font-black text-xs text-[#1E293B]">Tip & Splitter</div>
                  <div className="text-[10px] text-stone-500 leading-tight">
                    Standard NYC dining tips (15%, 18%, 20%) & bill splitting.
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <FastfoodVector size={16} color="#92400E" />
                  </div>
                  <div className="font-black text-xs text-[#1E293B]">Quick Meals</div>
                  <div className="text-[10px] text-stone-500 leading-tight">
                    Curated budget NYC eats ($3.50 Joe's pizza, bodega bagels).
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border-2 border-stone-200 shadow-2xs space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div className="font-black text-xs text-[#1E293B]">NYC Planner</div>
                  <div className="text-[10px] text-stone-500 leading-tight">
                    Daily tasks, routines, and subway errands checklist.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Ready to Begin! */}
          {currentStep === 5 && (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FCCE4C] border-3 border-[#1E293B] shadow-[0_4px_0_#1E293B] flex items-center justify-center text-[#1E293B]">
                <Rocket className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h3
                  className="text-2xl font-black text-[#1E293B] leading-tight"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  You're All Set! 🎉
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold leading-relaxed">
                  Your ledger is clean, empty, and waiting for your real-world NYC expenses.
                </p>
              </div>

              {/* Ready banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-1 shadow-2xs">
                <span className="text-xs font-black text-amber-950 block">
                  How would you like to start?
                </span>
                <p className="text-[11px] text-stone-600">
                  Tap below to record your first transaction right now, or explore the dashboard first.
                </p>
              </div>

              {/* Main Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleRecordFirst}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#FCCE4C] hover:bg-[#ebd05a] border-3 border-[#1E293B] text-[#1E293B] font-black text-sm shadow-[0_4px_0_#1E293B] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>Record First Expense / Income</span>
                </button>

                <button
                  onClick={handleComplete}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-700 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-stone-500" />
                  <span>Explore NYC Ledger Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-3 bg-stone-50 border-t-2 border-[#1E293B]/10 flex items-center justify-between flex-shrink-0">
          {/* Back button */}
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              return (
                <button
                  key={stepNum}
                  onClick={() => setCurrentStep(stepNum)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-6 bg-[#1E293B]'
                      : 'w-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Go to step ${stepNum}`}
                />
              );
            })}
          </div>

          {/* Next button */}
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded-xl bg-[#FCCE4C] hover:bg-[#ebd05a] text-[#1E293B] border-2 border-[#1E293B] shadow-2xs text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>
    </div>
  );
};
