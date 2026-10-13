import React from 'react';
import { CatMascot, AppLogo } from '../common/CatMascot';
import {
  CreditCard,
  UtensilsCrossed,
  Bot,
  Calculator,
  Wine,
  Percent,
  Briefcase,
  Settings,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Tag,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { FastfoodVector } from '../common/CategoryIcon';

interface ToolsViewProps {
  onOpenOMNY: () => void;
  onOpenQuickMeal: () => void;
  onOpenAIAdvisor: () => void;
  onOpenShoppingTax: () => void;
  onOpenBottleTool: () => void;
  onOpenTipSplit: () => void;
  onOpenPaycheck: () => void;
  onOpenProfile: () => void;
  onOpenCalendar?: () => void;
  onOpenCategoryManager?: () => void;
  onOpenTodoList?: () => void;
  onOpenTutorial?: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  onOpenOMNY,
  onOpenQuickMeal,
  onOpenAIAdvisor,
  onOpenShoppingTax,
  onOpenBottleTool,
  onOpenTipSplit,
  onOpenPaycheck,
  onOpenProfile,
  onOpenCalendar,
  onOpenCategoryManager,
  onOpenTodoList,
  onOpenTutorial,
}) => {
  const tools = [
    {
      id: 'todo_list',
      name: 'To-Do Planner',
      desc: 'Checklist & daily routine',
      icon: <CheckSquare className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-100 border-emerald-300',
      action: onOpenTodoList || (() => {}),
    },
    {
      id: 'calendar_tool',
      name: 'Calendar',
      desc: 'Daily spend & streak',
      icon: <Calendar className="w-5 h-5 text-indigo-700" />,
      iconBg: 'bg-indigo-100 border-indigo-300',
      action: onOpenCalendar || (() => {}),
    },
    {
      id: 'category_manager',
      name: 'Categories',
      desc: 'Custom tags & icons',
      icon: <Tag className="w-5 h-5 text-amber-700" />,
      iconBg: 'bg-amber-100 border-amber-300',
      action: onOpenCategoryManager || (() => {}),
    },
    {
      id: 'omny',
      name: 'OMNY Transit',
      desc: 'Tap, balance & fare cap',
      icon: <CreditCard className="w-5 h-5 text-cyan-700" />,
      iconBg: 'bg-cyan-100 border-cyan-300',
      action: onOpenOMNY,
    },
    {
      id: 'quick_meal',
      name: 'Quick Meals',
      desc: 'Budget NYC food deals',
      icon: <FastfoodVector size={20} color="#B45309" />,
      iconBg: 'bg-amber-100 border-amber-300',
      action: onOpenQuickMeal,
    },
    {
      id: 'ai_advisor',
      name: 'AI Advisor',
      desc: 'Smart money insights',
      icon: <Bot className="w-5 h-5 text-purple-700" />,
      iconBg: 'bg-purple-100 border-purple-300',
      action: onOpenAIAdvisor,
    },
    {
      id: 'tax_calc',
      name: 'Shopping Tax',
      desc: 'NYC 8.875% & clothing',
      icon: <Calculator className="w-5 h-5 text-rose-700" />,
      iconBg: 'bg-rose-100 border-rose-300',
      action: onOpenShoppingTax,
    },
    {
      id: 'bottle_tool',
      name: 'Bottle Returns',
      desc: '5¢ NY deposit refunds',
      icon: <Wine className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-100 border-emerald-300',
      action: onOpenBottleTool,
    },
    {
      id: 'tip_split',
      name: 'Tip Splitter',
      desc: 'Dining tips & split bill',
      icon: <Percent className="w-5 h-5 text-blue-700" />,
      iconBg: 'bg-blue-100 border-blue-300',
      action: onOpenTipSplit,
    },
    {
      id: 'paycheck',
      name: 'Paycheck Calc',
      desc: 'Net take-home pay',
      icon: <Briefcase className="w-5 h-5 text-teal-700" />,
      iconBg: 'bg-teal-100 border-teal-300',
      action: onOpenPaycheck,
    },
    ...(onOpenTutorial
      ? [
          {
            id: 'tutorial',
            name: 'Beginner Tutorial',
            desc: 'Quick start user guide',
            icon: <BookOpen className="w-5 h-5 text-amber-700" />,
            iconBg: 'bg-amber-100 border-amber-300',
            action: onOpenTutorial,
          },
        ]
      : []),
    {
      id: 'settings',
      name: 'Settings',
      desc: 'Data backup & privacy',
      icon: <Settings className="w-5 h-5 text-stone-700" />,
      iconBg: 'bg-stone-100 border-stone-300',
      action: onOpenProfile,
    },
  ];

  return (
    <div className="space-y-4 pb-24 px-4 pt-3">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-black text-[#1E293B]"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            NYC Tools
          </h2>
          <p className="text-[11px] font-semibold text-stone-500">
            Smart utilities to manage NYC living expenses
          </p>
        </div>
        <span className="text-[10px] font-extrabold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
          {tools.length} Tools
        </span>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {tools.map((t) => (
          <div
            key={t.id}
            onClick={t.action}
            className="p-3.5 rounded-2xl bg-white border-2 border-stone-200/90 hover:border-[#1E293B] hover:shadow-xs cursor-pointer transition-all flex flex-col items-center text-center space-y-1.5 group active:scale-[0.98]"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${t.iconBg} group-hover:scale-105 transition-transform shadow-2xs`}
            >
              {t.icon}
            </div>

            <div className="w-full min-w-0">
              <div
                className="text-xs font-black text-[#1E293B] group-hover:text-amber-800 transition-colors truncate"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {t.name}
              </div>
              <div className="text-[10px] font-semibold text-stone-500 mt-0.5 truncate">
                {t.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Offline Data Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            All tools operate 100% offline with zero data telemetry
          </span>
        </div>
        <button
          onClick={onOpenProfile}
          className="text-[11px] font-bold text-emerald-800 underline"
        >
          Data Backup
        </button>
      </div>
    </div>
  );
};
