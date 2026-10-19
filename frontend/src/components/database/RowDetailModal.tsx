import React, { useState } from 'react';
import { X, Copy, Check, Eye } from 'lucide-react';

interface RowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  row: Record<string, unknown> | null;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({
  isOpen,
  onClose,
  tableName,
  row,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !row) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Record Inspector
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Table: {tableName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {Object.entries(row).map(([key, val]) => (
            <div
              key={key}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
            >
              <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                {key}
              </span>
              <span className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all text-left sm:text-right">
                {val === null || val === undefined ? (
                  <span className="text-slate-400 italic">null</span>
                ) : typeof val === 'boolean' ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      val
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {val ? 'TRUE' : 'FALSE'}
                  </span>
                ) : (
                  String(val)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
