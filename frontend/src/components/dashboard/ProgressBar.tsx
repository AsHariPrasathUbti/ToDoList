import React from 'react';

interface ProgressBarProps {
  percentage: number;
  total: number;
  completed: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, total, completed }) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/20 dark:border-teal-500/15">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Overall Completion Rate
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {completed} of {total} total tasks completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {clamped}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700 ease-out shadow-xs"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
