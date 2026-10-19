import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, TaskFormData, TaskStatus, TaskPriority, UserWithStats } from '../../types';
import { taskApi } from '../../api/taskApi';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { UserMultiSelect } from './UserMultiSelect';
import { X, Loader2, AlertCircle } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed'] as const).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'] as const),
  due_date: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const { showToast } = useToast();

  const isEditing = Boolean(taskToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      due_date: '',
    },
  });

  // Handle ESC key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Load team users for assignment (exclude Admin)
  useEffect(() => {
    if (isOpen) {
      userApi
        .getUsers()
        .then((data) => setUsers(data.filter((u) => u.role !== 'Admin')))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      let formattedDate = '';
      if (taskToEdit.due_date) {
        try {
          formattedDate = taskToEdit.due_date.split('T')[0].split(' ')[0];
        } catch {
          formattedDate = '';
        }
      }
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        status: taskToEdit.status,
        priority: taskToEdit.priority,
        due_date: formattedDate,
      });
      setSelectedUserIds(
        taskToEdit.assignments ? taskToEdit.assignments.map((a) => a.user_id) : []
      );
    } else {
      reset({
        title: '',
        description: '',
        status: 'Pending',
        priority: 'Medium',
        due_date: '',
      });
      setSelectedUserIds([]);
    }
    setApiError(null);
  }, [taskToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    let parsedDate: string | undefined = undefined;
    if (values.due_date && values.due_date.trim() !== '') {
      parsedDate = values.due_date.trim();
    }

    const payload: TaskFormData = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      status: (values.status as TaskStatus) || 'Pending',
      priority: values.priority as TaskPriority,
      due_date: parsedDate,
      assigned_user_ids: selectedUserIds,
    };

    try {
      if (isEditing && taskToEdit) {
        await taskApi.updateTask(taskToEdit.id, payload);
        showToast('Task updated successfully!', 'success');
      } else {
        await taskApi.createTask(payload);
        showToast('Task created and assigned successfully!', 'success');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Failed to save task');
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Task & Assignments' : 'Create Task & Assign Users'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          {apiError && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Conduct security penetration review"
              {...register('title')}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Task instructions and expectations..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Priority, Status (if editing), Due Date Row */}
          <div className={`grid grid-cols-1 ${isEditing ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-xs font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {isEditing && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Overall Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-xs font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-xs font-medium"
              />
            </div>
          </div>

          {/* Multi-User Assignment Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Assign to Team Members ({selectedUserIds.length} selected)
            </label>
            <UserMultiSelect
              users={users}
              selectedUserIds={selectedUserIds}
              onChange={setSelectedUserIds}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create & Assign Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
