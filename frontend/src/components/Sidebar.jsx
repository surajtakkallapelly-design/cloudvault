import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  HardDrive, 
  Share2, 
  LogOut, 
  User as UserIcon,
  Clock,
  Star,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout, updateUser } = useAuth();



  const navigation = [
    { name: 'All Files', icon: HardDrive, id: 'my-files' },
    { name: 'Recent', icon: Clock, id: 'recent' },
    { name: 'Starred', icon: Star, id: 'starred' },
    { name: 'Shared Docs', icon: Share2, id: 'shared' },
    { name: 'Trash', icon: Trash2, id: 'trash' },
    { name: 'Settings', icon: SettingsIcon, id: 'settings' },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex w-64 flex-col bg-white dark:bg-[#111317] border-r border-zinc-200/80 dark:border-zinc-900 p-4 transition-all duration-300 text-zinc-550 dark:text-zinc-400">
      {/* Brand Logo */}
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-3 px-2 py-4 text-left border-0 bg-transparent hover:opacity-80 active:scale-98 transition-all cursor-pointer w-fit"
        title="Refresh CloudVault"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-650/20">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide leading-none">CloudVault</h1>
          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1 block">Micro Drive</span>
        </div>
      </button>

      {/* Nav List */}
      <nav className="mt-8 flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-white dark:text-zinc-950 shadow-sm dark:shadow-md font-extrabold scale-[1.02]'
                  : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.name}</span>
            </button>
          );
        })}
      </nav>



      {/* Profile Box */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-900 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 p-3 border border-zinc-200/60 dark:border-zinc-900/40">
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
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-500/5 dark:text-rose-450 dark:hover:bg-rose-500/5 transition-all cursor-pointer border-0"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
