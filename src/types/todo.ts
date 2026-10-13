export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoItem {
  id: string;
  title: string;
  time?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: TodoPriority;
  colorDot: string; // e.g. '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'
  category?: string;
  createdAt: number;
}
