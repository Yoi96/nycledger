import React from 'react';
import { Home, ReceiptText, Plus, BarChart3, LayoutGrid } from 'lucide-react';

export type TabType = 'home' | 'transactions' | 'analytics' | 'tools';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF5] border-t-2 border-[#1E293B]/10 max-w-md mx-auto px-4 py-2 flex items-center justify-between shadow-lg">
      {/* Home */}
      <button
        onClick={() => onChangeTab('home')}
        className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all ${
          currentTab === 'home'
            ? 'text-[#1E293B] font-bold'
            : 'text-stone-400 hover:text-stone-600 font-medium'
        }`}
      >
        <div
          className={`w-9 h-6 sm:w-10 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            currentTab === 'home' ? 'bg-[#FCCE4C] border border-[#1E293B]/30' : ''
          }`}
        >
          <Home className="w-4 h-4 text-[#1E293B]" />
        </div>
        <span className="text-[10px] sm:text-[11px] leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Home
        </span>
      </button>

      {/* Transactions */}
      <button
        onClick={() => onChangeTab('transactions')}
        className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all ${
          currentTab === 'transactions'
            ? 'text-[#1E293B] font-bold'
            : 'text-stone-400 hover:text-stone-600 font-medium'
        }`}
      >
        <div
          className={`w-9 h-6 sm:w-10 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            currentTab === 'transactions' ? 'bg-[#FCCE4C] border border-[#1E293B]/30' : ''
          }`}
        >
          <ReceiptText className="w-4 h-4 text-[#1E293B]" />
        </div>
        <span className="text-[10px] sm:text-[11px] leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Transactions
        </span>
      </button>

      {/* Center (+) Add Button */}
      <div className="relative -top-2.5 flex flex-col items-center">
        <button
          onClick={onOpenAdd}
          className="w-11 h-11 rounded-full bg-[#FCCE4C] border-2 border-[#1E293B] shadow-[0_3px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-[#1E293B] hover:scale-105 active:scale-95 transition-all group"
          title="Add Transaction (AI Camera / Receipt Scan)"
        >
          <Plus className="w-5 h-5 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" />
        </button>
      </div>

      {/* Analytics */}
      <button
        onClick={() => onChangeTab('analytics')}
        className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all ${
          currentTab === 'analytics'
            ? 'text-[#1E293B] font-bold'
            : 'text-stone-400 hover:text-stone-600 font-medium'
        }`}
      >
        <div
          className={`w-9 h-6 sm:w-10 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            currentTab === 'analytics' ? 'bg-[#FCCE4C] border border-[#1E293B]/30' : ''
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#1E293B]" />
        </div>
        <span className="text-[10px] sm:text-[11px] leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Analytics
        </span>
      </button>

      {/* Tools */}
      <button
        onClick={() => onChangeTab('tools')}
        className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1 rounded-xl transition-all ${
          currentTab === 'tools'
            ? 'text-[#1E293B] font-bold'
            : 'text-stone-400 hover:text-stone-600 font-medium'
        }`}
      >
        <div
          className={`w-9 h-6 sm:w-10 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            currentTab === 'tools' ? 'bg-[#FCCE4C] border border-[#1E293B]/30' : ''
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-[#1E293B]" />
        </div>
        <span className="text-[10px] sm:text-[11px] leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Tools
        </span>
      </button>
    </nav>
  );
};
