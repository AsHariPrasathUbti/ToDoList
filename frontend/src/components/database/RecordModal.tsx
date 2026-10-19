import React, { useState, useEffect } from 'react';
import { ColumnMeta } from '../../api/databaseApi';
import { X, Save, AlertCircle, Key, Lock } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  tableName: string;
  columns: ColumnMeta[];
  primaryKeys: string[];
  initialData?: Record<string, unknown> | null;
  mode: 'create' | 'edit';
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tableName,
  columns,
  primaryKeys,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (mode === 'edit' && initialData) {
        setFormData({ ...initialData });
      } else {
        const defaults: Record<string, unknown> = {};
        columns.forEach((col) => {
          if (!col.primary_key) {
            if (col.type.toLowerCase().includes('bool')) {
              defaults[col.name] = col.default === '1' || col.default === 'true';
            } else {
              defaults[col.name] = '';
            }
          }
        });
        setFormData(defaults);
      }
    }
  }, [isOpen, mode, initialData, columns]);

  if (!isOpen) return null;

  const handleChange = (colName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [colName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Clean payload: exclude empty string values for non-string nullable columns
      const cleanPayload: Record<string, unknown> = {};
      columns.forEach((col) => {
        const val = formData[col.name];
        if (mode === 'edit' && col.primary_key) {
          return; // Do not send PK on update body
        }
        if (mode === 'create' && col.primary_key && (val === '' || val === undefined || val === null)) {
          return; // Let autoincrement handle PK
        }

        const typeLower = col.type.toLowerCase();
        if (typeLower.includes('int')) {
          if (val !== '' && val !== null && val !== undefined) {
            cleanPayload[col.name] = Number(val);
          }
        } else if (typeLower.includes('bool')) {
          cleanPayload[col.name] = Boolean(val);
        } else if (typeLower.includes('float') || typeLower.includes('numeric')) {
          if (val !== '' && val !== null && val !== undefined) {
            cleanPayload[col.name] = parseFloat(String(val));
          }
        } else {
          // Strings or text
          if (val !== undefined && val !== null) {
            cleanPayload[col.name] = val;
          }
        }
      });

      await onSave(cleanPayload);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-enter">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="capitalize">{mode} Record</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {tableName}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === 'create'
                ? 'Fill in column values to insert a new row.'
                : 'Modify table attributes for this record.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col) => {
              const isPk = primaryKeys.includes(col.name) || col.primary_key;
              const isReadOnly = mode === 'edit' && isPk;
              const typeLower = col.type.toLowerCase();
              const isBoolean = typeLower.includes('bool');
              const isPassword = tableName === 'users' && (col.name === 'hashed_password' || col.name === 'password');
              const isDate = (col.name.toLowerCase().includes('date') || typeLower.includes('date')) && !isPassword;
              const isTextarea = typeLower.includes('text') && !isPassword;

              return (
                <div
                  key={col.name}
                  className={isTextarea ? 'sm:col-span-2' : ''}
                >
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      {isPk && <Key className="w-3.5 h-3.5 text-amber-500" />}
                      {isPassword && <Lock className="w-3.5 h-3.5 text-indigo-500" />}
                      <span className="font-mono">{col.name}</span>
                      {!col.nullable && !isPk && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {col.type}
                    </span>
                  </label>

                  {isBoolean ? (
                    <div className="flex items-center gap-3 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(formData[col.name])}
                          onChange={(e) => handleChange(col.name, e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{Boolean(formData[col.name]) ? 'True (Active/Enabled)' : 'False (Disabled)'}</span>
                      </label>
                    </div>
                  ) : isDate ? (
                    <input
                      type="date"
                      value={formData[col.name] ? String(formData[col.name]).split('T')[0].split(' ')[0] : ''}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly
                          ? 'opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  ) : isTextarea ? (
                    <textarea
                      rows={3}
                      value={String(formData[col.name] ?? '')}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      placeholder={`Enter ${col.name}`}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={typeLower.includes('int') || typeLower.includes('numeric') ? 'number' : 'text'}
                      value={String(formData[col.name] ?? '')}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                      placeholder={isPk && mode === 'create' ? 'Auto-generated ID' : `Enter ${col.name}`}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReadOnly
                          ? 'opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  )}

                  {isPassword && (
                    <p className="mt-1 text-[11px] text-indigo-500 dark:text-indigo-400">
                      Plaintext input will be automatically hashed with bcrypt.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Record' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
