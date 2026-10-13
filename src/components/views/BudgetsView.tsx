import React, { useState } from 'react';
import { BudgetConfig } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import { LocalDB } from '../../services/storage';
import { Plus, Edit2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface BudgetsViewProps {
  onBudgetUpdated?: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onBudgetUpdated }) => {
  const [budget, setBudget] = useState<BudgetConfig>(LocalDB.getBudget());
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [newTotalStr, setNewTotalStr] = useState(budget.monthlyTotal.toString());

  // Dynamically synchronize spending with actual transactions of current month
  const allTxs = LocalDB.getTransactions();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthExpenses = allTxs.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonthStr)
  );

  const categorySpentMap: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
  });

  const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalLeft = Math.max(0, budget.monthlyTotal - totalSpent);
  const totalUsedPercent = Math.min(100, Math.round((totalSpent / budget.monthlyTotal) * 100));

  const handleSaveTotal = () => {
    const val = parseFloat(newTotalStr);
    if (!isNaN(val) && val > 0) {
      const updated: BudgetConfig = {
        ...budget,
        monthlyTotal: val,
      };
      LocalDB.saveBudget(updated);
      setBudget(updated);
      setIsEditingTotal(false);
      onBudgetUpdated?.();
    }
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-black text-[#1E293B]"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Budgets
        </h2>
        <button
          onClick={() => setIsEditingTotal(true)}
          className="w-8 h-8 rounded-full bg-white border-2 border-stone-200 text-stone-700 hover:border-[#1E293B] flex items-center justify-center transition-colors shadow-xs"
          title="Adjust Budget"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Budget Card matching screenshot 7 */}
      <div className="p-5 rounded-3xl bg-white border-2 border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-black text-stone-400 uppercase tracking-wider block"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Monthly Budget
          </span>
          <button
            onClick={() => setIsEditingTotal(!isEditingTotal)}
            className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 font-bold"
          >
            <Edit2 className="w-3 h-3" />
            Edit Amount
          </button>
        </div>

        {isEditingTotal ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={newTotalStr}
              onChange={(e) => setNewTotalStr(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border-2 border-stone-300 font-black text-xl text-[#1E293B]"
            />
            <button
              onClick={handleSaveTotal}
              className="px-3 py-1.5 bg-[#FCCE4C] border border-[#1E293B] rounded-xl font-bold text-xs"
            >
              Save
            </button>
          </div>
        ) : (
          <div
            className="text-3xl font-black text-[#1E293B] tracking-tight"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            ${budget.monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-stone-100 border border-stone-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalUsedPercent > 90
                ? 'bg-rose-500'
                : totalUsedPercent > 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${totalUsedPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-extrabold text-stone-600">
          <span className="text-emerald-700">${totalLeft.toFixed(2)} left</span>
          <span className="text-stone-400">{totalUsedPercent}% used</span>
        </div>
      </div>

      {/* Categories Budget Breakdown matching screenshot 7 */}
      <div className="space-y-2.5">
        <h3
          className="text-xs font-black text-stone-400 uppercase tracking-wider px-1"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Categories
        </h3>

        <div className="space-y-2.5">
          {budget.categories.map((cat) => {
            const meta = CATEGORIES[cat.categoryId] || CATEGORIES.other;
            const actualSpent = categorySpentMap[cat.categoryId] || 0;
            const percent = Math.min(100, Math.round((actualSpent / cat.budget) * 100));

            return (
              <div
                key={cat.categoryId}
                className="p-3.5 rounded-2xl bg-white border-2 border-stone-200/90 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${meta.iconBg} border-stone-200 overflow-hidden`}
                    >
                      <CategoryIcon emoji={meta.emoji} iconUrl={meta.iconUrl} size={20} color={meta.color} />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#1E293B]">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-stone-400 font-semibold">
                        {percent}% budget spent
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-[#1E293B]">
                      ${actualSpent.toFixed(0)} / ${cat.budget.toFixed(0)}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400 ml-2">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Individual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
