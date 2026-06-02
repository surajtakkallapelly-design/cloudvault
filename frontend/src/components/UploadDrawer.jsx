import React from 'react';
import { useUpload } from '../context/UploadContext';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive
} from 'lucide-react';

export default function UploadDrawer() {
  const {
    uploadQueue,
    isDrawerOpen,
    isDrawerExpanded,
    setIsDrawerOpen,
    setIsDrawerExpanded,
    clearCompleted,
    removeQueueItem
  } = useUpload();

  if (!isDrawerOpen || uploadQueue.length === 0) return null;

  // Formatting helper for size bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Maps mime-types or file extensions to Lucide icons
  const getFileTypeIcon = (fileName, fileType = '') => {
    const type = fileType.toLowerCase();
    const ext = fileName.split('.').pop().toLowerCase();

    if (type.includes('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return ImageIcon;
    }
    if (type.includes('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) {
      return Video;
    }
    if (type.includes('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return Music;
    }
    if (type.includes('zip') || type.includes('tar') || type.includes('rar') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return Archive;
    }
    if (type.includes('pdf') || type.includes('word') || type.includes('excel') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) {
      return FileText;
    }
    return File;
  };

  // Counting stats
  const activeCount = uploadQueue.filter(item => item.status === 'uploading' || item.status === 'pending').length;
  const completedCount = uploadQueue.filter(item => item.status === 'success').length;
  const errorCount = uploadQueue.filter(item => item.status === 'error').length;
  const totalCount = uploadQueue.length;

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-full max-w-sm md:max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-md transition-all duration-300 ${
      isDrawerExpanded ? 'h-[360px]' : 'h-14'
    }`}>
      {/* Header Bar */}
      <div 
        className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200/60 dark:border-zinc-900/60 cursor-pointer select-none"
        onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {activeCount > 0 ? (
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" />
            ) : errorCount > 0 ? (
              <AlertCircle className="h-4 w-4 text-rose-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              {activeCount > 0 
                ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}...` 
                : `Uploads complete (${completedCount}/${totalCount})`
              }
            </h4>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-widest mt-0.5">
              Vault Transfer Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Clear Completed Action */}
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Clear completed uploads"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isDrawerExpanded ? "Minimize Drawer" : "Expand Drawer"}
          >
            {isDrawerExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {/* Close Monitor */}
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Close Monitor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload Queue List */}
      {isDrawerExpanded && (
        <div className="overflow-y-auto h-[290px] p-4 divide-y divide-zinc-100 dark:divide-zinc-900/40">
          {uploadQueue.map((item) => {
            const FileIcon = getFileTypeIcon(item.name, item.file.type);
            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400">
                    <FileIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">
                      {formatBytes(item.size)} • Folder: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{item.folder}</span>
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {item.status === 'pending' && (
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pending</span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-wider">{item.progress}%</span>
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    {item.status === 'error' && (
                      <button 
                        onClick={() => removeQueueItem(item.id)}
                        className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-rose-500 cursor-pointer"
                        title="Remove item"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Error message */}
                {item.status === 'uploading' && (
                  <div className="h-1 w-full rounded-full bg-zinc-150 dark:bg-zinc-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
                {item.status === 'error' && item.error && (
                  <p className="text-[9px] text-rose-500 dark:text-rose-450 font-semibold leading-normal ml-11">
                    Error: {item.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
