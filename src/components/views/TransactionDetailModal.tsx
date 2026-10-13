import React, { useState } from 'react';
import { Transaction } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import { NYCSkyline } from '../common/CatMascot';
import {
  X,
  CreditCard,
  Tag,
  Store,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  Receipt,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onDelete,
  onEdit,
}) => {
  const [isViewingImage, setIsViewingImage] = useState(false);
  if (!isOpen || !transaction) return null;

  const catMeta = CATEGORIES[transaction.category] || CATEGORIES.miscellaneous;
  const isExpense = transaction.type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FDFBF5] rounded-3xl border-3 border-[#1E293B] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1E293B]/10 flex items-center justify-between">
          <span
            className="text-xs font-black text-stone-500 uppercase tracking-wider"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Transaction Details
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors border border-stone-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main Hero Card with Icon & Amount */}
          <div className="relative rounded-3xl bg-white border-2 border-[#1E293B]/20 p-5 text-center shadow-xs overflow-hidden">
            <div className="absolute right-0 bottom-0 w-44 h-20 opacity-25 pointer-events-none">
              <NYCSkyline className="w-full h-full text-stone-600" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl border-2 border-[#1E293B]/20 ${catMeta.iconBg} shadow-xs mb-2 overflow-hidden`}
              >
                <CategoryIcon emoji={catMeta.emoji} iconUrl={catMeta.iconUrl} size={32} color={catMeta.color} />
              </div>

              <h2
                className="text-xl font-extrabold text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {transaction.merchant}
              </h2>
              <span className="text-xs font-bold text-stone-400">
                {transaction.categoryName}
              </span>

              <div
                className={`text-3xl font-black mt-2 tracking-tight ${
                  isExpense ? 'text-rose-500' : 'text-emerald-600'
                }`}
                style={{ fontFamily: 'Fredoka, monospace' }}
              >
                {isExpense ? '-' : '+'}${transaction.amount.toFixed(2)}
              </div>

              <div className="text-xs font-semibold text-stone-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {transaction.date} {transaction.time || ''}
              </div>

              {transaction.scannedByAI && (
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Scanned & Logged by Local AI
                </div>
              )}
            </div>
          </div>

          {/* Details Table Rows */}
          <div className="space-y-2 bg-white rounded-2xl border-2 border-stone-200/80 p-3.5 divide-y divide-stone-100">
            {/* Payment Method */}
            <div className="pt-2 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <CreditCard className="w-4 h-4 text-stone-400" />
                Payment Method
              </div>
              <span className="font-extrabold text-[#1E293B]">
                {transaction.paymentMethod}
              </span>
            </div>

            {/* Category */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Tag className="w-4 h-4 text-stone-400" />
                Category
              </div>
              <span className="font-extrabold text-[#1E293B]">
                {transaction.categoryName}
              </span>
            </div>

            {/* Merchant */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Store className="w-4 h-4 text-stone-400" />
                Merchant
              </div>
              <span className="font-extrabold text-[#1E293B]">
                {transaction.merchant}
              </span>
            </div>

            {/* Location */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <MapPin className="w-4 h-4 text-stone-400" />
                Location
              </div>
              <span className="font-extrabold text-[#1E293B]">
                {transaction.location || 'New York, NY'}
              </span>
            </div>

            {/* Sales Tax */}
            {typeof transaction.tax === 'number' && transaction.tax > 0 && (
              <div className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-500 font-semibold">
                  <Receipt className="w-4 h-4 text-stone-400" />
                  Sales Tax
                </div>
                <span className="font-extrabold text-[#1E293B]">
                  ${transaction.tax.toFixed(2)}
                </span>
              </div>
            )}

            {/* Tips / Gratuity */}
            {typeof transaction.tips === 'number' && transaction.tips > 0 && (
              <div className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-500 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Tips / Gratuity
                </div>
                <span className="font-extrabold text-[#1E293B]">
                  ${transaction.tips.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Detected Item Breakdown */}
          {transaction.detectedItems && transaction.detectedItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-200/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>Itemized Breakdown ({transaction.detectedItems.length} items):</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-0.5">
                {transaction.detectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-white/90 rounded-xl border border-amber-200 text-xs text-stone-800">
                    <span
                      className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ fontFamily: 'Fredoka, sans-serif' }}
                    >
                      Item {idx + 1}
                    </span>
                    <span className="font-bold flex-1 text-left truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached Receipt Image if any */}
          {transaction.receiptImage && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-500">Attached Receipt (Tap to preview)</span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  Preview
                </span>
              </div>
              <div
                onClick={() => setIsViewingImage(true)}
                className="group relative rounded-2xl overflow-hidden border-2 border-stone-200 max-h-52 bg-stone-100 flex items-center justify-center cursor-pointer hover:border-[#1E293B] transition-colors"
                title="Tap to preview receipt"
              >
                <img
                  src={transaction.receiptImage}
                  alt="Receipt"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                  <span>Tap to preview</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Lightbox */}
          {isViewingImage && transaction.receiptImage && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-md animate-in fade-in duration-200">
              <div className="relative max-w-2xl max-h-[90vh] bg-stone-950 p-2 rounded-3xl border-3 border-stone-700 shadow-2xl flex flex-col items-center">
                <button
                  onClick={() => setIsViewingImage(false)}
                  className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full bg-white text-stone-900 flex items-center justify-center border-2 border-[#1E293B] shadow-lg active:scale-95 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={transaction.receiptImage}
                  alt="Receipt Full Preview"
                  className="max-h-[82vh] max-w-full rounded-2xl object-contain"
                />
              </div>
            </div>
          )}

          {/* Note */}
          {transaction.note && (
            <div className="p-3 rounded-2xl bg-white border border-stone-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-stone-400 font-bold text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                Note
              </div>
              <p className="text-stone-700 font-medium">{transaction.note}</p>
            </div>
          )}

          {/* Action Buttons: Delete & Edit */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => {
                if (window.confirm('Permanently delete this transaction? (100% local deletion)')) {
                  onDelete(transaction.id);
                  onClose();
                }
              }}
              className="py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs border-2 border-rose-200 transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>

            <button
              onClick={() => {
                onEdit(transaction);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-[#FCCE4C] hover:bg-[#FBBF24] text-[#1E293B] font-black text-sm border-2 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
