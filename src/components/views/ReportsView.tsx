import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';

interface ReportsViewProps {
  transactions: Transaction[];
  onExportCSV: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  onExportCSV,
}) => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');

  const income = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const expense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = income - expense;

  const topSpending = useMemo(() => {
    const map: Record<string, { name: string; amount: number; emoji: string }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = CATEGORIES[t.category] || CATEGORIES.other;
        if (!map[t.category]) {
          map[t.category] = { name: cat.name, amount: 0, emoji: cat.emoji };
        }
        map[t.category].amount += t.amount;
      });

    return Object.entries(map)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="space-y-4 pb-24 px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-black text-[#1E293B]"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Reports
        </h2>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-stone-200 hover:border-[#1E293B] text-xs font-bold text-stone-700 shadow-xs"
          title="Export CSV Spreadsheet"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Export CSV
        </button>
      </div>

      {/* Monthly / Yearly Switch */}
      <div className="p-1 rounded-2xl bg-stone-200/80 flex gap-1">
        <button
          onClick={() => setReportType('monthly')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            reportType === 'monthly'
              ? 'bg-[#FCCE4C] text-[#1E293B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Monthly Report
        </button>
        <button
          onClick={() => setReportType('yearly')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            reportType === 'yearly'
              ? 'bg-[#FCCE4C] text-[#1E293B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Yearly Report
        </button>
      </div>

      {/* Month Navigator matching screenshot 9 */}
      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-2xl border border-stone-200 text-xs font-bold text-stone-700 shadow-xs">
        <button className="p-1 rounded-lg hover:bg-stone-100 text-stone-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-extrabold text-[#1E293B]" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          October 2025
        </span>
        <button className="p-1 rounded-lg hover:bg-stone-100 text-stone-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Summary Cards matching screenshot 9 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Income */}
        <div className="p-3 rounded-2xl bg-white border-2 border-stone-200 text-center">
          <span className="text-[10px] font-bold text-stone-400 block uppercase">
            Total Income
          </span>
          <div
            className="text-sm font-black text-emerald-600 mt-1"
            style={{ fontFamily: 'Fredoka, monospace' }}
          >
            +${income.toFixed(2)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="p-3 rounded-2xl bg-white border-2 border-stone-200 text-center">
          <span className="text-[10px] font-bold text-stone-400 block uppercase">
            Total Expense
          </span>
          <div
            className="text-sm font-black text-rose-500 mt-1"
            style={{ fontFamily: 'Fredoka, monospace' }}
          >
            ${expense.toFixed(2)}
          </div>
        </div>

        {/* Net Balance */}
        <div className="p-3 rounded-2xl bg-white border-2 border-stone-200 text-center">
          <span className="text-[10px] font-bold text-stone-400 block uppercase">
            Net Balance
          </span>
          <div
            className="text-sm font-black text-teal-600 mt-1"
            style={{ fontFamily: 'Fredoka, monospace' }}
          >
            ${netBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Top Spending Ranking matching screenshot 9 */}
      <div className="p-4 rounded-3xl bg-white border-2 border-stone-200 shadow-xs space-y-3">
        <h3
          className="text-xs font-black text-[#1E293B] uppercase tracking-wider"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          Top Spending
        </h3>

        <div className="space-y-2">
          {topSpending.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-extrabold text-[11px] flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-bold text-stone-800">
                  {item.emoji} {item.name}
                </span>
              </div>
              <span
                className="font-black text-stone-900"
                style={{ fontFamily: 'Fredoka, monospace' }}
              >
                ${item.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
