import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileCode2, CheckCircle2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import axios from 'axios';

export default function DropzoneUpload({ onUploadSuccess, activeFolder, totalSize, storageLimit }) {
  const { api, updateUser } = useAuth();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const handleTrigger = () => {
      onButtonClick();
    };
    window.addEventListener('trigger-mobile-upload', handleTrigger);
    return () => {
      window.removeEventListener('trigger-mobile-upload', handleTrigger);
    };
  }, []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const uploadFile = async (file) => {
    setError('');
    setSuccess(false);

    if (totalSize !== undefined && storageLimit !== undefined && (totalSize + file.size > storageLimit)) {
      setError(`Upload Blocked: Exceeds your vault storage capacity of ${formatBytes(storageLimit)}.`);
      return;
    }

    setCurrentFile(file);
    setUploading(true);
    setProgress(0);

    try {
      // 1. Get presigned upload URL from backend
      const { data } = await api.get('/api/files/upload-url', {
        params: {
          fileName: file.name,
          fileType: file.type || 'application/octet-stream'
        }
      });

      const { uploadUrl, s3Key } = data;

      // 2. Upload file directly to S3 (or mock route) using PUT
      const options = {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const current = progressEvent.loaded;
          const percentCompleted = Math.round((current * 100) / total);
          setProgress(percentCompleted);
        },
      };

      await axios.put(uploadUrl, file, options);

      // 3. Save file metadata in Mongo database
      await api.post('/api/files/save-metadata', {
        fileName: file.name,
        s3Key,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        folder: activeFolder || 'Root'
      });

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset states
      setTimeout(() => {
        setUploading(false);
        setCurrentFile(null);
        setProgress(0);
        setSuccess(false);
      }, 2500);

    } catch (err) {
      console.error('Upload process failed:', err);
      setError(err.response?.data?.message || err.message || 'File upload failed. Please try again.');
      setUploading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Premium Outer Border Container with Glow effect */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading && !success ? onButtonClick : undefined}
        className={`relative overflow-hidden rounded-2xl transition-all duration-300 ease-in-out cursor-pointer ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] dark:shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
            : 'border-zinc-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950/30 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/55 dark:hover:bg-zinc-950/50'
        } ${uploading || success ? 'p-8 min-h-[170px] border' : 'p-0 md:p-8 min-h-0 md:min-h-[170px] border-0 md:border'} ${uploading ? 'pointer-events-none' : ''}`}
      >
        {/* Animated Gradient Edge Glow Overlay on Active Drag */}
        {dragActive && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl animate-pulse" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[170px]">
          {!uploading && !success && (
            <div className="space-y-4 hidden md:block">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Drag and drop files here or <span className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">browse local files</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Secure upload directly to encrypted cloud storage keys
                </p>
              </div>
            </div>
          )}

          {uploading && !success && (
            <div className="w-full space-y-4 max-w-md py-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400">
                  <FileCode2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">{currentFile?.name}</p>
                  <p className="text-xs text-zinc-500">{formatBytes(currentFile?.size || 0)}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                    Transmitting packet stream...
                  </span>
                  <span>{progress === 100 ? 'Writing registry...' : 'Uploading'}</span>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center justify-center py-2 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-95 duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 mb-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Upload successfully verified</p>
              <p className="mt-1 text-xs text-zinc-500">File metadata logged in Mongoose index</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-rose-500/5 border border-rose-500/15 p-4 text-sm text-rose-450 dark:text-rose-400 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Upload Transmission Blocked</p>
              <p className="mt-1 text-xs text-rose-500/80 dark:text-rose-400/80 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating action button for mobile uploads */}
      {!uploading && !success && (
        <button
          onClick={onButtonClick}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-500/25 md:hidden"
          title="Upload Document"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}


    </div>
  );
}
