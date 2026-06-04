import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HelpBot from './HelpBot';
import { HardDrive, Star, Settings as SettingsIcon, Share2, Clock, Upload, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ 
  children, 
  currentTab, 
  setCurrentTab, 
  searchVal, 
  setSearchVal, 
  filesCount, 
  totalSize,
  onUploadClick
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#060608] text-zinc-800 dark:text-zinc-100 pl-0 md:pl-64 transition-all duration-300">
      
      {/* Custom Left Sidebar — controlled by hamburger on mobile */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalSize={totalSize}
        filesCount={filesCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Minimalist Top Header */}
        <Header 
          searchVal={searchVal} 
          setSearchVal={setSearchVal} 
          filesCount={filesCount}
          totalSize={totalSize}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Spacious Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Support Chatbot widget */}
      <HelpBot />

      {/* ─── Fixed bottom navigation bar — Mobile only ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden">
        {/* Safe-area spacer for notched phones */}
        <div className="border-t border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg">
          <div className="flex items-center justify-around px-1 py-1.5">

            {/* Drive */}
            <button 
              onClick={() => setCurrentTab('my-files')}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer min-w-[52px] ${
                currentTab === 'my-files' 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <HardDrive className="h-5 w-5" />
              <span>Drive</span>
            </button>

            {/* Starred */}
            <button 
              onClick={() => setCurrentTab('starred')}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer min-w-[52px] ${
                currentTab === 'starred' 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Star className="h-5 w-5" />
              <span>Starred</span>
            </button>

            {/* Upload (centre FAB) */}
            <button 
              onClick={() => {
                setCurrentTab('my-files');
                // Trigger upload drawer by dispatching a custom event
                window.dispatchEvent(new CustomEvent('mobile-upload-trigger'));
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer min-w-[52px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Upload className="h-5 w-5" />
              <span>Upload</span>
            </button>

            {/* Shared */}
            <button 
              onClick={() => setCurrentTab('shared')}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer min-w-[52px] ${
                currentTab === 'shared' 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Share2 className="h-5 w-5" />
              <span>Shared</span>
            </button>

            {/* More (opens sidebar drawer with Trash, Settings, Recent, etc.) */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer min-w-[52px] ${
                (currentTab === 'trash' || currentTab === 'settings' || currentTab === 'recent')
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>

          </div>
          {/* iPhone-style home indicator spacer */}
          <div className="h-safe-bottom pb-1" />
        </div>
      </div>
    </div>
  );
}
