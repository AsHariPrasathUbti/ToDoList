import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 animate-enter">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Account Access
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Role-Based Task Management System
          </p>
        </div>

        {/* Informational Card */}
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 mb-6 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
            <KeyRound className="w-4 h-4 text-blue-600" />
            Enterprise Access Policy
          </p>
          <p className="leading-relaxed">
            Public user self-registration is restricted. User accounts are created and managed by
            system administrators through the User Management panel.
          </p>
        </div>

        {/* Predefined Account Quick Access */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Predefined Credentials:
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all group flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Account
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Username: <code className="font-mono text-blue-600 dark:text-blue-400">admin</code> • Pass: <code className="font-mono text-slate-500">Admin@12345</code>
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all group flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Regular User Account
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Username: <code className="font-mono text-blue-600 dark:text-blue-400">hari</code> • Pass: <code className="font-mono text-slate-500">Hari@12345</code>
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Go to Login Button */}
        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all duration-150"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
