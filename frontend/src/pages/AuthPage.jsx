import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot-email' | 'forgot-otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, requestOtp, resetPassword } = useAuth();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (mode === 'login' || mode === 'signup') {
      if (mode === 'signup' && !name) {
        setError('Name is required.');
        return false;
      }
      if (!email || !password) {
        setError('Please fill in all fields.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
    }

    if (mode === 'forgot-otp') {
      if (!otp || !newPassword) {
        setError('Please enter the OTP and a new password.');
        return false;
      }
      if (otp.length !== 6 || isNaN(otp)) {
        setError('OTP must be a 6-digit number.');
        return false;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setLoading(true);
    let result;

    if (mode === 'login') {
      result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } else if (mode === 'signup') {
      result = await signup(name, email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } else if (mode === 'forgot-email') {
      result = await requestOtp(email);
      setLoading(false);
      if (result.success) {
        setSuccessMessage('OTP sent successfully. Please check your email.');
        setMode('forgot-otp');
      } else {
        setError(result.error);
      }
    } else if (mode === 'forgot-otp') {
      result = await resetPassword(email, otp, newPassword);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  const resetFields = () => {
    setError('');
    setSuccessMessage('');
    setName('');
    setEmail('');
    setPassword('');
    setOtp('');
    setNewPassword('');
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create your account';
      case 'forgot-email':
        return 'Reset your password';
      case 'forgot-otp':
        return 'Enter verification OTP';
      case 'login':
      default:
        return 'Welcome back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Get 20 GB of free cloud storage';
      case 'forgot-email':
        return 'We will send a One-Time Password to your email';
      case 'forgot-otp':
        return `Please check your inbox for the code sent to ${email}`;
      case 'login':
      default:
        return 'Access your cloud vault securely';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            {getTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {getSubtitle()}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/40 bg-white/70 dark:bg-zinc-950/75 border-zinc-200 dark:border-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-450 dark:text-emerald-450">
                {successMessage}
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-550 dark:text-zinc-400" htmlFor="name">Full Name</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-zinc-450 dark:text-slate-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-zinc-100/50 dark:bg-slate-900/50 pl-10 pr-3 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 ring-1 ring-inset ring-zinc-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot-otp' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-550 dark:text-zinc-400" htmlFor="email">Email Address</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-zinc-450 dark:text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-zinc-100/50 dark:bg-slate-900/50 pl-10 pr-3 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 ring-1 ring-inset ring-zinc-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-550 dark:text-zinc-400" htmlFor="password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot-email'); setError(''); }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-zinc-450 dark:text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-zinc-100/50 dark:bg-slate-900/50 pl-10 pr-10 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 ring-1 ring-inset ring-zinc-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-450 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot-otp' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-550 dark:text-zinc-400" htmlFor="otp">Verification OTP</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-zinc-450 dark:text-slate-500" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-zinc-100/50 dark:bg-slate-900/50 pl-10 pr-3 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 ring-1 ring-inset ring-zinc-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm transition-all"
                      placeholder="6-digit code"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-550 dark:text-zinc-400" htmlFor="new-password">New Password</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-zinc-450 dark:text-slate-500" />
                    </div>
                    <input
                      id="new-password"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-zinc-100/50 dark:bg-slate-900/50 pl-10 pr-10 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 ring-1 ring-inset ring-zinc-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-450 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  mode === 'login' ? 'Sign In' :
                  mode === 'signup' ? 'Sign Up' :
                  mode === 'forgot-email' ? 'Send OTP Code' : 'Reset Password & Login'
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center">
            {mode === 'login' || mode === 'signup' ? (
              <button
                onClick={() => { resetFields(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            ) : (
              <button
                onClick={() => { resetFields(); setMode('login'); }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
