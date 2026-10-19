import React, { useState } from 'react';
import { taskApi } from '../../api/taskApi';
import { useToast } from '../../contexts/ToastContext';
import { TaskPriority } from '../../types';
import { Plus, Loader2 } from 'lucide-react';

interface QuickAddTaskProps {
  onTaskCreated: () => void;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setIsSubmitting(true);
    try {
      await taskApi.createTask({
        title: cleanTitle,
        priority,
        status: 'Pending',
      });
      setTitle('');
      showToast('Quick task added!', 'success');
      onTaskCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add task';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleQuickAdd}
      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick add a new task and press enter..."
          disabled={isSubmitting}
          className="w-full px-4 py-2 text-sm bg-transparent placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isSubmitting}
          className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Add</span>
        </button>
      </div>
    </form>
  );
};
