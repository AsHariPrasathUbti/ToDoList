import React, { useEffect, useState, useCallback } from 'react';
import { Task, TaskStatus } from '../../types';
import { getStatusBadgeStyle, getPriorityBadgeStyle, formatDisplayDate } from '../../utils/formatters';
import { X, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface UserTaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdateStatus: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  currentUserId: number;
}

export const UserTaskDetailModal: React.FC<UserTaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateStatus,
  currentUserId,
}) => {
  const [internalStatus, setInternalStatus] = useState<TaskStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (task) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [task, handleKeyDown]);

  useEffect(() => {
    if (task) {
      const userAssignment =
        task.assignments?.find((a) => a.user_id === currentUserId) || task.user_assignment;
      setInternalStatus(userAssignment?.status || 'Pending');
    } else {
      setInternalStatus(null);
    }
  }, [task, currentUserId]);

  if (!task) return null;

  const currentStatus: TaskStatus = internalStatus || 'Pending';
  const { text: dueDateText, isOverdue, isToday } = formatDisplayDate(task.due_date);

  const handleStatusClick = async (nextStatus: TaskStatus) => {
    if (nextStatus === currentStatus || isUpdating) return;
    setIsUpdating(true);
    setInternalStatus(nextStatus);
    try {
      await onUpdateStatus(task.id, nextStatus);
    } catch {
      // Revert if failed
      const userAssignment =
        task.assignments?.find((a) => a.user_id === currentUserId) || task.user_assignment;
      setInternalStatus(userAssignment?.status || 'Pending');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeStyle(
                task.priority
              )}`}
            >
              {task.priority} Priority
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                currentStatus
              )}`}
            >
              My Status: {currentStatus}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {task.title}
            </h2>
            {task.description ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-2">No description provided.</p>
            )}
          </div>

          {/* Due date info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Due Date:</span>
              <span
                className={
                  isOverdue ? 'text-rose-600 font-bold' : isToday ? 'text-amber-600 font-bold' : ''
                }
              >
                {dueDateText} {isOverdue && '(Overdue)'} {isToday && '(Today)'}
              </span>
            </div>
            {isOverdue && <AlertCircle className="w-4 h-4 text-rose-500" />}
          </div>

          {/* Interactive My Status Update Control */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                Update My Assignment Status
              </h4>
              {isUpdating && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  disabled={isUpdating}
                  onClick={() => handleStatusClick(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentStatus === st
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              * Your status updates independently and reflects on the Admin dashboard in real time.
            </p>
          </div>

          {/* Assigned Team Members (View-Only) */}
          {task.assignments && task.assignments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Team Assignees ({task.assignments.length})
              </h4>
              <div className="space-y-1.5">
                {task.assignments.map((a) => {
                  const effectiveStatus = a.user_id === currentUserId ? currentStatus : a.status;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                          {a.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {a.user?.name || `User #${a.user_id}`}{' '}
                          {a.user_id === currentUserId && '(You)'}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeStyle(
                          effectiveStatus
                        )}`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
