import { TaskStatus, TaskPriority, UserRole } from '../types';

export const getStatusBadgeStyle = (status: TaskStatus): string => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
    case 'Pending':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  }
};

export const getPriorityBadgeStyle = (priority: TaskPriority): string => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    case 'High':
      return 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60';
    case 'Medium':
      return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
    case 'Low':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

export const getRoleBadgeStyle = (role: UserRole): string => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'User':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }
};

export const formatDisplayDate = (dateStr?: string | null): { text: string; isOverdue: boolean; isToday: boolean } => {
  if (!dateStr) return { text: 'No due date', isOverdue: false, isToday: false };

  const target = new Date(dateStr);
  const now = new Date();

  const isToday =
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate();

  const isOverdue = target.getTime() < now.getTime() && !isToday;

  const formatted = target.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { text: formatted, isOverdue, isToday };
};
