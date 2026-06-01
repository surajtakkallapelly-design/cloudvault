import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HelpBot from './HelpBot';
import { HardDrive, Star, Settings as SettingsIcon, Upload } from 'lucide-react';

export default function DashboardLayout({ 
  children, 
  currentTab, 
  setCurrentTab, 
  searchVal, 
  setSearchVal, 
  filesCount, 
  totalSize 
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#060608] text-zinc-800 dark:text-zinc-100 pl-0 md:pl-64 transition-all duration-300">
      
      {/* Custom Left Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Minimalist Top Header */}
        <Header 
          searchVal={searchVal} 
          setSearchVal={setSearchVal} 
          filesCount={filesCount}
          totalSize={totalSize}
        />

        {/* Spacious Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 max-w-6xl w-full mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Support Chatbot widget */}
      <HelpBot />

      {/* Fixed bottom navigation bar for mobile touch screens */}
      <div className="fixed bottom-0 left-0 right-0 h-16 z-30 md:hidden border-t border-zinc-200 dark:border-zinc-900 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-lg flex items-center justify-around px-4 transition-colors duration-300">
        <button 
          onClick={() => setCurrentTab('my-files')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentTab === 'my-files' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-zinc-550 dark:text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-350'
          }`}
        >
          <HardDrive className="h-5 w-5" />
          <span>All Files</span>
        </button>

        <button 
          onClick={() => setCurrentTab('starred')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentTab === 'starred' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-zinc-550 dark:text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-350'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Starred</span>
        </button>

        <button 
          onClick={() => window.dispatchEvent(new Event('trigger-mobile-upload'))}
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-555 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Upload</span>
        </button>

        <button 
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            currentTab === 'settings' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-zinc-550 dark:text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-350'
          }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
