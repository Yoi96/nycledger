import React, { useState, useEffect } from 'react';
import { Transaction } from './types';
import { LocalDB } from './services/storage';
import { ArrowLeft } from 'lucide-react';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { HomeView } from './components/views/HomeView';
import { TransactionsView } from './components/views/TransactionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ToolsView } from './components/views/ToolsView';
import { AIAdvisorView } from './components/views/AIAdvisorView';
import { BudgetsView } from './components/views/BudgetsView';
import { ReportsView } from './components/views/ReportsView';
import { AddTransactionModal } from './components/views/AddTransactionModal';
import { TransactionDetailModal } from './components/views/TransactionDetailModal';
import { ProfileView } from './components/views/ProfileView';
import { SplashCoverModal } from './components/views/SplashCoverModal';
import { OMNYModal } from './components/tools/OMNYModal';
import { QuickMealModal } from './components/tools/QuickMealModal';
import { ShoppingTaxModal } from './components/tools/ShoppingTaxModal';
import { BottleToolModal } from './components/tools/BottleToolModal';
import { TipSplitModal } from './components/tools/TipSplitModal';
import { PaycheckModal } from './components/tools/PaycheckModal';
import { CalendarModal } from './components/tools/CalendarModal';
import { CategoryManagerModal } from './components/tools/CategoryManagerModal';
import { TodoListModal } from './components/tools/TodoListModal';
import { BeginnerTutorialModal } from './components/common/BeginnerTutorialModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Sub-views & Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [addModalDefaultDate, setAddModalDefaultDate] = useState<string | undefined>(undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Tools Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [isOMNYOpen, setIsOMNYOpen] = useState(false);
  const [isQuickMealOpen, setIsQuickMealOpen] = useState(false);
  const [isShoppingTaxOpen, setIsShoppingTaxOpen] = useState(false);
  const [isBottleToolOpen, setIsBottleToolOpen] = useState(false);
  const [isTipSplitOpen, setIsTipSplitOpen] = useState(false);
  const [isPaycheckOpen, setIsPaycheckOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'none' | 'advisor' | 'budgets' | 'reports'>('none');

  const [hasQuotaExceeded, setHasQuotaExceeded] = useState(false);

  // Load from local storage
  const reloadData = () => {
    const list = LocalDB.getTransactions();
    setTransactions([...list]);
  };

  useEffect(() => {
    reloadData();

    // Check if first-time user: pop up beginner tutorial
    try {
      const tutorialSeen = localStorage.getItem('nyc_ledger_tutorial_seen_v1');
      if (!tutorialSeen) {
        setIsTutorialOpen(true);
      }
    } catch {}

    const handleResetEvent = () => reloadData();
    window.addEventListener('app_data_reset', handleResetEvent);
    window.addEventListener('categories-updated', handleResetEvent);
    window.addEventListener('storage', handleResetEvent);

    const onQuotaExceeded = () => setHasQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);

    return () => {
      window.removeEventListener('app_data_reset', handleResetEvent);
      window.removeEventListener('categories-updated', handleResetEvent);
      window.removeEventListener('storage', handleResetEvent);
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
    };
  }, []);

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const existing = transactions.find((t) => t.id === existingId);
      LocalDB.updateTransaction({
        ...txData,
        id: existingId,
        createdAt: existing?.createdAt || Date.now(),
      });
    } else {
      LocalDB.addTransaction(txData);
    }
    reloadData();
    setEditingTx(null);
    setIsAddOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    LocalDB.deleteTransaction(id);
    reloadData();
    setSelectedTx(null);
  };

  const handleStartEdit = (tx: Transaction) => {
    setSelectedTx(null);
    setEditingTx(tx);
    setIsAddOpen(true);
  };

  const handleExportCSV = () => {
    const csvStr = LocalDB.exportToCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NYC_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen max-h-[100dvh] bg-[#FDFBF5] text-[#1E293B] flex flex-col font-sans selection:bg-[#FCCE4C] selection:text-[#1E293B] overflow-hidden">
      {hasQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center flex-shrink-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {/* Centered Mobile Container with fixed header and smooth scrolling body */}
      <div className="w-full max-w-md mx-auto flex flex-col h-full max-h-full relative shadow-2xl bg-[#FDFBF5] border-x border-[#1E293B]/10 overflow-hidden">
        {/* Top Header - Single clean header, permanently fixed at top, never moves on scroll */}
        <div className="flex-shrink-0 z-40 bg-[#FDFBF5]">
          {activeSubView !== 'none' ? (
            <header className="bg-white/95 backdrop-blur-md px-4 py-3 border-b-2 border-[#1E293B]/10 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveSubView('none')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1E293B] font-extrabold text-xs border border-stone-300 transition-colors active:scale-95 cursor-pointer shadow-2xs"
                  aria-label="Back to main view"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <h1
                  className="text-base font-black text-[#1E293B] leading-none"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {activeSubView === 'advisor' && 'AI Financial Advisor'}
                  {activeSubView === 'budgets' && 'Monthly Budgets'}
                  {activeSubView === 'reports' && 'Financial Reports'}
                </h1>
              </div>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200"
              >
                Settings
              </button>
            </header>
          ) : (
            <Header
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenCover={() => setIsCoverOpen(true)}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              unreadCount={0}
            />
          )}
        </div>

        {/* Main Body - scrolls smoothly inside container, header never moves */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain">
          {activeSubView === 'advisor' ? (
            <div className="w-full h-full overflow-hidden no-scrollbar">
              <AIAdvisorView />
            </div>
          ) : activeSubView === 'budgets' ? (
            <div className="pb-24">
              <BudgetsView />
            </div>
          ) : activeSubView === 'reports' ? (
            <div className="pb-24">
              <ReportsView transactions={transactions} onExportCSV={handleExportCSV} />
            </div>
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTx(tx)}
                  onSeeAllTransactions={() => setCurrentTab('transactions')}
                  onOpenOMNY={() => setIsOMNYOpen(true)}
                  onOpenQuickMeal={() => setIsQuickMealOpen(true)}
                  onOpenAIAdvisor={() => setActiveSubView('advisor')}
                  onOpenTools={() => setCurrentTab('tools')}
                  onOpenTodoList={() => setIsTodoListOpen(true)}
                  onOpenAddAI={() => {
                    setEditingTx(null);
                    setIsAddOpen(true);
                  }}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTx(tx)}
                  onOpenAdd={() => {
                    setEditingTx(null);
                    setIsAddOpen(true);
                  }}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView
                  transactions={transactions}
                />
              )}

              {currentTab === 'tools' && (
                <ToolsView
                  onOpenOMNY={() => setIsOMNYOpen(true)}
                  onOpenQuickMeal={() => setIsQuickMealOpen(true)}
                  onOpenAIAdvisor={() => setActiveSubView('advisor')}
                  onOpenShoppingTax={() => setIsShoppingTaxOpen(true)}
                  onOpenBottleTool={() => setIsBottleToolOpen(true)}
                  onOpenTipSplit={() => setIsTipSplitOpen(true)}
                  onOpenPaycheck={() => setIsPaycheckOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenCalendar={() => setIsCalendarOpen(true)}
                  onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
                  onOpenTodoList={() => setIsTodoListOpen(true)}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation - pinned at bottom, never moves on scroll */}
        <div className="flex-shrink-0 z-40 bg-[#FDFBF5]">
          <BottomNav
            currentTab={activeSubView !== 'none' ? 'home' : currentTab}
            onChangeTab={(tab) => {
              setActiveSubView('none');
              setCurrentTab(tab);
            }}
            onOpenAdd={() => {
              setEditingTx(null);
              setAddModalDefaultDate(undefined);
              setIsAddOpen(true);
            }}
          />
        </div>

        {/* Modals */}
        <AddTransactionModal
          isOpen={isAddOpen}
          initialTransaction={editingTx}
          defaultDate={addModalDefaultDate}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingTx(null);
            setAddModalDefaultDate(undefined);
          }}
          onSave={(txData, existingId) => {
            handleSaveTransaction(txData, existingId);
            setAddModalDefaultDate(undefined);
          }}
        />

        <TransactionDetailModal
          transaction={selectedTx}
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={handleDeleteTransaction}
          onEdit={handleStartEdit}
        />

        <ProfileView
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onDataReset={reloadData}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />

        <SplashCoverModal
          isOpen={isCoverOpen}
          onClose={() => setIsCoverOpen(false)}
          onStart={() => {
            setIsCoverOpen(false);
            setCurrentTab('home');
          }}
        />

        {/* Tools Modals */}
        <OMNYModal
          isOpen={isOMNYOpen}
          onClose={() => setIsOMNYOpen(false)}
          onTransactionAdded={reloadData}
        />

        <QuickMealModal
          isOpen={isQuickMealOpen}
          onClose={() => setIsQuickMealOpen(false)}
          onLogged={reloadData}
        />

        <ShoppingTaxModal
          isOpen={isShoppingTaxOpen}
          onClose={() => setIsShoppingTaxOpen(false)}
          onLogged={reloadData}
        />

        <BottleToolModal
          isOpen={isBottleToolOpen}
          onClose={() => setIsBottleToolOpen(false)}
          onLogged={reloadData}
        />

        <TipSplitModal
          isOpen={isTipSplitOpen}
          onClose={() => setIsTipSplitOpen(false)}
          onLogged={reloadData}
        />

        <PaycheckModal
          isOpen={isPaycheckOpen}
          onClose={() => setIsPaycheckOpen(false)}
          onLogged={reloadData}
        />

        <CalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTx(tx)}
          onOpenAddForDate={(dateStr) => {
            setEditingTx(null);
            setAddModalDefaultDate(dateStr);
            setIsAddOpen(true);
          }}
        />

        <CategoryManagerModal
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          onCategoriesChanged={reloadData}
        />

        <TodoListModal
          isOpen={isTodoListOpen}
          onClose={() => setIsTodoListOpen(false)}
        />

        <BeginnerTutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onStartLogging={() => {
            setIsTutorialOpen(false);
            setEditingTx(null);
            setAddModalDefaultDate(undefined);
            setIsAddOpen(true);
          }}
        />

        <OfflineIndicator />
      </div>
    </div>
  );
}
