import React, { useState } from 'react';
import { 
  Grid, 
  List, 
  File, 
  Search,
  Globe,
  Lock,
  Download,
  Share2,
  Copy,
  Check,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileCode,
  Video,
  Music,
  Archive,
  FolderOpen,
  FolderInput,
  Pencil,
  X,
  Star,
  RotateCcw,
  Eye
} from 'lucide-react';
import FileCard from './FileCard';
import { useAuth } from '../context/AuthContext';

export default function FileGrid({ 
  files, 
  folders = [], 
  activeFolder = 'Root', 
  setActiveFolder, 
  loading, 
  refreshFiles, 
  searchVal, 
  currentTab = 'my-files', 
  onShareClick,
  onViewFile
}) {
  const { api, apiBaseUrl, user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [copyingId, setCopyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [movingFileId, setMovingFileId] = useState(null);

  const startRename = (file) => {
    setEditingId(file._id);
    setTempName(file.fileName);
  };

  const handleRenameSave = async (fileId) => {
    if (!tempName || tempName.trim() === '') {
      setEditingId(null);
      return;
    }
    try {
      await api.put(`/api/files/rename/${fileId}`, { newName: tempName.trim() });
      setEditingId(null);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Rename failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMoveFile = async (fileId, folderName) => {
    try {
      await api.put(`/api/files/move/${fileId}`, { folderName });
      setMovingFileId(null);
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

  // Get file type details
  const getFileTypeDetails = (mimeType) => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) {
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: FileText };
    }
    if (type.includes('image/')) {
      return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: ImageIcon };
    }
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css') || type.includes('code')) {
      return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: FileCode };
    }
    if (type.includes('video/')) {
      return { color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', icon: Video };
    }
    if (type.includes('audio/')) {
      return { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Music };
    }
    if (type.includes('zip') || type.includes('tar') || type.includes('rar') || type.includes('compressed')) {
      return { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Archive };
    }
    return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: File };
  };

  const handleDownload = (s3Key) => {
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${s3Key}?download=true${tokenParam}`, '_blank');
  };

  const handleView = (file) => {
    if (onViewFile) {
      onViewFile(file);
    } else {
      const tokenParam = user?.token ? `&token=${user.token}` : '';
      window.open(`${apiBaseUrl}/api/files/download/${file.s3Key}?view=true${tokenParam}`, '_blank');
    }
  };

  const handleCopyLink = (s3Key, fileId) => {
    const link = `${apiBaseUrl}/api/files/download/${s3Key}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopyingId(fileId);
      setTimeout(() => setCopyingId(null), 2000);
    });
  };

  const handleToggleStar = async (fileId) => {
    try {
      await api.put(`/api/files/star/${fileId}`);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Failed to toggle star: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestore = async (fileId) => {
    try {
      await api.put(`/api/files/trash/${fileId}`);
      if (refreshFiles) refreshFiles();
    } catch (err) {
      alert('Failed to restore file: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTrashOrDelete = async (file, e) => {
    if (e) e.stopPropagation();
    
    if (file.isTrashed) {
      if (!window.confirm(`Are you sure you want to permanently delete "${file.fileName}"? This action cannot be undone.`)) return;
      setDeletingId(file._id);
      try {
        await api.delete(`/api/files/${file._id}`);
        if (refreshFiles) refreshFiles();
      } catch (err) {
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      } finally {
        setDeletingId(null);
      }
    } else {
      if (!window.confirm(`Move "${file.fileName}" to Trash?`)) return;
      setDeletingId(file._id);
      try {
        await api.put(`/api/files/trash/${file._id}`);
        if (refreshFiles) refreshFiles();
      } catch (err) {
        alert('Failed to move to trash: ' + (err.response?.data?.message || err.message));
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filter files logic (Filter by search keyword, currentTab, and active folder name)
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchVal.toLowerCase());
    
    // Tab filters
    let matchesTab = true;
    if (currentTab === 'my-files') {
      matchesTab = !file.isTrashed;
    } else if (currentTab === 'recent') {
      matchesTab = !file.isTrashed;
    } else if (currentTab === 'starred') {
      matchesTab = file.isStarred && !file.isTrashed;
    } else if (currentTab === 'shared') {
      matchesTab = file.isShared && !file.isTrashed;
    } else if (currentTab === 'trash') {
      matchesTab = file.isTrashed;
    }

    // Folder check: bypass folder filter if there's a search term or if we are not on 'my-files' tab
    const bypassFolder = !!searchVal || currentTab !== 'my-files';
    const matchesFolder = bypassFolder ? true : (file.folder || 'Root') === activeFolder;

    return matchesSearch && matchesTab && matchesFolder;
  });

  // Sort chronologically for Recent tab
  if (currentTab === 'recent') {
    filteredFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-800 border-t-indigo-500"></div>
          <span className="text-xs font-semibold text-zinc-500">Retrieving drive nodes...</span>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0 && (!folders.length || activeFolder !== 'Root' || currentTab !== 'my-files')) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/20 p-8 text-center animate-in fade-in duration-300 shadow-sm">
        <File className="h-10 w-10 text-zinc-400 dark:text-zinc-700 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">No records found</h3>
        <p className="mt-1 text-xs text-zinc-550 dark:text-zinc-500 max-w-xs">
          {searchVal 
            ? 'Adjust your query criteria and try again' 
            : 'No documents match this view.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      {currentTab === 'my-files' && !searchVal && activeFolder === 'Root' && folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Folders</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {folders.map((folder) => (
              <div
                key={folder._id}
                onClick={() => setActiveFolder(folder.name)}
                className="group flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FolderOpen className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-250" title={folder.name}>
                    {folder.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List Header Toggles */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          {currentTab === 'shared' ? 'Shared Links' : currentTab === 'trash' ? 'Trash Bin' : currentTab === 'starred' ? 'Starred Files' : currentTab === 'recent' ? 'Recent Files' : 'Registry Entries'} ({filteredFiles.length})
        </h2>
        
        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-xs border border-zinc-200/50 dark:border-transparent' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-xs border border-zinc-200/50 dark:border-transparent' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <FileCard 
              key={file._id} 
              file={file} 
              onShareClick={onShareClick} 
              refreshFiles={refreshFiles}
              folders={folders}
              onViewFile={onViewFile}
            />
          ))}
        </div>
      ) : (
        /* List Mode Table (High fidelity, dark SaaS design) */
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
                <th className="px-5 py-3.5">Filename</th>
                <th className="px-5 py-3.5">Size</th>
                <th className="px-5 py-3.5">Created At</th>
                <th className="px-5 py-3.5">Visibility</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900/60 text-xs">
              {filteredFiles.map((file) => {
                const { color, icon: FileIcon } = getFileTypeDetails(file.fileType);
                const isCopying = copyingId === file._id;
                const isDeleting = deletingId === file._id;

                return (
                  <tr key={file._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 border-b border-zinc-100 dark:border-zinc-900/40 last:border-b-0 transition-colors group">
                    <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                          <FileIcon className="h-4.5 w-4.5" />
                        </div>

                        {/* Star Toggle in List Mode */}
                        {!file.isTrashed && (
                          <button
                            onClick={() => handleToggleStar(file._id)}
                            className={`p-1 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer ${
                              file.isStarred ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                            }`}
                            title={file.isStarred ? 'Remove Star' : 'Star File'}
                          >
                            <Star className={`h-3.5 w-3.5 ${file.isStarred ? 'fill-amber-550 text-amber-500 dark:text-amber-400' : ''}`} />
                          </button>
                        )}
                        {editingId === file._id ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSave(file._id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button 
                              onClick={() => handleRenameSave(file._id)} 
                              className="p-1 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-md cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200" title={file.fileName}>
                            {file.fileName}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                      {formatBytes(file.fileSize)}
                    </td>
                    
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {file.isShared ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 px-2 py-0.5 text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                          <Globe className="h-2.5 w-2.5" /> Shared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 px-2 py-0.5 text-[9px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
                          <Lock className="h-2.5 w-2.5" /> Private
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {file.isTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestore(file._id)}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 hover:text-indigo-650 dark:hover:text-indigo-400 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                              title="Restore File"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleTrashOrDelete(file, e)}
                              disabled={isDeleting}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-450 hover:border-rose-500/25 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer shadow-xs"
                              title="Delete Permanently"
                            >
                              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </>
                        ) : (
                          <>
                             <button
                              onClick={() => handleView(file)}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                              title="View File"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                             <button
                              onClick={() => handleDownload(file.s3Key)}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                              title="Secure Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            
                            <button
                              onClick={() => startRename(file)}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                              title="Rename File"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
 
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingFileId(movingFileId === file._id ? null : file._id);
                                }}
                                className={`rounded-lg p-3 md:p-1.5 border transition-all cursor-pointer ${
                                  movingFileId === file._id 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 hover:dark:text-white shadow-xs'
                                }`}
                                title="Move to Folder"
                              >
                                <FolderInput className="h-3.5 w-3.5" />
                              </button>
                              
                              {movingFileId === file._id && (
                                <div className="absolute right-0 bottom-12 z-30 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl text-left" onClick={(e) => e.stopPropagation()}>
                                  <p className="px-2 py-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">Move to Folder</p>
                                  <div className="max-h-24 overflow-y-auto mt-1 space-y-0.5">
                                    <button
                                      onClick={() => handleMoveFile(file._id, 'Root')}
                                      className={`w-full text-left rounded-lg px-2.5 py-1 text-[11px] font-semibold truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                                        file.folder === 'Root' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-zinc-700 dark:text-zinc-300'
                                      }`}
                                    >
                                      Root Drive
                                    </button>
                                    {folders.map((f) => (
                                      <button
                                        key={f._id}
                                        onClick={() => handleMoveFile(file._id, f.name)}
                                        className={`w-full text-left rounded-lg px-2.5 py-1 text-[11px] font-semibold truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                                          file.folder === f.name ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                      >
                                        {f.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => onShareClick(file)}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
                              title="Share Options"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>

                            {file.isShared && (
                              <button
                                onClick={() => handleCopyLink(file.s3Key, file._id)}
                                className={`rounded-lg p-3 md:p-1.5 border transition-all cursor-pointer ${
                                  isCopying 
                                    ? 'bg-emerald-550/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-xs'
                                }`}
                                title="Copy link"
                              >
                                {isCopying ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            )}

                            <button
                              onClick={(e) => handleTrashOrDelete(file, e)}
                              disabled={isDeleting}
                              className="rounded-lg p-3 md:p-1.5 bg-zinc-50 hover:bg-rose-500/10 dark:bg-zinc-900 dark:hover:bg-rose-500/10 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Move to Trash"
                            >
                              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
