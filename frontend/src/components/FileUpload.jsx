import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function FileUpload({ onUploadSuccess }) {
  const { api } = useAuth();
  const [dragActive, setDragActive] = useState(false);
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

      const { uploadUrl, s3Key, provider } = data;

      // 2. Upload file directly to S3 (or mock route) using PUT
      // In Axios, we pass headers and standard onUploadProgress
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

      // We make a raw put request (without authorization headers to avoid S3 rejection or CORS issues)
      await axios.put(uploadUrl, file, options);

      // 3. Save file metadata in Mongo DB database via backend route
      await api.post('/api/files/save-metadata', {
        fileName: file.name,
        s3Key,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream'
      });

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset states after 2.5 seconds
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
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? onButtonClick : undefined}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/5' 
            : 'border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {!uploading && !success && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop file here, or <span className="text-indigo-400 hover:underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upload documents, images, PDFs (Max 25MB recommended)
            </p>
          </>
        )}

        {uploading && !success && (
          <div className="w-full space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-slate-200">{currentFile?.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(currentFile?.size || 0)}</p>
              </div>
              <span className="text-sm font-bold text-indigo-400">{progress}%</span>
            </div>

            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                  Uploading to secure server...
                </span>
                <span>{progress === 100 ? 'Writing metadata...' : 'Uploading...'}</span>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center justify-center py-4 text-emerald-400">
            <CheckCircle2 className="h-12 w-12 animate-bounce" />
            <p className="mt-3 text-sm font-semibold text-slate-200">Upload Complete!</p>
            <p className="mt-1 text-xs text-slate-500">File is safe in CloudVault</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Upload Failed</p>
            <p className="mt-0.5 text-xs text-rose-400/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
