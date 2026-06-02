import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Lock, Clock, Calendar, AlertCircle, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShareModal({ isOpen, onClose, file, onShareToggle }) {
  const { api, apiBaseUrl, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [sharedWith, setSharedWith] = useState([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when file changes
  useEffect(() => {
    if (file) {
      setSharedWith(file.sharedWith || []);
      setShareEmail('');
      setSharePermission('view');
      setErrorMessage('');
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const shareUrl = `${apiBaseUrl}/api/files/download/${file.s3Key}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareUser = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setSharingLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.post(`/api/files/share-user/${file._id}`, {
        email: shareEmail.trim().toLowerCase(),
        permission: sharePermission
      });
      setSharedWith(data.sharedWith || []);
      setShareEmail('');
      if (onShareToggle) {
        onShareToggle(file._id, data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to share file');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleRemoveShare = async (userId) => {
    setSharingLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.delete(`/api/files/share-user/${file._id}/${userId}`);
      setSharedWith(data.sharedWith || []);
      if (onShareToggle) {
        onShareToggle(file._id, data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setSharingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Document</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Control access, collaboration, and visibility</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          {/* File summary */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 p-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Document Title</span>
            <span className="text-sm font-semibold text-zinc-200 mt-1 block truncate">{file.fileName}</span>
          </div>

          {/* Share with People Form */}
          <form onSubmit={handleShareUser} className="space-y-2.5">
            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">Share with People</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter user email..."
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550"
                disabled={sharingLoading}
                required
              />
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="rounded-xl border border-zinc-850 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none cursor-pointer"
                disabled={sharingLoading}
              >
                <option value="view">Viewer</option>
                <option value="edit">Editor</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 border-0"
                disabled={sharingLoading || !shareEmail.trim()}
              >
                {sharingLoading ? 'Sharing...' : 'Add'}
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-200">{errorMessage}</p>
            )}
          </form>

          {/* Shared Users List */}
          {sharedWith.length > 0 && (
            <div className="space-y-2 border-t border-zinc-900 pt-4">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">People with access</label>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {sharedWith.map((share) => (
                  <div key={share.user?._id || share.user} className="flex items-center justify-between rounded-xl bg-zinc-900/20 border border-zinc-900/60 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-zinc-200">{share.email}</p>
                      <p className="text-[10px] text-zinc-500 capitalize mt-0.5 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-indigo-400" />
                        {share.permission} access
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveShare(share.user?._id || share.user)}
                      className="text-[10px] font-bold text-rose-450 hover:text-rose-400 hover:underline cursor-pointer disabled:opacity-50 border-0 bg-transparent"
                      disabled={sharingLoading}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visibility control */}
          <div className="flex items-center justify-between py-1 border-t border-zinc-900 pt-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">Link Sharing</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {file.isShared 
                  ? 'Anyone with the link can download this document' 
                  : 'Only you and shared users can access this file'
                }
              </p>
            </div>

            <button
              onClick={() => onShareToggle(file._id)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                file.isShared ? 'bg-indigo-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  file.isShared ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Link output */}
          {file.isShared ? (
            <div className="space-y-4 animate-in fade-in duration-350">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Public Link</label>
                <div className="relative flex rounded-xl bg-zinc-900 border border-zinc-850 p-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="block w-full border-0 bg-transparent px-3 py-2.5 text-xs text-zinc-300 focus:ring-0 focus:outline-none min-w-0 truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer border-0 ${
                      copied 
                        ? 'bg-emerald-550/20 text-emerald-450 border border-emerald-500/20' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expiry Details */}
              {file.sharedLinkExpiresAt && (
                <div className="flex items-start gap-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3 text-xs text-indigo-400">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-400">Link Expiration Warning</p>
                    <p className="mt-0.5 text-indigo-400/80 leading-relaxed">
                      For security compliance, this public share link expires automatically on{' '}
                      <span className="font-bold">
                        {new Date(file.sharedLinkExpiresAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>{' '}
                      at{' '}
                      <span className="font-bold">
                        {new Date(file.sharedLinkExpiresAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>{' '}
                      (24 hours from activation).
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-zinc-900/60 border border-zinc-900 p-4 text-xs text-zinc-500">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Link sharing is currently disabled. Turn it on above to generate a shareable URL.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
