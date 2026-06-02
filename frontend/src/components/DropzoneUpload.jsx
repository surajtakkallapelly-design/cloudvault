import React, { useState, useRef, useEffect } from 'react';
import { useUpload } from '../context/UploadContext';
import { Upload, Plus } from 'lucide-react';

export default function DropzoneUpload({ activeFolder, totalSize }) {
  const { uploadFiles } = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Setup mobile upload trigger
  useEffect(() => {
    const handleTrigger = () => {
      onButtonClick();
    };
    window.addEventListener('trigger-mobile-upload', handleTrigger);
    return () => {
      window.removeEventListener('trigger-mobile-upload', handleTrigger);
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files, activeFolder, totalSize);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files, activeFolder, totalSize);
      e.target.value = null; // Reset to allow uploading the same file again
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      {/* Outer Border Container with Glow effect */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative overflow-hidden rounded-3xl transition-all duration-300 ease-in-out cursor-pointer p-6 md:p-8 min-h-[180px] border border-dashed select-none ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] dark:shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
            : 'border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/25 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/45'
        }`}
      >
        {/* Animated Gradient Edge Glow Overlay on Active Drag */}
        {dragActive && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 blur-xl animate-pulse" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          multiple
        />

        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 transition-colors">
              <Upload className="h-5 w-5 text-indigo-550 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-extrabold text-zinc-800 dark:text-zinc-250 uppercase tracking-wider">
                Drag & Drop Files Here
              </p>
              <p className="mt-1.5 text-xs text-zinc-500">
                or <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">browse storage</span> to upload multiple items
              </p>
              <p className="mt-3 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">
                Direct encrypted S3 streaming
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating action button for mobile uploads */}
      <button
        onClick={onButtonClick}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-500/25 md:hidden"
        title="Upload Documents"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
