import React, { useState } from 'react';
import { databaseApi, SqlQueryResult } from '../../api/databaseApi';
import { Terminal, Play, X, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface SqlQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTableName?: string;
  onRefreshNeeded?: () => void;
}

export const SqlQueryModal: React.FC<SqlQueryModalProps> = ({
  isOpen,
  onClose,
  activeTableName,
  onRefreshNeeded,
}) => {
  const [query, setQuery] = useState(`SELECT * FROM ${activeTableName || 'users'} LIMIT 20;`);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!query.trim()) return;
    setIsExecuting(true);
    setError(null);
    try {
      const res = await databaseApi.executeQuery(query.trim());
      setResult(res);
      if (!res.is_select && onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Query execution failed.');
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const sampleQueries = [
    `SELECT * FROM users LIMIT 25;`,
    `SELECT * FROM tasks WHERE status = 'Completed';`,
    `SELECT * FROM task_assignments;`,
    `PRAGMA table_info(users);`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                SQL Query Console
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute raw SQLite queries with administrative privileges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Quick Queries:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(sq)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 transition-colors shrink-0"
              >
                {sq}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM table_name;"
              className="w-full px-4 py-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Ctrl+Enter or click Run Query to execute
            </span>
            <button
              onClick={handleRun}
              disabled={isExecuting || !query.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs shadow-md shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExecuting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-mono">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Meta stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Query completed
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {result.execution_ms} ms
                </span>
                {result.is_select ? (
                  <span className="font-mono">
                    Returned {result.total_returned} row(s)
                  </span>
                ) : (
                  <span className="font-mono">
                    {result.rows_affected} row(s) affected
                  </span>
                )}
              </div>

              {/* Table output for SELECT */}
              {result.is_select && result.columns && result.rows && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-72">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0">
                      <tr>
                        {result.columns.map((c) => (
                          <th key={c} className="p-2.5 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          {result.columns!.map((c) => (
                            <td key={c} className="p-2.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {row[c] === null ? (
                                <span className="text-slate-400 italic">null</span>
                              ) : (
                                String(row[c])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!result.is_select && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {result.message}
                </div>
              )}
            </div>
          )}

          {!error && !result && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Execute a query to inspect raw database output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
