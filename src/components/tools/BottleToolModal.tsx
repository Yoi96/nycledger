import React, { useState } from 'react';
import { X, Sparkles, Plus, Wine, DollarSign, CheckCircle2 } from 'lucide-react';
import { LocalDB } from '../../services/storage';
import confetti from 'canvas-confetti';

interface BottleToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export const BottleToolModal: React.FC<BottleToolModalProps> = ({
  isOpen,
  onClose,
  onLogged,
}) => {
  const [count, setCount] = useState<number>(20);

  if (!isOpen) return null;

  const totalReturn = +(count * 0.05).toFixed(2);

  const handleLogIncome = () => {
    if (totalReturn <= 0) return;
    LocalDB.addTransaction({
      type: 'income',
      amount: totalReturn,
      category: 'income',
      categoryName: 'Income',
      merchant: 'NYC Bottle Deposit Return',
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'Cash',
      location: 'NYC Supermarket Machine',
      note: `Returned ${count} bottles/cans at 5¢ each`,
      scannedByAI: true,
      detectedItems: [`${count}x Returnable Beverage Containers (5¢ NY Deposit)`],
    });
    confetti({ particleCount: 40, spread: 60 });
    onLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto h-full">
        {/* Header */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-emerald-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Wine className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Bottle Tool
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                NYC 5¢ Bottle & Can Deposit Return Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
            aria-label="Close Bottle Tool"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
            💡 <strong>NYS Bottle Bill Law:</strong>
            Carbonated beverage, beer, and water purchases include a 5¢ deposit. Bring empty containers to supermarket reverse vending machines to claim your instant cash return!
          </div>

          {/* Stepper Card */}
          <div className="p-5 rounded-3xl bg-white border-2 border-stone-200 text-center space-y-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
              Recycled Bottles & Cans Count
            </span>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCount((c) => Math.max(0, c - 5))}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 text-xl font-black text-stone-700 flex items-center justify-center active:scale-95"
              >
                -5
              </button>
              <button
                onClick={() => setCount((c) => Math.max(0, c - 1))}
                className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 text-xl font-black text-stone-700 flex items-center justify-center active:scale-95"
              >
                -1
              </button>

              <span
                className="text-4xl font-black text-[#1E293B] min-w-[70px]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {count}
              </span>

              <button
                onClick={() => setCount((c) => c + 1)}
                className="w-10 h-10 rounded-2xl bg-[#FCCE4C] hover:bg-amber-300 border-2 border-stone-900 text-xl font-black text-stone-900 flex items-center justify-center active:scale-95"
              >
                +1
              </button>
              <button
                onClick={() => setCount((c) => c + 5)}
                className="w-10 h-10 rounded-2xl bg-[#FCCE4C] hover:bg-amber-300 border-2 border-stone-900 text-xl font-black text-stone-900 flex items-center justify-center active:scale-95"
              >
                +5
              </button>
            </div>

            <div className="pt-2">
              <span className="text-xs text-stone-500 font-semibold block">Estimated Cash Refund:</span>
              <div
                className="text-3xl font-black text-emerald-600 mt-0.5"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                +${totalReturn.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {[10, 24, 50].map((num) => (
              <button
                key={num}
                onClick={() => setCount(num)}
                className="py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:border-emerald-500 hover:text-emerald-700"
              >
                {num} Bottles (${(num * 0.05).toFixed(2)})
              </button>
            ))}
          </div>

          <button
            onClick={handleLogIncome}
            disabled={totalReturn <= 0}
            className="w-full py-3.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-black text-sm border-2 border-[#1E293B] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            <DollarSign className="w-4 h-4 text-emerald-800" />
            Record Bottle Deposit Income (+${totalReturn.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};
