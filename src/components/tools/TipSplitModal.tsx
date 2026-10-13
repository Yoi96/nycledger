import React, { useState } from 'react';
import { X, Users, DollarSign, Plus, Percent } from 'lucide-react';
import { LocalDB } from '../../services/storage';

interface TipSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export const TipSplitModal: React.FC<TipSplitModalProps> = ({
  isOpen,
  onClose,
  onLogged,
}) => {
  const [billStr, setBillStr] = useState<string>('80');
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [people, setPeople] = useState<number>(2);
  const [restaurantName, setRestaurantName] = useState<string>('SoHo Bistro');

  if (!isOpen) return null;

  const bill = parseFloat(billStr) || 0;
  const tipAmount = +(bill * (tipPercent / 100)).toFixed(2);
  const total = +(bill + tipAmount).toFixed(2);
  const perPerson = +(total / Math.max(1, people)).toFixed(2);

  const handleLogMyShare = () => {
    if (perPerson <= 0) return;
    LocalDB.addTransaction({
      type: 'expense',
      amount: perPerson,
      category: 'food_beverages',
      categoryName: 'Food and Beverages',
      merchant: restaurantName.trim() || 'NYC Dining & Tip',
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'Credit Card',
      location: 'New York, NY',
      note: `Total Bill: $${bill.toFixed(2)} + ${tipPercent}% Tip: $${tipAmount.toFixed(2)}, Split ${people} ways`,
      scannedByAI: true,
      detectedItems: [`Dining share (${people} persons split): $${perPerson.toFixed(2)}`],
    });
    onLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto h-full">
        {/* Header */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-cyan-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Tip Split Tool
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                NYC Dining Tip Calculator & Bill Splitter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
            aria-label="Close Tip Split Tool"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-stone-200">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Restaurant / Venue
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#FCCE4C]"
                placeholder="e.g. Joe's Pizza / Chelsea Market"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Bill Amount (Pre/Post Tax)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-stone-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={billStr}
                  onChange={(e) => setBillStr(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xl font-black text-stone-800 focus:outline-none focus:border-[#FCCE4C]"
                  style={{ fontFamily: 'Fredoka, monospace' }}
                />
              </div>
            </div>

            {/* Tip Percentage Buttons */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Standard NYC Tip Percentage (Tip %)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 18, 20, 22].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTipPercent(p)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      tipPercent === p
                        ? 'bg-[#1E293B] text-white shadow-xs'
                        : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* People Stepper */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Split Among Persons
              </label>
              <div className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-200">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 pl-2">
                  <Users className="w-4 h-4 text-stone-500" />
                  {people} {people === 1 ? 'person' : 'people'} split
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPeople((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-black text-stone-700 text-sm active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-black text-sm text-[#1E293B] w-6 text-center">
                    {people}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPeople((p) => p + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-black text-stone-700 text-sm active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Tip Total ({tipPercent}%):</span>
              <span className="font-bold text-stone-800">${tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Grand Total:</span>
              <span className="font-bold text-stone-800">${total.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-[#1E293B] block">
                  My Share:
                </span>
                <span className="text-[10px] text-stone-400">Equal split per person</span>
              </div>
              <span
                className="text-2xl font-black text-emerald-600"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                ${perPerson.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogMyShare}
            className="w-full py-3.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-black text-sm border-2 border-[#1E293B] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            <Plus className="w-4 h-4" />
            Log My Share Expense (${perPerson.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};
