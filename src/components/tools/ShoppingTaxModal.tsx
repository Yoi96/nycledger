import React, { useState } from 'react';
import { X, Calculator, ShoppingBag, Plus, Info, Check } from 'lucide-react';
import { LocalDB } from '../../services/storage';

interface ShoppingTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export const ShoppingTaxModal: React.FC<ShoppingTaxModalProps> = ({
  isOpen,
  onClose,
  onLogged,
}) => {
  const [basePriceStr, setBasePriceStr] = useState<string>('50');
  const [itemType, setItemType] = useState<'standard' | 'clothing'>('clothing');
  const [itemName, setItemName] = useState<string>('Uniqlo T-Shirt');

  if (!isOpen) return null;

  const basePrice = parseFloat(basePriceStr) || 0;

  // NYC clothing exemption: under $110 is 0% tax! Over $110 is 8.875%
  const isExempt = itemType === 'clothing' && basePrice < 110;
  const taxRate = isExempt ? 0 : 0.08875;
  const taxAmount = +(basePrice * taxRate).toFixed(2);
  const totalAmount = +(basePrice + taxAmount).toFixed(2);

  const handleSaveToLedger = () => {
    if (totalAmount <= 0) return;
    LocalDB.addTransaction({
      type: 'expense',
      amount: totalAmount,
      category: 'shopping',
      categoryName: 'Shopping',
      merchant: itemName.trim() || 'NYC Shopping',
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'Credit Card',
      location: 'New York, NY',
      note: `Base: $${basePrice.toFixed(2)}, Tax: $${taxAmount.toFixed(2)} (${isExempt ? 'Tax Exempt <$110' : '8.875% NYC Rate'})`,
      scannedByAI: true,
      detectedItems: [
        `${itemName} ($${basePrice.toFixed(2)})`,
        isExempt ? 'NYC Clothing Tax Exemption: $0.00' : `NYC Combined Tax 8.875%: $${taxAmount.toFixed(2)}`,
      ],
    });
    onLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto h-full">
        {/* Header */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-rose-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-800">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Shopping Tax Tool
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                NYC Sales Tax 8.875% & Clothing Exemption Calculator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
            aria-label="Close Shopping Tax Tool"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Exemption Policy Banner */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              NYC Special Rule: Clothing & Footwear &lt; $110 are Sales Tax Free!
            </div>
            <p className="text-[11px] text-stone-600">
              Individual clothing and footwear items under $110 are 100% exempt from NYC 8.875% sales tax. Items $110 or more are taxed at full rate.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-stone-200">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Item Description
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#FCCE4C]"
                placeholder="e.g. Uniqlo Hoodie / iPhone Charging Cable"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Pre-Tax Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-stone-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={basePriceStr}
                  onChange={(e) => setBasePriceStr(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-50 rounded-xl border border-stone-300 text-xl font-black text-stone-800 focus:outline-none focus:border-[#FCCE4C]"
                  style={{ fontFamily: 'Fredoka, monospace' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Item Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('clothing')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    itemType === 'clothing'
                      ? 'border-[#1E293B] bg-amber-50 text-[#1E293B]'
                      : 'border-stone-200 bg-white text-stone-500'
                  }`}
                >
                  👕 Clothing / Shoes (&lt;$110 Exempt)
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('standard')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    itemType === 'standard'
                      ? 'border-[#1E293B] bg-amber-50 text-[#1E293B]'
                      : 'border-stone-200 bg-white text-stone-500'
                  }`}
                >
                  📦 Standard Goods (8.875%)
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#1E293B] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold">Pre-Tax Price:</span>
              <span className="font-bold text-stone-800">${basePrice.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold flex items-center gap-1">
                NYC Sales Tax:
                {isExempt && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    Exempt
                  </span>
                )}
              </span>
              <span className={`font-bold ${isExempt ? 'text-emerald-600' : 'text-stone-800'}`}>
                +${taxAmount.toFixed(2)} {isExempt ? '(0%)' : '(8.875%)'}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#1E293B]">Final Total:</span>
              <span
                className="text-2xl font-black text-rose-600"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Log button */}
          <button
            onClick={handleSaveToLedger}
            className="w-full py-3 rounded-2xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-black text-sm border-2 border-[#1E293B] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            <Plus className="w-4 h-4" />
            Log Total Expense to Ledger (${totalAmount.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};
