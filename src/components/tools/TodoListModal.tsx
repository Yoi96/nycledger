import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Clock,
  Calendar,
  Star,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { TodoItem, TodoPriority } from '../../types/todo';
import { LocalDB, INITIAL_TODOS } from '../../services/storage';

interface TodoListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<TodoPriority, { color: string; label: string }> = {
  low: { color: '#10B981', label: 'Low' },
  medium: { color: '#F59E0B', label: 'Medium' },
  high: { color: '#EF4444', label: 'High Priority' },
  urgent: { color: '#8B5CF6', label: 'Urgent' },
};

const QUICK_PRESETS = [
  { title: 'Morning workout', time: '8:00 AM', priority: 'low' as TodoPriority, color: '#10B981', category: 'Wellness' },
  { title: 'Breakfast & coffee', time: '9:00 AM', priority: 'low' as TodoPriority, color: '#10B981', category: 'Daily' },
  { title: 'Tap OMNY subway commute', time: '9:30 AM', priority: 'medium' as TodoPriority, color: '#06B6D4', category: 'Transit' },
  { title: 'Reply to emails', time: '10:30 AM', priority: 'low' as TodoPriority, color: '#10B981', category: 'Work' },
  { title: 'Finish design mockup', time: '12:00 PM', priority: 'medium' as TodoPriority, color: '#F59E0B', category: 'Work' },
  { title: 'Bodega grocery run', time: '4:00 PM', priority: 'medium' as TodoPriority, color: '#3B82F6', category: 'Shopping' },
  { title: 'Review monthly budget', time: '6:30 PM', priority: 'high' as TodoPriority, color: '#EF4444', category: 'Financial' },
  { title: 'Read a book', time: '8:00 PM', priority: 'low' as TodoPriority, color: '#8B5CF6', category: 'Personal' },
  { title: "Plan tomorrow's schedule", time: '9:30 PM', priority: 'high' as TodoPriority, color: '#EF4444', category: 'Planning' },
];

