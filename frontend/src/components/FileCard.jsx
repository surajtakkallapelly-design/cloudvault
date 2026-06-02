import React, { useState } from 'react';
import { 
  FileText, 
  Image, 
  FileCode, 
  Video, 
  Music, 
  Archive, 
  File, 
  Download, 
  Share2, 
  Trash2, 
  Globe, 
  Lock, 
  Loader2, 
  Check, 
  Copy,
  Pencil,
  X,
  FolderInput,
  Star,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FileCard({ file, onShareClick, onDeleteSuccess, refreshFiles, folders = [], onViewFile, selectedFileIds = [], setSelectedFileIds }) {
  const { api, apiBaseUrl, user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(file.fileName);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleMoveFile = async (folderName) => {
    try {
      await api.put(`/api/files/move/${file._id}`, { folderName });
      setShowMoveMenu(false);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Move failed: ' + (err.response?.data?.message || err.message));
    }
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

  // Get file type configuration
  const getFileTypeDetails = (mimeType) => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) {
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: FileText, label: 'PDF document' };
    }
    if (type.includes('image/')) {
      return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Image, label: 'Image graphic' };
    }
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css') || type.includes('code')) {
      return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: FileCode, label: 'Source code' };
    }
    if (type.includes('video/')) {
      return { color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', icon: Video, label: 'Video stream' };
    }
    if (type.includes('audio/')) {
      return { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Music, label: 'Audio record' };
    }
    if (type.includes('zip') || type.includes('tar') || type.includes('rar') || type.includes('compressed')) {
      return { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Archive, label: 'Archive pack' };
    }
    return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: File, label: 'Generic file' };
  };

  const { color, icon: FileIcon, label: typeLabel } = getFileTypeDetails(file.fileType);

  const handleDownload = () => {
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${file.s3Key}?download=true${tokenParam}`, '_blank');
  };

  const handleView = () => {
    if (onViewFile) {
      onViewFile(file);
    } else {
      const tokenParam = user?.token ? `&token=${user.token}` : '';
      window.open(`${apiBaseUrl}/api/files/download/${file.s3Key}?view=true${tokenParam}`, '_blank');
    }
  };

  const handleToggleStar = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/api/files/star/${file._id}`);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Failed to toggle star status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestore = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/api/files/trash/${file._id}`);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Failed to restore file: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTrashOrDelete = async (e) => {
    if (e) e.stopPropagation();
    
    if (file.isTrashed) {
      if (!window.confirm(`Are you sure you want to permanently delete "${file.fileName}"? This action cannot be undone.`)) return;
      setDeleting(true);
      try {
        await api.delete(`/api/files/${file._id}`);
        if (onDeleteSuccess) onDeleteSuccess();
        if (refreshFiles) refreshFiles();
      } catch (err) {
        console.error(err);
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      } finally {
        setDeleting(false);
      }
    } else {
      if (!window.confirm(`Are you sure you want to move "${file.fileName}" to the Trash?`)) return;
      setDeleting(true);
      try {
        await api.put(`/api/files/trash/${file._id}`);
        if (refreshFiles) refreshFiles();
      } catch (err) {
        alert('Failed to move to trash: ' + (err.response?.data?.message || err.message));
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleRenameSave = async () => {
    if (!tempName || tempName.trim() === '' || tempName === file.fileName) {
      setIsEditing(false);
      return;
    }
    try {
      await api.put(`/api/files/rename/${file._id}`, { newName: tempName.trim() });
      setIsEditing(false);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Rename failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCopyLink = () => {
    const link = `${apiBaseUrl}/api/files/download/${file.s3Key}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    });
  };

  const isFileSelected = selectedFileIds.includes(file._id);

  return (
    <div className={`group relative flex flex-col justify-between min-h-[175px] rounded-2xl border p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xl hover:shadow-indigo-500/5 hover:bg-zinc-90-selected dark:hover:bg-zinc-900/45 ${
      isFileSelected
        ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-950/20 shadow-md'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
    }`}>
      
      {/* File Select Checkbox */}
      <div
        className={`absolute top-2.5 left-2.5 z-20 transition-opacity duration-200 ${
          isFileSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (isFileSelected) {
            setSelectedFileIds(selectedFileIds.filter((id) => id !== file._id));
          } else {
            setSelectedFileIds([...selectedFileIds, file._id]);
          }
        }}
      >
        <input
          type="checkbox"
          checked={isFileSelected}
          onChange={() => {}}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-550 cursor-pointer"
        />
      </div>
      
      {/* Glow highlight on card hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-indigo-500/0 to-indigo-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card Header (type icon and visibility status) */}
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${color}`}>
          <FileIcon className="h-5.5 w-5.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Star Toggle Button */}
          {!file.isTrashed && (
            <button
              onClick={handleToggleStar}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                file.isStarred 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-sm scale-105' 
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
              title={file.isStarred ? 'Remove Star' : 'Star File'}
            >
              <Star className={`h-3.5 w-3.5 ${file.isStarred ? 'fill-amber-500 text-amber-500 dark:text-amber-400' : ''}`} />
            </button>
          )}

          {file.isShared ? (
            <span className="flex items-center gap-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 px-2.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Globe className="h-2.5 w-2.5" /> Public
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 px-2.5 py-0.5 text-[9px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
              <Lock className="h-2.5 w-2.5" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Card Body (meta info) */}
      <div className="mt-4 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full mt-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSave();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setTempName(file.fileName);
                }
              }}
            />
            <button 
              onClick={handleRenameSave} 
              className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded-md cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setTempName(file.fileName);
              }} 
              className="p-1 hover:bg-zinc-800 text-zinc-500 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <h3 className="truncate text-sm font-bold text-zinc-800 dark:text-zinc-200" title={file.fileName}>
            {file.fileName}
          </h3>
        )}
        
        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">{typeLabel}</p>
        
        <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <span>{formatBytes(file.fileSize)}</span>
          <span className="text-zinc-700">•</span>
          <span>{new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Move to Folder dropdown menu overlay */}
      {showMoveMenu && (
        <div className="absolute bottom-16 left-4 right-4 z-30 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150" onClick={(e) => e.stopPropagation()}>
          <p className="px-2 py-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">Move to Folder</p>
          <div className="max-h-24 overflow-y-auto mt-1 space-y-0.5">
            <button
              onClick={() => handleMoveFile('Root')}
              className={`w-full text-left rounded-lg px-2.5 py-1 text-[11px] font-semibold truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                file.folder === 'Root' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Root Drive
            </button>
            {folders.map((f) => (
              <button
                key={f._id}
                onClick={() => handleMoveFile(f.name)}
                className={`w-full text-left rounded-lg px-2.5 py-1 text-[11px] font-semibold truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                  file.folder === f.name ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}      {/* Hover action overlay panel (revealed on hover) */}
      <div className="absolute inset-x-4 bottom-4 flex items-center gap-1 bg-white dark:bg-zinc-950 py-2.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 border-t border-zinc-200 dark:border-zinc-900/50">
        {file.isTrashed ? (
          <div className="flex-1 flex gap-2">
            <button
              onClick={handleRestore}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-2.5 md:py-2 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
              title="Restore File"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Restore
            </button>
            <button
              onClick={handleTrashOrDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 hover:bg-rose-500/10 dark:bg-zinc-900 dark:hover:bg-rose-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/20 text-xs font-semibold py-2.5 md:py-2 text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
              title="Delete Permanently"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />} Purge
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-2.5 md:py-2 text-white transition-colors cursor-pointer border-0 shadow-md shadow-indigo-650/10"
              title="View/Open File"
            >
              <Eye className="h-3.5 w-3.5" /> View
            </button>

            <button
              onClick={handleDownload}
              className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Secure Download"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                setTempName(file.fileName);
                setIsEditing(true);
              }}
              className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Rename File"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className={`flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                showMoveMenu 
                  ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Move to Folder"
            >
              <FolderInput className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onShareClick(file)}
              className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Share Settings"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            {file.isShared && (
              <button
                onClick={handleCopyLink}
                className={`flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  copying 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-xs'
                }`}
                title="Copy Link"
              >
                {copying ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              onClick={handleTrashOrDelete}
              disabled={deleting}
              className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-lg bg-zinc-50 hover:bg-rose-500/10 dark:bg-zinc-900 dark:hover:bg-rose-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/20 text-zinc-500 dark:text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
