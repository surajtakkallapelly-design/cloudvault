import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Lock, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShareModal({ isOpen, onClose, file, onShareToggle }) {
  const { apiBaseUrl } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const shareUrl = `${apiBaseUrl}/api/files/download/${file.s3Key}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
              <p className="text-xs text-zinc-500 mt-0.5">Control public link access and visibility</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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

          {/* Visibility control */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-zinc-300">Link Sharing</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {file.isShared 
                  ? 'Anyone with the link can download this document' 
                  : 'Only you can view and download this file'
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
            <div className="space-y-4 animate-in fade-in duration-300">
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
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      copied 
                        ? 'bg-emerald-550/20 text-emerald-400 border border-emerald-500/20' 
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

              {/* Social Share Intents */}
              <div className="space-y-2 border-t border-zinc-900 pt-4">
                <label className="text-[10px] font-extrabold text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">Share to Social Networks</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this file on CloudVault: ' + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.392 9.806-9.799.002-2.618-1.01-5.083-2.857-6.93C16.38 2.03 13.919.99 11.307.99c-5.405 0-9.809 4.396-9.811 9.804-.001 1.705.452 3.371 1.31 4.823l-.997 3.644 3.737-.981zm11.387-5.464c-.301-.15-1.78-.879-2.056-.979-.275-.1-.476-.15-.676.15-.2.3-.775.979-.95 1.179-.175.2-.35.225-.65.075-1.04-.519-1.841-.956-2.57-2.209-.19-.325-.19-.537-.04-.687.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.629-.926-2.229-.244-.589-.493-.51-.676-.519-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 0-.375-.275-.975-1.077-1.375-1.828-1.579-.175-.075-.35-.05-.525.075-.175.125-.8.775-.8 1.89s.825 2.19 1.175 2.64c.35.45 2.412 3.682 5.84 5.163.815.352 1.451.562 1.947.72.818.261 1.563.224 2.152.137.656-.098 1.781-.729 2.03-1.433.25-.704.25-1.307.175-1.433-.075-.125-.275-.225-.575-.375z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 text-[#1877F2] py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>

                  {/* Instagram (Custom Instruction copy click) */}
                  <button
                    onClick={() => {
                      handleCopy();
                      alert('Share link copied to clipboard!\n\nNote: Instagram does not support direct link clicks in captions. You can now paste this URL into your Bio or add it as a Link Sticker on your Instagram Story!');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/20 text-[#E1306C] py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    <span>Instagram</span>
                  </button>
                </div>
              </div>

              {/* Expiry Details */}
              {file.sharedLinkExpiresAt && (
                <div className="flex items-start gap-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3 text-xs text-indigo-400">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Link Expiration Warning</p>
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
