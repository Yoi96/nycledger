import React, { useRef, useState } from 'react';
import {
  X,
  RotateCcw,
  CalendarDays,
  Trash2,
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Palette,
  HelpCircle,
  Info,
  Upload,
  Download,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { LocalDB } from '../../services/storage';
import { CatHead } from '../common/CatMascot';

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  onOpenTutorial?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  isOpen,
  onClose,
  onDataReset,
  onOpenTutorial,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<'none' | 'clear' | 'reset' | 'previous_day'>('none');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const SUPPORT_EMAIL = 'xiaoyi.development.projects@gmail.com';

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = LocalDB.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NYC_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Local ledger exported as JSON backup');
  };

  const handleExportCSV = () => {
    const csvStr = LocalDB.exportToCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NYC_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Exported as CSV spreadsheet');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = LocalDB.importDataJSON(content);
      if (success) {
        showToast('🎉 Data restored successfully from backup!');
        onDataReset();
      } else {
        showToast('❌ Invalid file format, import failed');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleImportExcelCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await LocalDB.importFromExcelOrCSV(file);
    if (result.success) {
      showToast(`🎉 Successfully imported ${result.count} transactions!`);
      onDataReset();
    } else {
      showToast(`❌ Import failed: ${result.error || 'Parsing error'}`);
    }
    if (e.target) e.target.value = '';
  };

  const executeChangeToPreviousDay = () => {
    const res = LocalDB.changeToPreviousDayData();
    showToast(
      res.count > 0
        ? `📅 Shifted ${res.count} transactions to previous day`
        : '📅 Changed data to previous day'
    );
    onDataReset();
    setConfirmModal('none');
  };

  const executeReset = () => {
    executeChangeToPreviousDay();
  };

  const executeClearAllData = () => {
    LocalDB.clearAllData();
    showToast('🗑️ All data permanently cleared! Ledger is now blank.');
    onDataReset();
    setConfirmModal('none');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFBF5] flex flex-col w-full max-w-md mx-auto h-screen h-[100dvh] max-h-screen max-h-[100dvh] overflow-hidden shadow-2xl animate-in fade-in duration-200">
      {/* Header - permanently fixed at top, never moves on scroll */}
      <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-stone-50/70 flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center">
            <CatHead size={32} />
          </div>
          <div>
            <h2
              className="text-lg font-black text-[#1E293B]"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              Profile & Settings
            </h2>
            <p className="text-[10px] text-stone-500 font-semibold">
              Offline Privacy, Data Backup & App Preferences
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
          aria-label="Close Profile & Settings"
        >
          <X className="w-4 h-4 text-[#1E293B]" />
        </button>
      </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* User Card */}
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-3xl border-2 border-stone-200 shadow-xs space-y-2">
            <CatHead size={96} />
            <div>
              <h3
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                NYC Ledger
              </h3>
 
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
               100% Offline Mode (Local Storage Isolation) 
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="p-2.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Data Privacy & Backup section */}
          <div className="space-y-2">
            <span className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">
              Data Backup & Offline Privacy Control
            </span>
            <div className="bg-white rounded-2xl border-2 border-stone-200 divide-y divide-stone-100 overflow-hidden text-xs">
              {/* 1. Export Full Backup (JSON) */}
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Upload className="w-4 h-4 text-cyan-600" />
                  Export Full Backup (JSON)
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* 2. Import & Restore Backup (JSON) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Download className="w-4 h-4 text-amber-600" />
                  Import & Restore Backup (JSON)
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />

              {/* 3. Export Excel / CSV Report */}
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Export as Excel / CSV Report
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* 4. Import Excel / CSV File */}
              <button
                onClick={() => excelInputRef.current?.click()}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Download className="w-4 h-4 text-teal-600" />
                  Import Excel / CSV File
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
              <input
                type="file"
                ref={excelInputRef}
                accept=".csv,.xlsx,.xls,.tsv"
                className="hidden"
                onChange={handleImportExcelCSV}
              />

              {/* 5. Change to Previous Day's Data */}
              <button
                onClick={() => setConfirmModal('previous_day')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50 text-left transition-colors text-amber-700"
              >
                <div className="flex items-center gap-2.5 font-bold">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  Change to Previous Day's Data
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  Previous Day
                </span>
              </button>

              {/* 6. Clear All Data */}
              <button
                onClick={() => setConfirmModal('clear')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-50 text-left transition-colors text-rose-700"
              >
                <div className="flex items-center gap-2.5 font-bold">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Clear All Data
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                  Clear
                </span>
              </button>
            </div>
          </div>

          {/* General Section: Updated per request */}
          <div className="space-y-2">
            <span className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">
              General
            </span>
            <div className="bg-white rounded-2xl border-2 border-stone-200 divide-y divide-stone-100 overflow-hidden text-xs">
              {/* Account & Security with descriptive text */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-stone-50">
                <div className="flex items-center gap-2.5 text-stone-700 font-bold min-w-0">
                  <Lock className="w-4 h-4 text-stone-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[#1E293B] font-bold">Account & Security</div>
                    <div className="text-[10px] text-stone-400 font-medium truncate">
                      Offline Local Encrypted Storage • Device Sandbox Isolation
                    </div>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Palette className="w-4 h-4 text-stone-400" />
                  Appearance
                </div>
                <span className="text-[11px] text-stone-400">Warm Cream</span>
              </div>

              {/* Beginner Tutorial Guide */}
              {onOpenTutorial && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTutorial();
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50/50 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Beginner Tutorial Guide</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                    <span>Replay Guide</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </button>
              )}

              {/* Help & Support (Opens User Email) */}
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <HelpCircle className="w-4 h-4 text-stone-400" />
                  Help & Support
                </div>
                <div className="flex items-center gap-1 text-[11px] text-sky-600 font-semibold">
                  <span>Contact</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </button>

              {/* About NYC Ledger */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 cursor-pointer">
                <div className="flex items-center gap-2.5 text-stone-700 font-bold">
                  <Info className="w-4 h-4 text-stone-400" />
                  About NYC Ledger
                </div>
                <span className="text-[11px] text-stone-400">v1.2.0 (Offline)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support Modal Showing User Email */}
        {showSupportModal && (
          <div className="absolute inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 border-3 border-[#1E293B] shadow-2xl text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-sky-100 border-2 border-sky-300 text-sky-700 mx-auto flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3
                  className="font-black text-lg text-[#1E293B]"
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  Help & Support
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  For product feedback, questions, or data assistance, please contact:
                </p>
              </div>

              {/* User Email Box */}
              <div className="p-3 bg-stone-50 rounded-2xl border-2 border-stone-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span className="text-xs font-black text-[#1E293B] truncate select-all">
                    {SUPPORT_EMAIL}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                  title="Copy Email"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Close
                </button>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex-1 py-2.5 rounded-xl bg-[#FCCE4C] hover:bg-amber-400 border-2 border-[#1E293B] text-[#1E293B] font-black text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95"
                >
                  <span>Open Mail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* In-App Clear All Data Confirmation Modal */}
        {confirmModal === 'clear' && (
          <div className="absolute inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 border-3 border-[#1E293B] shadow-2xl text-center space-y-3.5 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-rose-300 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-[#1E293B]">
                  Permanently Clear All Data?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  This action will permanently delete all transaction records (resetting to 0 items), reset Total Balance to $0.00, and clear OMNY card and budgets.
                </p>
                <p className="text-[11px] font-bold text-rose-600 bg-rose-50 py-1 px-2 rounded-lg border border-rose-200 mt-2">
                  ⚠️ Cleared data cannot be recovered. Are you sure you want to proceed?
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModal('none')}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeClearAllData}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-700 shadow-md active:scale-95"
                >
                  Confirm Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change to Previous Day's Data Confirmation Modal */}
        {(confirmModal === 'reset' || confirmModal === 'previous_day') && (
          <div className="absolute inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 border-3 border-[#1E293B] shadow-2xl text-center space-y-3.5 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 mx-auto flex items-center justify-center">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-[#1E293B]">
                  Change to Previous Day's Data?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  This will shift all transaction dates back to the previous day (or load realistic previous-day NYC records if the ledger is currently empty).
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmModal('none')}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeChangeToPreviousDay}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 shadow-md active:scale-95"
                >
                  Confirm Change to Previous Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};
