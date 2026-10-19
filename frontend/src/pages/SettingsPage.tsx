import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getRoleBadgeStyle } from '../utils/formatters';
import {
  Calendar,
  Moon,
  Sun,
  Shield,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const roleStyle = user ? getRoleBadgeStyle(user.role) : null;

  return (
    <div className="max-w-4xl space-y-8 animate-enter">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Account & App Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, security preferences, and interface theme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {user?.name}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">@{user?.username}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{user?.email}</p>

          {roleStyle && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleStyle} mb-4`}
            >
              {user?.role === 'Admin' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
              {user?.role} Role
            </span>
          )}

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Joined:{' '}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'Recent'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Shield className="w-4 h-4 text-blue-500 shrink-0" />
              <span>JWT Authentication Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Appearance Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Appearance & Theme
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Select how TaskFlow looks on your current device.
            </p>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Current active color palette
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          {/* System & Architecture Info */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Backend Integration Info
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Details on the live full-stack connection.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">API Base Endpoint</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">FastAPI Interactive Docs</span>
                <a
                  href={(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api').replace('/api', '/docs')}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api').replace('/api', '/docs')}
                </a>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  SQLite (Role-Based Task Management Schema)
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-200 mb-1">
              Session
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">
              Sign out from your current device session.
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-600/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of TaskFlow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
