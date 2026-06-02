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
  Eye,
  History,
  RotateCcw,
  Trash2
} from 'lucide-react';

export default function FilePreviewModal({ isOpen, onClose, file, refreshFiles }) {
  const { api, apiBaseUrl, user } = useAuth();
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [officeViewer, setOfficeViewer] = useState('microsoft');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMobileVersions, setShowMobileVersions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle open/close state of native HTMLDialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && file) {
      setError('');
      setTextContent('');
      setDownloadUrl('');
      setOfficeViewer('microsoft');
      setIframeLoading(true);
      setMediaLoading(true);
      setVersions([]);
      setShowMobileVersions(false);
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
      const response = await api.get(`/api/files/download/${encodeURIComponent(file.s3Key)}?json=true${tokenParam}`);
      const url = response.data.downloadUrl;
      setDownloadUrl(url);

      // Fetch versions
      try {
        const verRes = await api.get(`/api/files/${file._id}/versions`);
        setVersions(verRes.data || []);
      } catch (verErr) {
        console.error('Failed to fetch versions:', verErr);
      }

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

  const handleDownloadDirect = () => {
    if (!file) return;
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${encodeURIComponent(file.s3Key)}?download=true${tokenParam}`, '_blank');
  };

  const handleDownloadVersion = (verS3Key) => {
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${encodeURIComponent(verS3Key)}?download=true${tokenParam}`, '_blank');
  };

  const handleRestoreVersion = async (versionNumber) => {
    if (window.confirm(`Are you sure you want to restore the file to Version ${versionNumber}? This will swap it with the current active version.`)) {
      setActionLoading(true);
      try {
        await api.post(`/api/files/${file._id}/versions/${versionNumber}/restore`);
        await fetchFileUrl();
        if (refreshFiles) refreshFiles();
      } catch (err) {
        alert('Failed to restore version: ' + (err.response?.data?.message || err.message));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteVersion = async (versionNumber) => {
    if (window.confirm(`Are you sure you want to permanently delete Version ${versionNumber}? This action cannot be undone.`)) {
      setActionLoading(true);
      try {
        await api.delete(`/api/files/${file._id}/versions/${versionNumber}`);
        // Reload versions list
        const verRes = await api.get(`/api/files/${file._id}/versions`);
        setVersions(verRes.data || []);
        if (refreshFiles) refreshFiles();
      } catch (err) {
        alert('Failed to delete version: ' + (err.response?.data?.message || err.message));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    const link = `${apiBaseUrl}/api/files/download/${encodeURIComponent(file.s3Key)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format bytes helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fileType = getFileType();

  return (
    <dialog
      ref={dialogRef}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
      className="modal-reset w-[95%] max-w-5xl h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 shadow-2xl focus:outline-none overflow-hidden"
    >
      {file && (
        <div className="flex flex-col h-full w-full">
          
          {/* Modal Header Controls */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 bg-zinc-50 dark:bg-zinc-950">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-200">
                {file.fileName}
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                Preview Mode
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy Share Link (Only if shared) */}
              {file.isShared && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors border-0 bg-transparent"
                  title="Copy share link"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="hidden sm:inline text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy</span>
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
                className="flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors border-0 bg-transparent"
                title="Secure Download"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* History Button (Mobile Only) */}
              {!file.isTrashed && (
                <button
                  onClick={() => setShowMobileVersions(!showMobileVersions)}
                  className="md:hidden flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors border-0 bg-transparent"
                  title="Toggle Version History"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Versions</span>
                </button>
              )}

              {/* Close Dialog Button */}
              <button
                onClick={() => dialogRef.current?.close()}
                className="p-1.5 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer border-0 bg-transparent"
                title="Close dialog"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Split Body Layout: Left = Preview content, Right = Version History list */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-zinc-950">
            
            {/* Left Preview Pane */}
            <div className="flex-1 overflow-auto p-6 flex flex-col justify-center items-center border-r border-zinc-200 dark:border-zinc-900 h-full">
              {loading || actionLoading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-widest animate-pulse">
                    {actionLoading ? 'Applying version updates...' : 'Loading secure stream...'}
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
                    className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 shadow-sm transition-colors cursor-pointer border-0"
                  >
                    <Download className="h-4 w-4" /> Download File Instead
                  </button>
                </div>
              ) : downloadUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  {/* Image Preview */}
                  {fileType === 'image' && (
                    <div className="relative max-w-full max-h-[68vh] rounded-xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center min-w-[240px] min-h-[180px]">
                      {mediaLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-100/50 dark:bg-zinc-950/85 z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                          <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-450 uppercase tracking-wider">Processing high-res image...</span>
                        </div>
                      )}
                      <img
                        src={downloadUrl}
                        alt={file.fileName}
                        onLoad={() => setMediaLoading(false)}
                        className="max-w-full max-h-[68vh] object-contain block focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Video Preview */}
                  {fileType === 'video' && (
                    <div className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-900 bg-black flex flex-col justify-center">
                      {mediaLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Buffering video stream...</span>
                        </div>
                      )}
                      <video
                        src={downloadUrl}
                        controls
                        autoPlay
                        onLoadedData={() => setMediaLoading(false)}
                        className="w-full max-h-[68vh] focus:outline-none"
                      />
                    </div>
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
                    isMobile ? (
                      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 md:p-8 text-center shadow-md">
                        <FileText className="mx-auto h-14 w-14 text-indigo-500 dark:text-indigo-400 mb-5 animate-pulse" />
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate mb-2">PDF Document</h4>
                        <p className="text-xs text-zinc-550 dark:text-zinc-500 mb-6 font-medium leading-relaxed">PDF previews are optimized for native browser viewing. Please open the document in a new tab or download it directly to view it.</p>
                        <div className="flex flex-col gap-3">
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-655 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer text-center"
                          >
                            <Eye className="h-4 w-4" /> Open in New Tab
                          </a>
                          <button
                            onClick={handleDownloadDirect}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-250 font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer border-0"
                          >
                            <Download className="h-4 w-4" /> Download PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full min-h-[60vh]">
                        {iframeLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-950 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase tracking-widest">
                              Loading PDF document... Please wait.
                            </p>
                          </div>
                        )}
                        <iframe
                          src={downloadUrl}
                          title={file.fileName}
                          onLoad={() => setIframeLoading(false)}
                          className="w-full h-full min-h-[60vh] rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white"
                        />
                      </div>
                    )
                  )}

                  {/* Text/Code Preview */}
                  {fileType === 'text' && (
                    <div className="w-full h-full flex flex-col">
                      <pre className="flex-1 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-950 text-zinc-100 overflow-auto font-mono text-xs text-left leading-relaxed select-text whitespace-pre-wrap break-all h-full min-h-[60vh]">
                        <code>{textContent || 'Loading content...'}</code>
                      </pre>
                    </div>
                  )}

                  {/* Office Document Preview */}
                  {fileType === 'office' && (
                    isMobile ? (
                      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 md:p-8 text-center shadow-md">
                        <FileText className="mx-auto h-14 w-14 text-indigo-500 dark:text-indigo-400 mb-5 animate-pulse" />
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate mb-2">Office Document</h4>
                        <p className="text-xs text-zinc-550 dark:text-zinc-500 mb-6 font-medium leading-relaxed">Office document previews are optimized for native browser viewing. Please open the document in a new tab or download it directly to view it.</p>
                        <div className="flex flex-col gap-3">
                          <a
                            href={officeViewer === 'microsoft'
                              ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
                              : `https://docs.google.com/gview?url=${encodeURIComponent(downloadUrl)}&embedded=true`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-655 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer text-center"
                          >
                            <Eye className="h-4 w-4" /> Open in New Tab
                          </a>
                          <button
                            onClick={handleDownloadDirect}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-250 font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer border-0"
                          >
                            <Download className="h-4 w-4" /> Download Document
                          </button>
                        </div>
                      </div>
                    ) : (
                      !downloadUrl.includes('localhost') && !downloadUrl.includes('127.0.0.1') ? (
                        <div className="w-full h-full flex flex-col gap-2">
                          <div className="flex justify-end px-2">
                            <button
                              onClick={() => {
                                setOfficeViewer(officeViewer === 'microsoft' ? 'google' : 'microsoft');
                                setIframeLoading(true);
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:text-indigo-855 dark:hover:text-indigo-300 transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              Switch to {officeViewer === 'microsoft' ? 'Google Docs Viewer' : 'Microsoft Office Viewer'}
                            </button>
                          </div>
                          <div className="relative w-full h-full min-h-[60vh]">
                            {iframeLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-950 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <p className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase tracking-widest">
                                  Loading document preview... Please wait.
                                </p>
                              </div>
                            )}
                            <iframe
                              src={officeViewer === 'microsoft'
                                ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
                                : `https://docs.google.com/gview?url=${encodeURIComponent(downloadUrl)}&embedded=true`
                              }
                              title={file.fileName}
                              onLoad={() => setIframeLoading(false)}
                              className="w-full h-full min-h-[60vh] rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 md:p-8 text-center shadow-md">
                          <FileText className="mx-auto h-14 w-14 text-zinc-400 mb-5" />
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate mb-2">Office Document Preview</h4>
                          <p className="text-xs text-zinc-555 dark:text-zinc-500 mb-6 font-medium">Document previews are optimized for cloud storage deployments. Please download the file to view it locally.</p>
                          <button
                            onClick={handleDownloadDirect}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer border-0"
                          >
                            <Download className="h-4 w-4" /> Download Document
                          </button>
                        </div>
                      )
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
                        <div className="flex items-center gap-2 text-xs text-zinc-555 dark:text-zinc-450 font-medium">
                          <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-bold">File Size:</span>
                          <span>{formatBytes(file.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-555 dark:text-zinc-455 font-medium">
                          <Layers className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-bold">Mime Type:</span>
                          <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">{file.fileType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-555 dark:text-zinc-455 font-medium">
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
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 shadow-md transition-colors cursor-pointer border-0"
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

            {/* Right Versions Pane (Google Drive Style) */}
            {!file.isTrashed && (
              <div className={`${showMobileVersions ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 p-6 flex-col h-fit md:h-full overflow-y-auto`}>
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-350 border-b border-zinc-200 dark:border-zinc-900 pb-3 mb-4">
                  <History className="h-4 w-4 text-indigo-550 dark:text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Version History</span>
                </div>

                <div className="space-y-4 flex-1">
                  
                  {/* Current Active Version */}
                  <div className="rounded-xl bg-indigo-500/5 border border-indigo-550/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-md">Current Version</span>
                      <span className="text-[10px] font-bold text-zinc-500">{formatBytes(file.fileSize)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-2 truncate">{file.fileName}</p>
                    <p className="text-[9px] text-zinc-550 mt-1">
                      Uploaded: {new Date(file.updatedAt || file.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Historical Versions list */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block">Older Versions ({versions.length})</span>
                    {versions.length === 0 ? (
                      <p className="text-[10px] text-zinc-550 italic py-2">No previous versions available for this file.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                        {versions
                          .slice()
                          .sort((a, b) => b.versionNumber - a.versionNumber)
                          .map((ver) => (
                            <div key={ver._id || ver.versionNumber} className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/40 p-3 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-300">Version {ver.versionNumber}</span>
                                <span className="text-[9px] font-bold text-zinc-550">{formatBytes(ver.fileSize)}</span>
                              </div>
                              <p className="text-[9px] text-zinc-550 mt-1">
                                {new Date(ver.uploadedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              
                              <div className="flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-900/60 pt-2.5 mt-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreVersion(ver.versionNumber)}
                                  className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-indigo-650 dark:text-indigo-400 hover:underline border-0 bg-transparent cursor-pointer"
                                  title="Restore this version as the active one"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadVersion(ver.s3Key)}
                                  className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-zinc-650 dark:text-zinc-400 hover:underline border-0 bg-transparent cursor-pointer"
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVersion(ver.versionNumber)}
                                  className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-rose-500 hover:underline border-0 bg-transparent cursor-pointer ml-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
