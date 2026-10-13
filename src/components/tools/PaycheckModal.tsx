import React, { useState } from 'react';
import {
  X,
  Plus,
  DollarSign,
  Calculator,
  RotateCcw,
  Download,
  Check,
  Percent,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { LocalDB } from '../../services/storage';
import confetti from 'canvas-confetti';

interface PaycheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export const PaycheckModal: React.FC<PaycheckModalProps> = ({
  isOpen,
  onClose,
  onLogged,
}) => {
  // Mode: Hourly vs Salary
  const [payType, setPayType] = useState<'hourly' | 'salary'>('hourly');

  // Payroll Information
  const [payRate, setPayRate] = useState<string>('20');
  const [hoursWorked, setHoursWorked] = useState<string>('40');
  const [overtimeHours, setOvertimeHours] = useState<string>('0');
  const [payPeriod, setPayPeriod] = useState<'bi-weekly' | 'weekly' | 'semi-monthly' | 'monthly' | 'annually'>('bi-weekly');

  // Deductions
  const [federalTaxPercent, setFederalTaxPercent] = useState<string>('10');
  const [stateTaxPercent, setStateTaxPercent] = useState<string>('5');
  const [socialSecurityPercent, setSocialSecurityPercent] = useState<string>('6.2');
  const [medicarePercent, setMedicarePercent] = useState<string>('1.45');
  const [retirementPercent, setRetirementPercent] = useState<string>('5');
  const [healthInsuranceDollars, setHealthInsuranceDollars] = useState<string>('100');

  // Bonus
  const [includeBonus, setIncludeBonus] = useState<boolean>(false);
  const [bonusAmount, setBonusAmount] = useState<string>('0');

  // Copied feedback
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen) return null;

  // Calculation Logic matching picture 2
  const rate = parseFloat(payRate) || 0;
  const hours = parseFloat(hoursWorked) || 0;
  const otHours = parseFloat(overtimeHours) || 0;
  const bonus = includeBonus ? parseFloat(bonusAmount) || 0 : 0;

  let regularPay = 0;
  let overtimePay = 0;
  let grossPay = 0;

  if (payType === 'hourly') {
    // For bi-weekly, standard hours in pay period is e.g. 80 (or hours entered per period)
    // If user enters 40 hours per week in bi-weekly period:
    const periodMultiplier = payPeriod === 'bi-weekly' ? 2 : payPeriod === 'monthly' ? 4.33 : 1;
    regularPay = rate * hours * periodMultiplier;
    overtimePay = rate * 1.5 * otHours * periodMultiplier;
    grossPay = regularPay + overtimePay + bonus;
  } else {
    // Salary mode: rate is annual salary
    const periodsPerYear =
      payPeriod === 'weekly'
        ? 52
        : payPeriod === 'bi-weekly'
        ? 26
        : payPeriod === 'semi-monthly'
        ? 24
        : payPeriod === 'monthly'
        ? 12
        : 1;
    regularPay = +(rate / periodsPerYear).toFixed(2);
    overtimePay = 0;
    grossPay = regularPay + bonus;
  }

  // Deductions calculation
  const fedTaxRate = (parseFloat(federalTaxPercent) || 0) / 100;
  const stateTaxRate = (parseFloat(stateTaxPercent) || 0) / 100;
  const ssTaxRate = (parseFloat(socialSecurityPercent) || 0) / 100;
  const medTaxRate = (parseFloat(medicarePercent) || 0) / 100;
  const retRate = (parseFloat(retirementPercent) || 0) / 100;
  const healthIns = parseFloat(healthInsuranceDollars) || 0;

  const federalTax = +(grossPay * fedTaxRate).toFixed(2);
  const stateTax = +(grossPay * stateTaxRate).toFixed(2);
  const socialSecurity = +(grossPay * ssTaxRate).toFixed(2);
  const medicare = +(grossPay * medTaxRate).toFixed(2);

  const totalTaxes = +(federalTax + stateTax + socialSecurity + medicare).toFixed(2);

  const retirement = +(grossPay * retRate).toFixed(2);
  const totalDeductions = +(totalTaxes + retirement + healthIns).toFixed(2);

  const netPay = Math.max(0, +(grossPay - totalDeductions).toFixed(2));

  // Reset to default sample from picture 2
  const handleReset = () => {
    setPayType('hourly');
    setPayRate('20');
    setHoursWorked('40');
    setOvertimeHours('0');
    setPayPeriod('bi-weekly');
    setFederalTaxPercent('10');
    setStateTaxPercent('5');
    setSocialSecurityPercent('6.2');
    setMedicarePercent('1.45');
    setRetirementPercent('5');
    setHealthInsuranceDollars('100');
    setIncludeBonus(false);
    setBonusAmount('0');
  };

  // Save calculation as income in transaction ledger
  const handleSaveCalculation = () => {
    if (netPay <= 0) {
      return;
    }

    LocalDB.addTransaction({
      type: 'income',
      amount: netPay,
      category: 'income_financial',
      categoryName: 'Income & Financial',
      merchant: 'Payroll Direct Deposit',
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'Checking Account',
      location: 'New York, NY',
      note: `Payroll calculated: Gross $${grossPay.toFixed(2)}, Deductions $${totalDeductions.toFixed(2)}, Net $${netPay.toFixed(2)} (${payPeriod})`,
      scannedByAI: true,
      detectedItems: [
        `Gross Pay: $${grossPay.toFixed(2)}`,
        `Federal Tax (10%): -$${federalTax.toFixed(2)}`,
        `State Tax (5%): -$${stateTax.toFixed(2)}`,
        `Social Security (6.2%): -$${socialSecurity.toFixed(2)}`,
        `Medicare (1.45%): -$${medicare.toFixed(2)}`,
        `Retirement (401k): -$${retirement.toFixed(2)}`,
        `Health Insurance: -$${healthIns.toFixed(2)}`,
        `Net Take-home: $${netPay.toFixed(2)}`,
      ],
    });

    confetti({ particleCount: 60, spread: 70 });
    onLogged();
    onClose();
  };

  const handleCopySummary = () => {
    const summaryText = `--- Payroll Calculator Summary ---
Pay Period: ${payPeriod} (${payType.toUpperCase()})
Gross Pay: $${grossPay.toFixed(2)}
Regular Pay: $${regularPay.toFixed(2)}
Overtime Pay: $${overtimePay.toFixed(2)}
Bonus: $${bonus.toFixed(2)}
----------------------------------
Federal Tax: -$${federalTax.toFixed(2)}
State Tax: -$${stateTax.toFixed(2)}
Social Security: -$${socialSecurity.toFixed(2)}
Medicare: -$${medicare.toFixed(2)}
Retirement (401k): -$${retirement.toFixed(2)}
Health Insurance: -$${healthIns.toFixed(2)}
Total Deductions & Taxes: -$${totalDeductions.toFixed(2)}
==================================
Net Take-Home Pay: $${netPay.toFixed(2)}
Generated by NYC Ledger Payroll Calculator`;

    navigator.clipboard?.writeText(summaryText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF5] w-full h-full overflow-hidden animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto h-full">
        {/* Header matching Picture 3 */}
        <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-blue-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2
                className="text-lg font-black text-[#1E293B]"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Paycheck Tool
              </h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                NYC & NYS Income Tax & Net Take-Home Pay Estimator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
            aria-label="Close Paycheck tool"
          >
            <X className="w-4 h-4 text-[#1E293B]" />
          </button>
        </div>

        {/* Two-Column Responsive Layout matching 2nd picture */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ================= LEFT COLUMN: Inputs & Deductions ================= */}
          <div className="space-y-4">
            {/* Card 1: Payroll Information */}
            <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 space-y-3.5 shadow-2xs">
              <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <span>📊</span>
                <span>Payroll Information</span>
              </h3>

              {/* Hourly vs Salary Toggle */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setPayType('hourly')}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                    payType === 'hourly'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hourly
                </button>
                <button
                  type="button"
                  onClick={() => setPayType('salary')}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                    payType === 'salary'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Salary
                </button>
              </div>

              {/* Pay Rate */}
              <div>
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1 mb-1">
                  <span>Pay Rate {payType === 'hourly' ? '($/hr)' : '($/year)'}</span>
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                />
              </div>

              {/* Hours Worked & Overtime Hours */}
              {payType === 'hourly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      Hours Worked (per week)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      Overtime Hours
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Pay Period */}
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">
                  Pay Period
                </label>
                <select
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-xs font-bold text-[#1E293B] focus:border-blue-500 outline-none"
                >
                  <option value="weekly">Weekly (52 paychecks/yr)</option>
                  <option value="bi-weekly">Bi-Weekly (26 paychecks/yr)</option>
                  <option value="semi-monthly">Semi-Monthly (24 paychecks/yr)</option>
                  <option value="monthly">Monthly (12 paychecks/yr)</option>
                  <option value="annually">Annually (1 paycheck/yr)</option>
                </select>
              </div>
            </div>

            {/* Card 2: Deductions */}
            <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 space-y-3.5 shadow-2xs">
              <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <span>💰</span>
                <span>Taxes & Deductions</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    Federal Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={federalTaxPercent}
                    onChange={(e) => setFederalTaxPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    State Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={stateTaxPercent}
                    onChange={(e) => setStateTaxPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    Social Security (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={socialSecurityPercent}
                    onChange={(e) => setSocialSecurityPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    Medicare (%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={medicarePercent}
                    onChange={(e) => setMedicarePercent(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    Retirement (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={retirementPercent}
                    onChange={(e) => setRetirementPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">
                    Health Insurance ($)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={healthInsuranceDollars}
                    onChange={(e) => setHealthInsuranceDollars(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Include Bonus Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-black text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBonus}
                    onChange={(e) => setIncludeBonus(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-stone-300 focus:ring-blue-500"
                  />
                  <span>Include Bonus / Stipend</span>
                </label>
                {includeBonus && (
                  <div className="mt-2 pl-6">
                    <input
                      type="number"
                      step="50"
                      placeholder="Bonus Amount ($)"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm font-black text-[#1E293B] focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons: Calculate Payroll & Reset */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Results & Summary ================= */}
          <div className="space-y-4">
            {/* Card 3: Payroll Results (4 Summary Cards) */}
            <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <span>↗️</span>
                <span>Payroll Results</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Gross Pay */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[11px] font-bold text-stone-500 block">Gross Pay</span>
                  <div
                    className="text-xl font-black text-blue-900 mt-0.5"
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${grossPay.toFixed(2)}
                  </div>
                </div>

                {/* Net Pay */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="text-[11px] font-bold text-emerald-800 block">Net Pay (Take-Home)</span>
                  <div
                    className="text-xl font-black text-emerald-700 mt-0.5"
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${netPay.toFixed(2)}
                  </div>
                </div>

                {/* Taxes */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                  <span className="text-[11px] font-bold text-stone-500 block">Taxes</span>
                  <div
                    className="text-xl font-black text-rose-700 mt-0.5"
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${totalTaxes.toFixed(2)}
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                  <span className="text-[11px] font-bold text-stone-500 block">Total Deductions</span>
                  <div
                    className="text-xl font-black text-purple-900 mt-0.5"
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${totalDeductions.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Payroll Summary (Breakdown List) */}
            <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 space-y-2.5 shadow-2xs">
              <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-stone-100">
                <span>📋</span>
                <span>Payroll Summary Breakdown</span>
              </h3>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Regular Pay:</span>
                  <span className="font-bold text-stone-900">${regularPay.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Overtime Pay:</span>
                  <span className="font-bold text-stone-900">${overtimePay.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Bonus:</span>
                  <span className="font-bold text-stone-900">${bonus.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-stone-200 my-1" />
                <div className="flex items-center justify-between text-stone-600">
                  <span>Federal Tax ({federalTaxPercent}%):</span>
                  <span className="font-bold text-rose-600">-${federalTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>State Tax ({stateTaxPercent}%):</span>
                  <span className="font-bold text-rose-600">-${stateTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Social Security ({socialSecurityPercent}%):</span>
                  <span className="font-bold text-rose-600">-${socialSecurity.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Medicare ({medicarePercent}%):</span>
                  <span className="font-bold text-rose-600">-${medicare.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Retirement (401k):</span>
                  <span className="font-bold text-purple-700">-${retirement.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Health Insurance:</span>
                  <span className="font-bold text-purple-700">-${healthIns.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t-2 border-[#1E293B]/20 flex items-center justify-between">
                  <span className="font-black text-sm text-[#1E293B]">Net Pay Take-Home:</span>
                  <span
                    className="font-black text-lg text-blue-700"
                    style={{ fontFamily: 'Fredoka, monospace' }}
                  >
                    ${netPay.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons matching picture 2 */}
              <div className="pt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSaveCalculation}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Calculation</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? 'Copied Summary!' : 'Export Summary'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-5 py-2.5 bg-stone-100/90 border-t border-stone-200 text-center text-[10px] text-stone-500 font-semibold">
          Payroll Calculator App © 2026 | NYC Cost of Living • Tax & Net Pay Calculator with Direct Ledger Logging
        </div>
      </div>
    </div>
  );
};
