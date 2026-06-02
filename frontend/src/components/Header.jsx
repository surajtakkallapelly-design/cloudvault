import React from 'react';
import { Search, Cloud, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ searchVal, setSearchVal, filesCount, totalSize }) {
  const { theme, toggleTheme, user } = useAuth();

  // Format bytes to readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Storage limit of 20 GB for all users
  const storageLimit = 20 * 1024 * 1024 * 1024;
  const storagePercent = Math.min((totalSize / storageLimit) * 100, 100).toFixed(1);

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-900/60 bg-white/70 dark:bg-zinc-950/80 px-4 md:px-6 backdrop-blur-md transition-colors duration-300">
      {/* Search Input */}
      <div className="relative w-full max-w-[160px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="block w-full rounded-xl border-0 bg-zinc-100 dark:bg-zinc-900/50 pl-10 pr-3 py-2 text-xs md:text-sm text-zinc-800 dark:text-white placeholder-zinc-500 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          placeholder="Search files..."
        />
      </div>

      {/* Right control panel */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Storage Capacity Gauge */}
        <div className="hidden md:flex items-center gap-4 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900/50 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cloud className="h-4.5 w-4.5" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-300">Storage Used</span>
          </div>
          
          <div className="w-32">
            <div className="flex justify-between text-[10px] text-zinc-500 font-semibold mb-1">
              <span>{formatBytes(totalSize)}</span>
              <span>{formatBytes(storageLimit)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              ></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{storagePercent}%</p>
            <p className="text-[10px] text-zinc-500">{filesCount} files</p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-all cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </header>
  );
}
