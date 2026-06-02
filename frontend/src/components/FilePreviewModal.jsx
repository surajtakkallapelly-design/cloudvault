import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  File, 
  Loader2, 
  EyeOff, 
  Calendar,
  Layers,
  HardDrive,
  Eye
} from 'lucide-react';

export default function FilePreviewModal({ isOpen, onClose, file }) {
  const { api, apiBaseUrl, user } = useAuth();
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [officeViewer, setOfficeViewer] = useState('microsoft');

  // Handle open/close state of native HTMLDialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && file) {
      setError('');
      setTextContent('');
      setDownloadUrl('');
      setOfficeViewer('microsoft');
      dialog.showModal();
      fetchFileUrl();
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, file]);

  // Sync state if user clicks backdrop or presses Esc key (native close events)
  const handleNativeClose = () => {
    if (onClose) onClose();
  };

  // Fallback for click outside bounding rect (light dismiss fallback for Safari)
  const handleBackdropClick = (event) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // HTMLDialog prototype check for 'closedBy' feature
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isClickInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isClickInside) {
        dialog.close();
      }
    }
  };

  // Fetch the authorized, inline preview URL
  const fetchFileUrl = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const tokenParam = user?.token ? `&token=${user.token}` : '';
      const response = await api.get(`/api/files/download/${file.s3Key}?json=true${tokenParam}`);
      const url = response.data.downloadUrl;
      setDownloadUrl(url);

      // Check if it's text or code and fetch the content
      if (isTextOrCode(file.fileName, file.fileType)) {
        if (response.data.textContent !== undefined) {
          setTextContent(response.data.textContent);
        } else {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const text = await res.text();
            setTextContent(text);
          } catch (fetchErr) {
            console.error('Failed to fetch text content:', fetchErr);
            setTextContent('Error: Unable to fetch text/code content of the file.');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching preview URL:', err);
      setError(err.response?.data?.message || 'Failed to retrieve secure file path.');
    } finally {
      setLoading(false);
    }
  };

  const isTextOrCode = (fileName, fileType = '') => {
    const type = fileType.toLowerCase();
    const ext = fileName.split('.').pop().toLowerCase();

    const textExts = [
      'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 
      'py', 'ipynb', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 
      'rb', 'swift', 'kt', 'pl', 'r', 'sh', 'go', 'rs', 'yaml', 
      'yml', 'xml', 'sql', 'ini', 'log', 'conf', 'config', 'dockerfile'
    ];
    return type.startsWith('text/') || type === 'application/json' || type === 'application/javascript' || textExts.includes(ext);
  };

  const getFileType = () => {
    if (!file) return 'unknown';
    const type = file.fileType.toLowerCase();
    const ext = file.fileName.split('.').pop().toLowerCase();

    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif'].includes(ext)) {
      return 'image';
    }
    if (type.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) {
      return 'video';
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return 'audio';
    }
    if (type === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return 'office';
    }
    if (isTextOrCode(file.fileName, file.fileType)) {
      return 'text';
    }
    return 'fallback';
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadDirect = () => {
    if (!file) return;
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${file.s3Key}?download=true${tokenParam}`, '_blank');
  };

  const fileType = getFileType();

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
      aria-labelledby="preview-title"
      className="m-auto w-[90%] max-w-4xl max-h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 shadow-2xl overflow-hidden focus:outline-none animate-in zoom-in-95 duration-200 text-left backdrop:bg-black/55 backdrop:backdrop-blur-sm backdrop:transition-all"
    >
      {file && (
        <div className="flex flex-col h-[85vh]">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 dark:border-zinc-900/60 bg-zinc-50 dark:bg-zinc-950/70 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                {fileType === 'image' && <ImageIcon className="h-4.5 w-4.5" />}
                {fileType === 'video' && <Video className="h-4.5 w-4.5" />}
                {fileType === 'audio' && <Music className="h-4.5 w-4.5" />}
                {fileType === 'pdf' && <FileText className="h-4.5 w-4.5" />}
                {fileType === 'office' && <FileText className="h-4.5 w-4.5" />}
                {fileType === 'text' && <FileText className="h-4.5 w-4.5" />}
                {fileType === 'fallback' && <File className="h-4.5 w-4.5" />}
              </div>
              <div className="min-w-0">
                <h3 id="preview-title" className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={file.fileName}>
                  {file.fileName}
                </h3>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">
                  {formatBytes(file.fileSize)} • Built-In Vault Previewer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy Code button for text files */}
              {fileType === 'text' && textContent && (
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors"
                  title="Copy to Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}

              {/* Open in Tab Trigger */}
              {(fileType === 'pdf' || fileType === 'office') && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors"
                  title="Open in New Tab"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
              )}

              {/* Secure Download Trigger */}
              <button
                onClick={handleDownloadDirect}
                className="flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors"
                title="Secure Download"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close Dialog Button */}
              <button
                onClick={() => dialogRef.current?.close()}
                className="p-1.5 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Body Viewer Panel */}
          <div className="flex-1 overflow-auto p-6 bg-white dark:bg-zinc-950 flex flex-col justify-center items-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-widest">
                  Loading secure stream...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center text-center max-w-sm gap-3 py-10">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <EyeOff className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Unable to Preview File</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{error}</p>
                <button
                  onClick={handleDownloadDirect}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download File Instead
                </button>
              </div>
            ) : downloadUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* Image Preview */}
                {fileType === 'image' && (
                  <div className="relative max-w-full max-h-[68vh] rounded-xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center">
                    <img
                      src={downloadUrl}
                      alt={file.fileName}
                      className="object-contain max-w-full max-h-[68vh] transition-transform duration-300"
                      onError={(e) => {
                        if (['heic', 'heif'].includes(file.fileName.split('.').pop().toLowerCase())) {
                          e.target.style.display = 'none';
                          const msgEl = document.getElementById('heic-warning');
                          if (msgEl) msgEl.style.display = 'flex';
                        }
                      }}
                    />
                    <div id="heic-warning" className="hidden flex-col items-center p-6 text-center gap-2">
                      <ImageIcon className="h-10 w-10 text-zinc-400" />
                      <p className="text-xs text-zinc-500">HEIC previews require Safari. Please download the file to view it.</p>
                    </div>
                  </div>
                )}

                {/* Video Preview */}
                {fileType === 'video' && (
                  <video
                    src={downloadUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[68vh] rounded-xl bg-black shadow-lg focus:outline-none"
                  />
                )}

                {/* Audio Preview */}
                {fileType === 'audio' && (
                  <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 text-center shadow-lg">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-4 animate-pulse">
                      <Music className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-250 truncate mb-1">
                      {file.fileName}
                    </h4>
                    <p className="text-xs text-zinc-500 mb-6 font-semibold uppercase tracking-widest">
                      {formatBytes(file.fileSize)}
                    </p>
                    <audio
                      src={downloadUrl}
                      controls
                      autoPlay
                      className="w-full focus:outline-none"
                    />
                  </div>
                )}

                {/* PDF Preview */}
                {fileType === 'pdf' && (
                  <iframe
                    src={downloadUrl}
                    title={file.fileName}
                    className="w-full h-[68vh] rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white"
                  />
                )}

                {/* Text/Code Preview */}
                {fileType === 'text' && (
                  <div className="w-full h-full flex flex-col">
                    <pre className="flex-1 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-950 text-zinc-100 overflow-auto font-mono text-xs text-left leading-relaxed select-text whitespace-pre-wrap break-all h-[65vh]">
                      <code>{textContent || 'Loading content...'}</code>
                    </pre>
                  </div>
                )}

                {/* Office Document Preview */}
                {fileType === 'office' && (
                  !downloadUrl.includes('localhost') && !downloadUrl.includes('127.0.0.1') ? (
                    <div className="w-full h-full flex flex-col gap-2">
                      <div className="flex justify-end px-2">
                        <button
                          onClick={() => setOfficeViewer(officeViewer === 'microsoft' ? 'google' : 'microsoft')}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          Switch to {officeViewer === 'microsoft' ? 'Google Docs Viewer' : 'Microsoft Office Viewer'}
                        </button>
                      </div>
                      <iframe
                        src={officeViewer === 'microsoft'
                          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
                          : `https://docs.google.com/gview?url=${encodeURIComponent(downloadUrl)}&embedded=true`
                        }
                        title={file.fileName}
                        className="w-full h-[62vh] rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 md:p-8 text-center shadow-md">
                      <FileText className="mx-auto h-14 w-14 text-zinc-400 mb-5" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate mb-2">Office Document Preview</h4>
                      <p className="text-xs text-zinc-550 dark:text-zinc-500 mb-6 font-medium">Document previews are optimized for cloud storage deployments. Please download the file to view it locally.</p>
                      <button
                        onClick={handleDownloadDirect}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4" /> Download Document
                      </button>
                    </div>
                  )
                )}

                {/* Fallback View */}
                {fileType === 'fallback' && (
                  <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 md:p-8 text-center shadow-md">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 flex items-center justify-center mb-5">
                      <File className="h-7 w-7" />
                    </div>
                    
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate mb-4">
                      No Preview Available
                    </h4>

                    <div className="space-y-2.5 text-left mb-6 border-t border-b border-zinc-200/60 dark:border-zinc-900/60 py-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-450 font-medium">
                        <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-bold">File Size:</span>
                        <span>{formatBytes(file.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-450 font-medium">
                        <Layers className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-bold">Mime Type:</span>
                        <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">{file.fileType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-450 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-bold">Uploaded On:</span>
                        <span>{new Date(file.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadDirect}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Download Document
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-zinc-400">Loading URL...</div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
