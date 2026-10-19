import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor,
  bgColor,
}) => {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs card-hover">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          {value}
        </p>
        {sublabel && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {sublabel}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center shrink-0 shadow-xs`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
    </div>
  );
};
