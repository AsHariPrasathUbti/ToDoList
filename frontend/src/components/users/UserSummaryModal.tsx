import React, { useEffect, useState, useCallback } from 'react';
import { UserSummaryStats, UserWithStats } from '../../types';
import { dashboardApi } from '../../api/dashboardApi';
import { getStatusBadgeStyle, getPriorityBadgeStyle } from '../../utils/formatters';
import { X, Loader2 } from 'lucide-react';

interface UserSummaryModalProps {
  user: UserWithStats | null;
  onClose: () => void;
}

export const UserSummaryModal: React.FC<UserSummaryModalProps> = ({ user, onClose }) => {
  const [summary, setSummary] = useState<UserSummaryStats | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (user) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, handleKeyDown]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      dashboardApi
        .getUserSummary(user.id)
        .then((data) => setSummary(data))
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</h3>
              <p className="text-[11px] text-slate-400">@{user.username} • {user.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : summary ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">{summary.total_assigned}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Assigned</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{summary.completed}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Done</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                  <p className="text-lg font-black text-amber-700 dark:text-amber-300">{summary.pending}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Pending</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300">{summary.overdue}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Overdue</p>
                </div>
              </div>

              {/* Completion Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
                  <span className="text-blue-600 font-bold">{summary.completion_percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${summary.completion_percentage}%` }}
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assigned Deliverables ({summary.tasks.length})
                </h4>
                {summary.tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tasks currently assigned to this user.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="truncate mr-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                          <span className={`text-[10px] font-semibold border px-1.5 py-0.2 rounded ${getPriorityBadgeStyle(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeStyle(t.my_status || t.status)}`}>
                          {t.my_status || t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Unable to load summary.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
