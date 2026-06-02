import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, FileText, Image, Video, Music, File, Loader2, 
  ShieldAlert, Moon, Sun, ArrowRight, ExternalLink, Sparkles, Folder
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SharedPreviewPage({ fileId }) {
  const { apiBaseUrl, theme, toggleTheme } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [inlineUrl, setInlineUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Extract emailToken from query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const emailToken = queryParams.get('emailToken');

  // Detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    const fetchSharedFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBaseUrl}/api/files/shared-preview/${fileId}${emailToken ? `?emailToken=${emailToken}` : ''}`;
        const { data } = await axios.get(url);
        setFileData(data.file);
        setDownloadUrl(data.downloadUrl);
        setInlineUrl(data.inlineUrl);
        setTextContent(data.textContent || '');
      } catch (err) {
        console.error('Error fetching shared file:', err);
        setError(err.response?.data?.message || err.message || 'Failed to access the shared file');
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchSharedFile();
    }
  }, [fileId, emailToken, apiBaseUrl]);

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type details and icons
  const getFileIconAndColor = (fileName, fileType = '') => {
    const type = fileType.toLowerCase();
    const ext = fileName.split('.').pop().toLowerCase();

    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: <Image className="h-10 w-10 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    if (type.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
      return { icon: <Video className="h-10 w-10 text-rose-400" />, bg: 'bg-rose-500/10 border-rose-500/20' };
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
      return { icon: <Music className="h-10 w-10 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (type.includes('pdf') || ext === 'pdf') {
      return { icon: <FileText className="h-10 w-10 text-red-400" />, bg: 'bg-red-500/10 border-red-500/20' };
    }
    if (['txt', 'md', 'js', 'jsx', 'json', 'html', 'css', 'py', 'go', 'rs', 'sh'].includes(ext)) {
      return { icon: <FileText className="h-10 w-10 text-indigo-400" />, bg: 'bg-indigo-500/10 border-indigo-500/20' };
    }
    return { icon: <File className="h-10 w-10 text-zinc-400" />, bg: 'bg-zinc-500/10 border-zinc-500/20' };
  };

  const getFileType = (fileName, fileType) => {
    const ext = fileName.split('.').pop().toUpperCase();
    if (fileType && fileType.includes('/')) {
      const parts = fileType.split('/');
      return `${parts[1].toUpperCase()} File (${ext})`;
    }
    return `${ext} Document`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
        <p className="mt-4 text-sm font-semibold text-zinc-400 animate-pulse">Loading shared document details...</p>
      </div>
    );
  }

  // Error state display
  if (error) {
    const is403 = error.includes('Access denied') || error.includes('expired') || error.includes('private');
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-white selection:bg-indigo-500/30">
        {/* Simple Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-900 px-6 bg-zinc-950/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-650 text-white shadow-lg shadow-indigo-550/20">
              <Folder className="h-5 w-5" />
            </div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">CloudVault</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="rounded-xl border border-zinc-900 bg-zinc-950 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </header>

        {/* Central Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-450 border border-rose-500/20 mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-center mt-5 text-white">
              {is403 ? 'Access Denied' : 'Document Unavailable'}
            </h2>
            <p className="text-xs text-zinc-450 text-center mt-3 leading-relaxed">
              {is403 
                ? 'This link has expired, or the file owner has revoked access permissions. For security, direct email sharing links expire automatically after 7 days.' 
                : error
              }
            </p>
            <div className="mt-8 border-t border-zinc-900 pt-6 flex flex-col gap-3">
              <a 
                href="/" 
                className="rounded-xl bg-indigo-650 hover:bg-indigo-600 py-2.5 text-center text-xs font-bold text-white transition-all shadow-md shadow-indigo-650/10 border-0 cursor-pointer no-underline"
              >
                Go to CloudVault Homepage
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { icon, bg } = getFileIconAndColor(fileData.fileName, fileData.fileType);
  const isImage = fileData.fileType.toLowerCase().startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileData.fileName.split('.').pop().toLowerCase());
  const isVideo = fileData.fileType.toLowerCase().startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(fileData.fileName.split('.').pop().toLowerCase());
  const isAudio = fileData.fileType.toLowerCase().startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(fileData.fileName.split('.').pop().toLowerCase());
  const isPdf = fileData.fileType.toLowerCase().includes('pdf') || fileData.fileName.toLowerCase().endsWith('.pdf');
  const isText = textContent.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-900 px-6 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-55">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-650 text-white shadow-lg shadow-indigo-550/20">
            <Folder className="h-5 w-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">CloudVault</span>
        </div>
        <button 
          onClick={toggleTheme}
          className="rounded-xl border border-zinc-900 bg-zinc-950 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Breadcrumb / Sharing Header info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
              {fileData.fileName}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Shared by <span className="font-semibold text-indigo-400">{fileData.owner.name}</span> ({fileData.owner.email}) on {new Date(fileData.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <a
            href={downloadUrl}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-650/15 border-0 cursor-pointer no-underline shrink-0"
          >
            <Download className="h-4.5 w-4.5" /> Download File
          </a>
        </div>

        {/* Preview Panel Box */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center min-h-[350px]">
          {isImage ? (
            <div className="max-w-full max-h-[500px] overflow-hidden rounded-xl border border-zinc-900 shadow-xl">
              <img 
                src={inlineUrl} 
                alt={fileData.fileName} 
                className="max-w-full h-auto max-h-[500px] object-contain rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400?text=Failed+to+load+image';
                }}
              />
            </div>
          ) : isVideo ? (
            <div className="w-full max-w-2xl rounded-xl overflow-hidden border border-zinc-900 shadow-xl bg-black">
              <video 
                src={inlineUrl} 
                controls 
                className="w-full max-h-[450px]"
                preload="metadata"
              />
            </div>
          ) : isAudio ? (
            <div className="w-full max-w-md rounded-xl p-4 border border-zinc-800 bg-zinc-900/50 shadow-lg text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 animate-pulse">
                <Music className="h-8 w-8" />
              </div>
              <p className="text-xs text-zinc-400 truncate w-full mb-4">{fileData.fileName}</p>
              <audio 
                src={inlineUrl} 
                controls 
                className="w-full"
                preload="metadata"
              />
            </div>
          ) : isPdf ? (
            isMobile ? (
              <div className="flex flex-col items-center text-center p-8 max-w-sm rounded-xl border border-zinc-850 bg-zinc-900/20">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-450 border border-rose-500/20 mb-4">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-white">PDF Document Preview</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Mobile browsers can sometimes restrict embedded PDF documents. Open in a native tab or download directly for the best reading experience.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 w-full">
                  <a
                    href={inlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300 transition-colors no-underline cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" /> Open in New Tab
                  </a>
                  <a
                    href={downloadUrl}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 py-2.5 text-xs font-bold text-white transition-all no-underline cursor-pointer border-0"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/10">
                <iframe 
                  src={inlineUrl} 
                  title={fileData.fileName} 
                  className="w-full h-[600px] border-0"
                />
              </div>
            )
          ) : isText ? (
            <div className="w-full max-h-[500px] overflow-auto rounded-xl border border-zinc-850 bg-zinc-900/30 p-5 text-left custom-scrollbar shadow-inner">
              <pre className="text-xs font-mono text-zinc-300 whitespace-pre leading-relaxed select-text font-medium">{textContent}</pre>
            </div>
          ) : (
            /* Fallback generic document preview details */
            <div className="flex flex-col items-center text-center p-8 max-w-sm rounded-xl border border-zinc-850 bg-zinc-900/20">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border ${bg} mb-5`}>
                {icon}
              </div>
              <h3 className="text-sm font-bold text-white">{fileData.fileName}</h3>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                <span>{getFileType(fileData.fileName, fileData.fileType)}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-650" />
                <span>{formatSize(fileData.fileSize)}</span>
              </p>
              <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                Preview not available for this format. Download the document directly to open it on your device.
              </p>
              <a
                href={downloadUrl}
                className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-650/15 border-0 cursor-pointer no-underline w-full"
              >
                <Download className="h-4.5 w-4.5" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* Promotion CTA Card */}
        <div className="rounded-2xl border border-indigo-500/10 bg-gradient-to-tr from-indigo-950/20 via-slate-950 to-indigo-950/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left min-w-0">
            <h3 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> New to CloudVault?
            </h3>
            <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
              Sign up today and get <span className="font-semibold text-indigo-400">20 GB of secure storage</span>. Keep track of all your shared documents, organize folders, and collaborate in real-time.
            </p>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-100 text-slate-950 px-5 py-3 text-xs font-bold transition-all shadow-lg border-0 cursor-pointer shrink-0 no-underline"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-zinc-950/50 mt-12 bg-zinc-950/40 text-center">
        <p className="text-[10px] text-zinc-500">© 2026 CloudVault Cloud Storage. Preserving file safety with S3 compliance.</p>
      </footer>
    </div>
  );
}
