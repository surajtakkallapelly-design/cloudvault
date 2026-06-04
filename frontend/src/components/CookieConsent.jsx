import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck, BarChart2, Settings } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const consent = localStorage.getItem('cloudvault-cookie-consent');
    if (!consent) {
      // Slight delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cloudvault-cookie-consent', 'accepted');
    localStorage.setItem('cloudvault-cookie-date', new Date().toISOString());
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cloudvault-cookie-consent', 'declined');
    localStorage.setItem('cloudvault-cookie-date', new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] animate-in slide-in-from-bottom-4 duration-500">
      {/* Backdrop blur on mobile */}
      <div className="bg-white/95 dark:bg-zinc-950/98 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
          
          {/* Main row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mt-0.5">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  We use cookies 🍪
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-2xl">
                  CloudVault uses essential cookies to keep you logged in securely and remember your preferences. 
                  We do <strong className="text-zinc-700 dark:text-zinc-300">not</strong> use tracking or advertising cookies.{' '}
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    {showDetails ? 'Hide details' : 'Learn more'}
                  </button>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleDecline}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Expandable details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Essential Cookies</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Keeps you logged in securely for 24 hours. Required for the app to work.</p>
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Always Active</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800">
                <Settings className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Preference Cookies</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Remembers your theme (light/dark) and display settings.</p>
                  <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Optional</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-500/5 border border-zinc-200 dark:border-zinc-800 opacity-60">
                <BarChart2 className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Analytics Cookies</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">We do <strong>not</strong> collect analytics or tracking data. Zero third-party cookies.</p>
                  <span className="inline-block mt-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Not Used</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
