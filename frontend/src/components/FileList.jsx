import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Grid, 
  List, 
  Copy, 
  Check, 
  Clock, 
  Trash2,
  Calendar,
  Lock,
  Globe,
  Eye
} from 'lucide-react';

export default function FileList({ files, loading, refreshFiles, searchVal, filterSharedOnly }) {
  const { api, apiBaseUrl, user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [copyingId, setCopyingId] = useState(null);
  const [sharingLoading, setSharingLoading] = useState(null);

  // Format size helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get file type configuration (color, icon)
  const getFileTypeDetails = (mimeType) => {
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) {
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: FileText };
    }
    if (type.includes('image/')) {
      return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Image };
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

  // Handle file download securely via backend API
  const handleDownload = (s3Key) => {
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${s3Key}?download=true${tokenParam}`, '_blank');
  };

  const handleView = (s3Key) => {
    const tokenParam = user?.token ? `&token=${user.token}` : '';
    window.open(`${apiBaseUrl}/api/files/download/${s3Key}?view=true${tokenParam}`, '_blank');
  };

  // Handle toggling file share status
  const handleShareToggle = async (fileId) => {
    setSharingLoading(fileId);
    try {
      await api.post(`/api/files/share/${fileId}`);
      if (refreshFiles) {
        refreshFiles();
      }
    } catch (err) {
      console.error('Sharing toggle error:', err);
      alert('Failed to change file sharing status');
    } finally {
      setSharingLoading(null);
    }
  };

  // Handle copying direct download link to clipboard
  const handleCopyLink = (s3Key, fileId) => {
    const link = `${apiBaseUrl}/api/files/download/${s3Key}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopyingId(fileId);
      setTimeout(() => setCopyingId(null), 2000);
    });
  };

  // Filter files based on search input and active tab
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchVal.toLowerCase());
    const matchesTab = filterSharedOnly ? file.isShared : true;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
          <span className="text-sm font-semibold text-slate-400">Loading items...</span>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center">
        <File className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No items found</h3>
        <p className="mt-1 text-xs text-slate-500">
          {searchVal ? 'Try adjusting your search keywords' : 'Drag & drop a file to upload into your drive'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List Control Panel */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          {filterSharedOnly ? 'Shared Links' : 'All Documents'} ({filteredFiles.length})
        </h2>
        
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 p-0.5 border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-colors cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => {
            const { color, icon: FileIcon } = getFileTypeDetails(file.fileType);
            const isCopying = copyingId === file._id;
            const isSharing = sharingLoading === file._id;

            return (
              <div 
                key={file._id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[180px]"
              >
                {/* Header detail */}
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${color}`}>
                    <FileIcon className="h-6 w-6" />
                  </div>
                  
                  {/* Share Toggle Tag */}
                  <button
                    onClick={() => handleShareToggle(file._id)}
                    disabled={isSharing}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                      file.isShared 
                        ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' 
                        : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-slate-400'
                    }`}
                  >
                    {isSharing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : file.isShared ? (
                      <>
                        <Globe className="h-3 w-3" /> Shared
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Private
                      </>
                    )}
                  </button>
                </div>

                {/* File details */}
                <div className="mt-4 min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-100" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatBytes(file.fileSize)}</span>
                    <span>•</span>
                    <span className="truncate">{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Shared Link Details */}
                {file.isShared && file.sharedLinkExpiresAt && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 px-2 py-1 text-[10px] text-indigo-400/80">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Link active until: {new Date(file.sharedLinkExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {/* Footer actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-900/40 pt-3">
                  <button
                    onClick={() => handleView(file.s3Key)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-2 text-white border-0 transition-colors cursor-pointer shadow-md shadow-indigo-650/10"
                    title="View File"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>

                  <button
                    onClick={() => handleDownload(file.s3Key)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  
                  {file.isShared && (
                    <button
                      onClick={() => handleCopyLink(file.s3Key, file._id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        isCopying 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Copy Share Link"
                    >
                      {isCopying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode View */
        <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3">Visibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/45 text-sm">
              {filteredFiles.map((file) => {
                const { color, icon: FileIcon } = getFileTypeDetails(file.fileType);
                const isCopying = copyingId === file._id;
                const isSharing = sharingLoading === file._id;

                return (
                  <tr key={file._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                          <FileIcon className="h-4.5 w-4.5" />
                        </div>
                        <span className="truncate font-medium text-slate-200" title={file.fileName}>
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{formatBytes(file.fileSize)}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleShareToggle(file._id)}
                        disabled={isSharing}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                          file.isShared 
                            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' 
                            : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-slate-400'
                        }`}
                      >
                        {isSharing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : file.isShared ? (
                          <>
                            <Globe className="h-2.5 w-2.5" /> Shared
                          </>
                        ) : (
                          <>
                            <Lock className="h-2.5 w-2.5" /> Private
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(file.s3Key)}
                          className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                          title="View File"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(file.s3Key)}
                          className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {file.isShared && (
                          <button
                            onClick={() => handleCopyLink(file.s3Key, file._id)}
                            className={`rounded-lg p-1.5 border transition-all cursor-pointer ${
                              isCopying 
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                : 'border-transparent hover:border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Copy link"
                          >
                            {isCopying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
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
