import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Lock,
  Sun,
  Moon,
  ShieldCheck,
  Database,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const user = await login(values);
      const defaultPath = user.role === 'Admin' ? '/admin/dashboard' : '/user/dashboard';
      const from = location.state?.from?.pathname;
      const target = from && from !== '/' && from !== '/login' ? from : defaultPath;
      navigate(target, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[25%] w-[450px] h-[450px] rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Navbar Actions (Theme Switcher) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md shadow-slate-200/50 dark:shadow-none transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Dual-Column Container */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-blue-500/5 dark:shadow-black/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-enter">
        {/* Left Side: Modern Platform Features Showcase */}
        <div className="hidden lg:flex lg:col-span-5 p-10 flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 text-white relative">
          <div>
            {/* Platform Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>TaskFlow Next-Gen Suite</span>
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight leading-snug">
              Orchestrate Tasks.
              <br />
              <span className="text-blue-100 dark:text-blue-300">
                Control Data.
              </span>
            </h2>
            <p className="text-xs text-blue-100/90 dark:text-slate-400 mt-3 leading-relaxed">
              Unified role-based task management with integrated database management, multi-user assignment, and dual dashboards.
            </p>

            {/* Feature Highlights Cards */}
            <div className="space-y-3 mt-8">
              <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/[0.04] backdrop-blur-sm border border-white/15 dark:border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-blue-500/20 flex items-center justify-center text-white dark:text-blue-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dual Role Dashboards</h4>
                  <p className="text-[11px] text-blue-100/80 dark:text-slate-400 mt-0.5">
                    Tailored views for Administrators and Individual Contributors.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/[0.04] backdrop-blur-sm border border-white/15 dark:border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-indigo-500/20 flex items-center justify-center text-white dark:text-indigo-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Database Table Studio</h4>
                  <p className="text-[11px] text-blue-100/80 dark:text-slate-400 mt-0.5">
                    Inspect schema, manage table records with CRUD, and run SQL queries.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/[0.04] backdrop-blur-sm border border-white/15 dark:border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-emerald-500/20 flex items-center justify-center text-white dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cryptographic Security</h4>
                  <p className="text-[11px] text-blue-100/80 dark:text-slate-400 mt-0.5">
                    Stateless JWT auth tokens with 24-hour expiration and bcrypt encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live System Indicator */}
          <div className="pt-6 border-t border-white/15 dark:border-white/5 flex items-center justify-between text-[11px] text-blue-100/80 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400" />
              FastAPI Ready
            </span>
            <span className="font-mono text-blue-200/70 dark:text-slate-500">v2.4.0</span>
          </div>
        </div>

        {/* Right Side: Clean Sign-In Form (Light Default) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Sign In to TaskFlow
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back. Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start justify-between gap-3 p-4 mb-6 text-xs sm:text-sm font-medium text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/70 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-md shadow-rose-500/10 animate-enter">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 text-xs cursor-pointer p-0.5"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. admin or hari@taskflow.com"
                  {...register('username')}
                  onChange={(e) => {
                    register('username').onChange(e);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-xs sm:text-sm font-medium transition-all ${
                    errors.username
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  onChange={(e) => {
                    register('password').onChange(e);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-xs sm:text-sm font-medium transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me / Security text */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this workstation</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                256-bit JWT
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 active:opacity-90 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workplace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