export const TodoListModal: React.FC<TodoListModalProps> = ({ isOpen, onClose }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed' | 'high_priority'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00 PM');
  const [newPriority, setNewPriority] = useState<TodoPriority>('medium');
  const [newCategory, setNewCategory] = useState('Daily');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTodos = () => {
    const list = LocalDB.getTodos();
    setTodos(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTodos();
      setIsAdding(false);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = (id: string) => {
    const completed = LocalDB.toggleTodo(id);
    loadTodos();
    showToast(completed ? '🎉 Task marked as completed!' : 'Task moved back to pending');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    LocalDB.deleteTodo(id);
    loadTodos();
    showToast('🗑️ Task removed');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    LocalDB.addTodo({
      title: newTitle.trim(),
      time: newTime.trim() || undefined,
      date: selectedDate,
      completed: false,
      priority: newPriority,
      colorDot: PRIORITY_COLORS[newPriority].color,
      category: newCategory.trim() || 'General',
    });

    setNewTitle('');
    setIsAdding(false);
    loadTodos();
    showToast('✨ New task added to your planner!');
  };

  const handleAddPreset = (preset: typeof QUICK_PRESETS[0]) => {
    LocalDB.addTodo({
      title: preset.title,
      time: preset.time,
      date: selectedDate,
      completed: false,
      priority: preset.priority,
      colorDot: preset.color,
      category: preset.category,
    });
    loadTodos();
    showToast(`✨ Added "${preset.title}"`);
  };

  const handleResetDefaults = () => {
    LocalDB.resetTodos();
    loadTodos();
    showToast('🔄 Tasks reset to default planner items');
  };

  // Stats calculation matching picture
  const stats = useMemo(() => {
    const completed = todos.filter((t) => t.completed).length;
    const pending = todos.filter((t) => !t.completed).length;

    // Overdue: incomplete with past time/date
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const overdue = todos.filter((t) => {
      if (t.completed) return false;
      if (t.date < todayStr) return true;
      return false;
    }).length;

    const highPriority = todos.filter((t) => !t.completed && (t.priority === 'high' || t.priority === 'urgent')).length;

    return { completed, pending, overdue, highPriority, total: todos.length };
  }, [todos]);

  // Filtered task items
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (filter === 'completed') return t.completed;
      if (filter === 'pending') return !t.completed;
      if (filter === 'high_priority') return !t.completed && (t.priority === 'high' || t.priority === 'urgent');
      return true; // 'all' and 'today'
    });
  }, [todos, filter]);

  // Formatted date string e.g. "Aug 5, 2025" or current date
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleShiftDate = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    setSelectedDate(dt.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFBF5] flex flex-col w-full max-w-md mx-auto h-screen h-[100dvh] max-h-screen max-h-[100dvh] overflow-hidden shadow-2xl animate-in fade-in duration-200">
      {/* 1. Fixed Header - stays permanently at top, never moves on scroll */}
      <div className="px-4 py-3.5 border-b-2 border-[#1E293B]/10 flex items-center justify-between bg-[#F8F9F5] flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <h2
              className="text-lg font-black text-[#1E293B] leading-none"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              Daily To-Do Planner
            </h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-0.5">
              Task Checklist, Deadlines & Routine Tracker
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors border border-stone-200 shadow-2xs cursor-pointer"
          aria-label="Close To-Do List"
        >
          <X className="w-4 h-4 text-[#1E293B]" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar overscroll-contain">
        {/* Top Planner Card with Date & 4 Stat Badges (Matching Picture Style) */}
        <div className="rounded-3xl bg-[#EEF4EB]/80 border-2 border-emerald-900/10 p-4 shadow-sm space-y-3 relative overflow-hidden">
          {/* Subtle background doodle lines */}
          <div className="absolute top-1 right-2 opacity-25 pointer-events-none text-2xl select-none">
            📖 ✍️
          </div>

          {/* Date Row with Navigator */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span
                className="text-lg sm:text-xl font-black text-[#1E293B] tracking-tight"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {formattedDate}
              </span>
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                  Today
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="w-7 h-7 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[10px] font-black text-stone-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="w-7 h-7 rounded-full bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Stat Cards in 4-column Grid (Exact Match to Picture Style) */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {/* Card 1: Completed */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'completed' ? 'today' : 'completed')}
              className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                filter === 'completed'
                  ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-400'
                  : 'bg-[#EBF7EE] border-[#D4EEDC] hover:border-emerald-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#D4F0DE] text-[#2E7D32] flex items-center justify-center shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span
                className="text-base sm:text-lg font-black text-[#1E293B] mt-1 leading-none"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {stats.completed}
              </span>
              <span className="text-[10px] font-bold text-stone-500 mt-0.5 leading-tight">
                Completed
              </span>
            </button>

            {/* Card 2: Pending */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'pending' ? 'today' : 'pending')}
              className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                filter === 'pending'
                  ? 'bg-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-400'
                  : 'bg-[#FEF7EC] border-[#FBEAD0] hover:border-amber-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#FCE5C2] text-[#B45309] flex items-center justify-center shadow-2xs">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span
                className="text-base sm:text-lg font-black text-[#1E293B] mt-1 leading-none"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {stats.pending}
              </span>
              <span className="text-[10px] font-bold text-stone-500 mt-0.5 leading-tight">
                Pending
              </span>
            </button>

            {/* Card 3: Overdue */}
            <div className="rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center border bg-[#F6EEFA] border-[#E9DAF2]">
              <div className="w-7 h-7 rounded-full bg-[#E5D2F2] text-[#7E22CE] flex items-center justify-center shadow-2xs">
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span
                className="text-base sm:text-lg font-black text-[#1E293B] mt-1 leading-none"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {stats.overdue}
              </span>
              <span className="text-[10px] font-bold text-stone-500 mt-0.5 leading-tight">
                Overdue
              </span>
            </div>

            {/* Card 4: High Priority */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'high_priority' ? 'today' : 'high_priority')}
              className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                filter === 'high_priority'
                  ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-400'
                  : 'bg-[#FDF0F0] border-[#FCDADA] hover:border-rose-400'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#FBD2D2] text-[#BE123C] flex items-center justify-center shadow-2xs">
                <Star className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span
                className="text-base sm:text-lg font-black text-[#1E293B] mt-1 leading-none"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                {stats.highPriority}
              </span>
              <span className="text-[10px] font-bold text-stone-500 mt-0.5 leading-tight">
                High Priority
              </span>
            </button>
          </div>
        </div>

        {/* Section Header: "Today" & "7 tasks >" (Matching Picture Style) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-xl font-black text-[#1E293B]"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              {filter === 'completed'
                ? 'Completed Tasks'
                : filter === 'pending'
                ? 'Pending Tasks'
                : filter === 'high_priority'
                ? 'High Priority Tasks'
                : 'Today'}
            </h3>
            {filter !== 'today' && (
              <button
                type="button"
                onClick={() => setFilter('today')}
                className="text-[10px] text-stone-500 hover:text-stone-800 underline font-bold"
              >
                Show All
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilter(filter === 'all' ? 'today' : 'all')}
            className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-[#1E293B] transition-colors cursor-pointer group"
          >
            <span>{filteredTodos.length} {filteredTodos.length === 1 ? 'task' : 'tasks'}</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Task Items List (Matching Picture Style) */}
        <div className="space-y-2.5">
          {filteredTodos.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 space-y-2">
              <Check className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-bold text-sm text-stone-600">No tasks in this list!</div>
              <p className="text-xs text-stone-400">Add a new daily task or choose from preset NYC routines below.</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => handleToggle(todo.id)}
                className={`bg-white rounded-2xl border px-3.5 py-3 flex items-center justify-between gap-3 shadow-2xs transition-all cursor-pointer group select-none ${
                  todo.completed
                    ? 'border-emerald-200/80 bg-stone-50/50 hover:border-emerald-300'
                    : 'border-stone-200 hover:border-amber-400 hover:shadow-xs'
                }`}
              >
                {/* Left: Checkbox + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rounded Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
                      todo.completed
                        ? 'bg-[#5DBB63] text-white shadow-xs'
                        : 'border-2 border-stone-300 group-hover:border-emerald-500 bg-white'
                    }`}
                  >
                    {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-sm truncate block transition-all ${
                        todo.completed
                          ? 'line-through text-stone-400 font-semibold'
                          : 'text-[#1E293B] font-bold'
                      }`}
                      style={{ fontFamily: 'Fredoka, sans-serif' }}
                    >
                      {todo.title}
                    </span>
                  </div>
                </div>

                {/* Right: Time + Colored Priority Dot + Delete */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {todo.time && (
                    <span className="text-xs font-semibold text-stone-400 whitespace-nowrap">
                      {todo.time}
                    </span>
                  )}
                  {/* Colored Priority Dot matching screenshot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 shadow-2xs"
                    style={{ backgroundColor: todo.colorDot }}
                    title={PRIORITY_COLORS[todo.priority]?.label || todo.priority}
                  />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(todo.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Task Accordion / Form */}
        {isAdding ? (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-md space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                Add New Task
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-stone-400 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                Task Description
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Bodega coffee, grocery shopping..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border-2 border-stone-200 focus:border-[#1E293B] outline-none text-xs font-bold text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TodoPriority)}
                  className="w-full px-2 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 outline-none cursor-pointer"
                >
                  <option value="low">Low (Green Dot)</option>
                  <option value="medium">Medium (Yellow Dot)</option>
                  <option value="high">High Priority (Red Dot)</option>
                  <option value="urgent">Urgent (Purple Dot)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#FCCE4C] hover:bg-amber-400 border border-[#1E293B] text-xs font-black text-[#1E293B] shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-3 rounded-2xl bg-white hover:bg-amber-50/60 border-2 border-dashed border-stone-300 hover:border-amber-400 text-xs font-extrabold text-stone-600 hover:text-stone-900 flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>+ Add New Task</span>
          </button>
        )}

       

        {/* Reset Defaults button */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] font-bold text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sample Planner Tasks</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold shadow-lg animate-in fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
