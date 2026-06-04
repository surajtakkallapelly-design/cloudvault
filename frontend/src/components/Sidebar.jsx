import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  HardDrive, 
  Share2, 
  LogOut, 
  Clock,
  Star,
  Trash2,
  Settings as SettingsIcon,
  Cloud,
  X
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, isOpen, onClose, totalSize, filesCount }) {
  const { user, logout } = useAuth();

  // Format bytes to readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const storageLimit = 20 * 1024 * 1024 * 1024;
  const storagePercent = Math.min((totalSize / storageLimit) * 100, 100).toFixed(1);

  const navigation = [
    { name: 'All Files', icon: HardDrive, id: 'my-files' },
    { name: 'Recent', icon: Clock, id: 'recent' },
    { name: 'Starred', icon: Star, id: 'starred' },
    { name: 'Shared with me', icon: Share2, id: 'shared' },
    { name: 'Trash', icon: Trash2, id: 'trash' },
    { name: 'Settings', icon: SettingsIcon, id: 'settings' },
  ];

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (onClose) onClose(); // Close mobile sidebar after navigation
  };

  return (
    <>
      {/* Mobile Overlay Background */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-all duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar aside */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 md:w-64 flex-col bg-white dark:bg-[#111317] border-r border-zinc-200/80 dark:border-zinc-900 p-4 transition-all duration-300 text-zinc-500 dark:text-zinc-400 overflow-y-auto
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Brand Logo + Close button */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => { handleTabClick('my-files'); window.location.reload(); }}
            className="flex items-center gap-3 px-2 py-3 text-left border-0 bg-transparent hover:opacity-80 active:scale-98 transition-all cursor-pointer w-fit"
            title="CloudVault Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide leading-none">CloudVault</h1>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1 block">Micro Drive</span>
            </div>
          </button>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
            title="Close Menu"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="mt-6 flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-white dark:text-zinc-950 shadow-sm dark:shadow-md font-extrabold scale-[1.02]'
                    : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Storage Gauge */}
        {totalSize !== undefined && (
          <div className="flex flex-col gap-2 p-3.5 mb-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                <Cloud className="h-4 w-4" />
                Storage
              </span>
              <span>{storagePercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-semibold">
              <span>{formatBytes(totalSize)} of {formatBytes(storageLimit)}</span>
              <span>{filesCount} files</span>
            </div>
          </div>
        )}

        {/* Profile Box + Sign Out */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-900 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 p-3 border border-zinc-200/60 dark:border-zinc-900/40 mb-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black border ${user?.avatarColor || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{user?.name}</p>
              <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-500/5 dark:text-rose-400 dark:hover:bg-rose-500/5 transition-all cursor-pointer border-0 bg-transparent"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
