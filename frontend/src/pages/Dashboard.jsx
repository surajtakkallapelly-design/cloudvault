import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import DropzoneUpload from '../components/DropzoneUpload';
import FileGrid from '../components/FileGrid';
import ShareModal from '../components/ShareModal';
import { FolderPlus, ChevronRight, Cloud, Lock, CheckCircle, AlertTriangle, RefreshCw, Download, ArrowUpDown, Trash, RotateCcw, FolderClosed, Users, Check, Filter } from 'lucide-react';
import { UploadProvider } from '../context/UploadContext';
import UploadDrawer from '../components/UploadDrawer';
import FilePreviewModal from '../components/FilePreviewModal';

export default function Dashboard() {
  const { api, user, updateUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('my-files');
  const [searchVal, setSearchVal] = useState('');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('Root');
  const [loading, setLoading] = useState(true);
  const [sharingFile, setSharingFile] = useState(null);
  const [statsView, setStatsView] = useState('Monthly');
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Advanced filters & bulk selection states
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Event listener to refresh files when parallel uploads succeed
  useEffect(() => {
    const handleFilesUpdated = () => {
      fetchAllData();
    };
    window.addEventListener('vault-files-updated', handleFilesUpdated);
    return () => {
      window.removeEventListener('vault-files-updated', handleFilesUpdated);
    };
  }, []);

  // Settings states
  const [settingsName, setSettingsName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [primaryRole, setPrimaryRole] = useState('Creator');
  const [timezone, setTimezone] = useState('UTC');

  const [selectedColor, setSelectedColor] = useState('bg-indigo-500/10 text-indigo-400 border-indigo-500/20');

  useEffect(() => {
    if (user?.name) {
      setSettingsName(user.name);
    }
    if (user?.avatarColor) {
      setSelectedColor(user.avatarColor);
    }
    if (user?.role) {
      setPrimaryRole(user.role);
    }
    if (user?.timezone) {
      setTimezone(user.timezone);
    }
  }, [user]);

  // Close stats dropdown when clicking outside
  useEffect(() => {
    if (!showStatsDropdown) return;
    const handleClose = () => setShowStatsDropdown(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [showStatsDropdown]);


  const handleSaveSettings = async () => {
    setSettingsSuccess('');
    setSettingsError('');

    if (!settingsName.trim()) {
      setSettingsError('Display Name cannot be empty');
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        setSettingsError('Please provide your current password to update it.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setSettingsError('New passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setSettingsError('New password must be at least 6 characters.');
        return;
      }
    }

    setSavingSettings(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update locally saved user info (via context helper)
      updateUser({ 
        name: settingsName.trim(), 
        avatarColor: selectedColor,
        role: primaryRole,
        timezone: timezone
      });
      
      setSettingsSuccess('Profile settings successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSettingsError('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };


  
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      if (currentTab === 'shared') {
        const { data } = await api.get('/api/files/shared-with-me');
        setFiles(data);
      } else {
        const params = {
          sortBy,
          type: fileTypeFilter,
          starred: currentTab === 'starred' ? 'true' : 'false',
          trash: currentTab === 'trash' ? 'true' : 'false',
          folder: currentTab === 'my-files' ? activeFolder : '',
          search: searchVal
        };
        const { data } = await api.get('/api/files/my-files', { params });
        setFiles(data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/api/files/folders');
      setFolders(data);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchAllData = () => {
    fetchFiles();
    fetchFolders();
  };

  // Refetch files on navigation, sorting, filter or search changes
  useEffect(() => {
    fetchFiles();
    // Clear selection when tab or folder changes to prevent accidental bulk actions
    setSelectedFileIds([]);
    setSelectedFolderIds([]);
  }, [currentTab, activeFolder, sortBy, fileTypeFilter, searchVal]);

  // Initial fetch for folders (files are fetched by the above useEffect)
  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { data } = await api.post('/api/files/folders', { name: newFolderName.trim() });
      setFolders((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName('');
      setShowNewFolderModal(false);
      setActiveFolder(data.name); // Automatically navigate into newly created folder
    } catch (err) {
      alert('Failed to create folder: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBulkTrash = async () => {
    const totalSelected = selectedFileIds.length + selectedFolderIds.length;
    if (totalSelected === 0) return;
    if (window.confirm(`Are you sure you want to move the ${totalSelected} selected item(s) to the trash?`)) {
      try {
        setLoading(true);
        await api.post('/api/files/bulk-trash', {
          fileIds: selectedFileIds,
          folderIds: selectedFolderIds
        });
        setSelectedFileIds([]);
        setSelectedFolderIds([]);
        fetchAllData();
      } catch (err) {
        alert('Failed to trash items: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    const totalSelected = selectedFileIds.length + selectedFolderIds.length;
    if (totalSelected === 0) return;
    try {
      setLoading(true);
      await api.post('/api/files/bulk-restore', {
        fileIds: selectedFileIds,
        folderIds: selectedFolderIds
      });
      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      fetchAllData();
    } catch (err) {
      alert('Failed to restore items: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const totalSelected = selectedFileIds.length + selectedFolderIds.length;
    if (totalSelected === 0) return;
    if (window.confirm(`WARNING: This will PERMANENTLY delete the ${selectedFileIds.length} selected file(s) and ${selectedFolderIds.length} selected folder(s) and all their contents from storage. This action CANNOT be undone. Are you sure?`)) {
      try {
        setLoading(true);
        await api.post('/api/files/bulk-delete', {
          fileIds: selectedFileIds,
          folderIds: selectedFolderIds
        });
        setSelectedFileIds([]);
        setSelectedFolderIds([]);
        fetchAllData();
      } catch (err) {
        alert('Failed to permanently delete items: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFileIds.length === 0) {
      alert('Please select files (not folders) to download.');
      return;
    }
    try {
      const token = user?.token;
      const idsParam = selectedFileIds.join(',');
      const downloadUrl = `${api.defaults.baseURL || ''}/api/files/bulk-download?ids=${idsParam}&token=${token}`;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'cloudvault-bulk-download.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSelectedFileIds([]);
    } catch (err) {
      alert('Failed to start bulk download: ' + err.message);
    }
  };

  const handleBulkMove = async (targetFolder) => {
    if (selectedFileIds.length === 0) return;
    try {
      setLoading(true);
      await api.post('/api/files/bulk-move', {
        fileIds: selectedFileIds,
        folderName: targetFolder
      });
      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      setShowMoveModal(false);
      fetchAllData();
    } catch (err) {
      alert('Failed to move files: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleShareToggle = async (fileId, updatedData = null) => {
    if (updatedData) {
      setFiles((prev) => prev.map((f) => f._id === fileId ? updatedData : f));
      setSharingFile(updatedData);
      return;
    }
    try {
      const { data } = await api.post(`/api/files/share/${fileId}`);
      setFiles((prev) => prev.map((f) => f._id === fileId ? data : f));
      setSharingFile(data);
    } catch (err) {
      console.error('Sharing toggle error:', err);
      alert('Failed to toggle sharing status');
    }
  };

  // Compute metrics
  const filesCount = files.length;
  const totalSize = files.reduce((acc, curr) => acc + curr.fileSize, 0);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <UploadProvider>
      <DashboardLayout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      searchVal={searchVal}
      setSearchVal={setSearchVal}
      filesCount={filesCount}
      totalSize={totalSize}
    >
      {/* Workspace Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-900/60 mb-6">
        <div>
          {/* Breadcrumbs Navigation */}
          {currentTab === 'my-files' && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold mb-2">
              <button 
                onClick={() => setActiveFolder('Root')}
                className={`hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer ${
                  activeFolder === 'Root' ? 'text-zinc-800 dark:text-zinc-200 font-bold' : ''
                }`}
              >
                Root Drive
              </button>
              {activeFolder !== 'Root' && (
                <>
                  <ChevronRight className="h-3 w-3 text-zinc-400" />
                  <span className="text-zinc-800 dark:text-zinc-300 font-bold">{activeFolder}</span>
                </>
              )}
            </div>
          )}

          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white m-0">
            {currentTab === 'my-files' 
              ? (activeFolder === 'Root' ? 'Personal Vault' : activeFolder) 
              : currentTab === 'recent'
              ? 'Recent Files'
              : currentTab === 'starred'
              ? 'Starred Files'
              : currentTab === 'shared'
              ? 'Shared Links'
              : currentTab === 'trash'
              ? 'Trash Bin'
              : 'Account Settings'
            }
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {currentTab === 'my-files' 
              ? 'S3Presigned nodes and document indexes' 
              : currentTab === 'recent'
              ? 'Your recently uploaded documents and assets'
              : currentTab === 'starred'
              ? 'Documents you\'ve marked as important'
              : currentTab === 'shared'
              ? 'Direct download pipelines currently open to anonymous fetch requests'
              : currentTab === 'trash'
              ? 'Soft-deleted files that can be restored or permanently purged'
              : 'Manage your CloudVault profile and security credentials'
            }
          </p>
        </div>

        {/* Action Panel: New Folder button */}
        {currentTab === 'my-files' && (
          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={() => {
                setNewFolderName('');
                setShowNewFolderModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold px-4 py-2.5 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer shadow-sm hover:border-zinc-300"
            >
              <FolderPlus className="h-4 w-4 text-indigo-500" />
              New Folder
            </button>
          </div>
        )}
      </div>

      {currentTab === 'settings' ? (
        /* Settings panel content view */
        <div className="glass-card bg-white dark:bg-zinc-950/40 rounded-3xl p-6 md:p-8 border border-zinc-200/60 dark:border-zinc-850 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="border-b border-zinc-200 dark:border-zinc-900 pb-4">
            <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Profile Configuration</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage your public user profile and identity credentials.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl font-black border shadow-inner transition-all ${selectedColor}`}>
                {settingsName ? settingsName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Account Initials</span>
            </div>

            {/* Inputs Block */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-2">Avatar Theme Color</label>
                <div className="flex gap-2">
                  {[
                    { id: 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20', color: 'bg-indigo-500' },
                    { id: 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20', color: 'bg-emerald-500' },
                    { id: 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20', color: 'bg-amber-500' },
                    { id: 'bg-rose-500/10 text-rose-650 dark:text-rose-400 border-rose-500/20', color: 'bg-rose-500' },
                    { id: 'bg-fuchsia-500/10 text-fuchsia-650 dark:text-fuchsia-400 border-fuchsia-500/20', color: 'bg-fuchsia-500' },
                    { id: 'bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border-cyan-500/20', color: 'bg-cyan-500' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(item.id)}
                      className={`h-7 w-7 rounded-full transition-transform cursor-pointer hover:scale-110 active:scale-90 border-2 ${item.color} ${
                        selectedColor === item.id ? 'border-white dark:border-zinc-300 ring-2 ring-indigo-500 scale-105' : 'border-transparent'
                      }`}
                      title="Select avatar color"
                    ></button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/20 px-3.5 py-2.5 pl-9 text-xs text-zinc-500 dark:text-zinc-500 font-semibold cursor-not-allowed select-none"
                    />
                    <Lock className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Primary Role</label>
                  <select
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="Creator">Creator</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Preferred Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-900 pt-6">
            <div className="border-b border-zinc-200 dark:border-zinc-900 pb-4 mb-4">
              <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Update Password</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Change your security credentials. To keep your password, leave fields blank.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {settingsSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in slide-in-from-top-2 duration-200">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/5 border border-rose-500/15 p-3 text-xs text-rose-600 dark:text-rose-450 font-semibold animate-in slide-in-from-top-2 duration-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{settingsError}</span>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-900">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings || !settingsName.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {savingSettings && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top dashboard section with Sleep Analysis storage metric v Dropzone Upload grid */}
          {currentTab === 'my-files' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Storage Analysis sleeping-chart-style card */}
              <div className="bg-white dark:bg-[#111317] text-zinc-800 dark:text-white rounded-3xl p-6 shadow-sm dark:shadow-xl border border-zinc-200/80 dark:border-zinc-900 lg:col-span-2 flex flex-col justify-between min-h-[220px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-indigo-650 dark:text-indigo-400">
                      <Cloud className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Storage Analysis</h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Vault Space breakdown</p>
                    </div>
                  </div>
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatsDropdown(!showStatsDropdown);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800/60 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <span>{statsView}</span>
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </button>
                    
                    {showStatsDropdown && (
                      <div className="absolute right-0 top-8 z-30 w-28 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-1 shadow-xl dark:shadow-2xl flex flex-col text-left">
                        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((view) => (
                          <button
                            key={view}
                            type="button"
                            onClick={() => {
                              setStatsView(view);
                              setShowStatsDropdown(false);
                            }}
                            className={`w-full text-left rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                              statsView === view ? 'text-indigo-650 dark:text-[#dffe4c]' : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {view}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Storage limit calculation & Donut Chart breakdown */}
                {(() => {
                  const storageLimit = 20 * 1024 * 1024 * 1024;
                  const storagePercent = Math.min((totalSize / storageLimit) * 100, 100).toFixed(1);
                  
                  // Categorize files
                  const categories = {
                    Images: { size: 0, count: 0, color: '#6366f1', bgClass: 'bg-indigo-500 border-indigo-500/30' },
                    Videos: { size: 0, count: 0, color: '#3b82f6', bgClass: 'bg-blue-500 border-blue-500/30' },
                    Documents: { size: 0, count: 0, color: '#10b981', bgClass: 'bg-emerald-500 border-emerald-500/30' },
                    Archives: { size: 0, count: 0, color: '#f97316', bgClass: 'bg-orange-500 border-orange-500/30' },
                    Others: { size: 0, count: 0, color: '#64748b', bgClass: 'bg-slate-500 border-slate-500/30' }
                  };

                  files.forEach((file) => {
                    const type = (file.fileType || '').toLowerCase();
                    const ext = (file.fileName || '').split('.').pop().toLowerCase();

                    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
                      categories.Images.size += file.fileSize;
                      categories.Images.count += 1;
                    } else if (type.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) {
                      categories.Videos.size += file.fileSize;
                      categories.Videos.count += 1;
                    } else if (type.startsWith('audio/') || type.includes('pdf') || type.includes('word') || type.includes('excel') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) {
                      categories.Documents.size += file.fileSize;
                      categories.Documents.count += 1;
                    } else if (type.includes('zip') || type.includes('tar') || type.includes('rar') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
                      categories.Archives.size += file.fileSize;
                      categories.Archives.count += 1;
                    } else {
                      categories.Others.size += file.fileSize;
                      categories.Others.count += 1;
                    }
                  });

                  const categoriesArray = Object.entries(categories).map(([name, data]) => ({
                    name,
                    ...data,
                    percent: totalSize > 0 ? (data.size / totalSize) * 100 : 0
                  }));

                  // Build CSS conic gradient
                  let accumulatedPercent = 0;
                  const gradientSlices = categoriesArray.map((cat) => {
                    const start = accumulatedPercent;
                    accumulatedPercent += cat.percent;
                    return `${cat.color} ${start}% ${accumulatedPercent}%`;
                  });
                  const conicGradientString = totalSize > 0 
                    ? `conic-gradient(${gradientSlices.join(', ')})` 
                    : 'conic-gradient(var(--color-zinc-200, #e4e4e7) 0% 100%)';

                  return (
                    <div className="flex flex-col md:flex-row items-center gap-6 my-4 select-none">
                      {/* Left: CSS Donut Chart */}
                      <div 
                        className="relative shrink-0 flex items-center justify-center h-28 w-28 rounded-full shadow-inner transition-all duration-300" 
                        style={{ background: conicGradientString }}
                      >
                        {/* Center circle */}
                        <div className="absolute inset-2 bg-white dark:bg-[#111317] rounded-full flex flex-col items-center justify-center shadow-xs">
                          <span className="text-lg font-black tracking-tight">{storagePercent}%</span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">Used</span>
                        </div>
                      </div>

                      {/* Right: Category Breakdown Legend */}
                      <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categoriesArray.map((cat) => (
                          <div 
                            key={cat.name}
                            onMouseEnter={() => setHoveredCategory(cat.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`p-2 rounded-xl border transition-all duration-200 ${
                              hoveredCategory === cat.name 
                                ? 'bg-zinc-55 dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 scale-102 shadow-xs' 
                                : 'bg-zinc-50/20 dark:bg-zinc-900/10 border-zinc-150/40 dark:border-zinc-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className={`h-2 w-2 rounded-full ${cat.bgClass} border`}></div>
                              <span className="text-[9px] font-extrabold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">{cat.name}</span>
                            </div>
                            <p className="text-xs font-black tracking-tight text-zinc-800 dark:text-zinc-200">{formatBytes(cat.size)}</p>
                            <p className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{cat.count} file{cat.count !== 1 ? 's' : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Dynamic Bar Chart based on statsView Selection */}
                <div className="flex items-end justify-between gap-2 h-20 pt-4 border-t border-zinc-200/80 dark:border-zinc-900">
                  {(() => {
                    const now = new Date();
                    let chartData = [];

                    if (statsView === 'Daily') {
                      const days = [
                        { label: 'Mon', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Tue', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Wed', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Thu', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Fri', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Sat', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Sun', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                      ];
                      
                      files.forEach(file => {
                        const d = new Date(file.createdAt);
                        let dayIdx = d.getDay(); // 0 is Sun, 1 is Mon...
                        const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
                        if (mappedIdx >= 0 && mappedIdx < 7) {
                          days[mappedIdx].size += file.fileSize;
                        }
                      });

                      const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
                      days.forEach((day, idx) => {
                        if (idx === todayIdx) {
                          day.color = 'bg-indigo-600 dark:bg-[#dffe4c]';
                        } else if (day.size > 0) {
                          day.color = 'bg-purple-500 dark:bg-[#b5a3ff]';
                        }
                      });

                      const maxSize = Math.max(...days.map(d => d.size), 1);
                      chartData = days.map(d => ({
                        label: d.label,
                        heightPercent: d.size > 0 ? Math.max((d.size / maxSize) * 100, 15) : 0,
                        color: d.color,
                        tooltip: `${d.label}: ${formatBytes(d.size)} uploaded`,
                      }));
                    } else if (statsView === 'Weekly') {
                      const weeks = [
                        { label: 'Wk 1', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Wk 2', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Wk 3', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Wk 4', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Wk 5', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                      ];

                      files.forEach(file => {
                        const d = new Date(file.createdAt);
                        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                          const date = d.getDate();
                          const wkIdx = Math.min(Math.floor((date - 1) / 7), 4);
                          weeks[wkIdx].size += file.fileSize;
                        }
                      });

                      const currentWkIdx = Math.min(Math.floor((now.getDate() - 1) / 7), 4);
                      weeks.forEach((wk, idx) => {
                        if (idx === currentWkIdx) {
                          wk.color = 'bg-indigo-600 dark:bg-[#dffe4c]';
                        } else if (wk.size > 0) {
                          wk.color = 'bg-purple-500 dark:bg-[#b5a3ff]';
                        }
                      });

                      const maxSize = Math.max(...weeks.map(w => w.size), 1);
                      chartData = weeks.map(w => ({
                        label: w.label,
                        heightPercent: w.size > 0 ? Math.max((w.size / maxSize) * 100, 15) : 0,
                        color: w.color,
                        tooltip: `${w.label}: ${formatBytes(w.size)} uploaded`,
                      }));
                    } else if (statsView === 'Monthly') {
                      const months = [
                        { label: 'Jan', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Feb', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Mar', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Apr', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'May', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Jun', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Jul', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Aug', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Sep', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Oct', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Nov', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: 'Dec', size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                      ];

                      files.forEach(file => {
                        const d = new Date(file.createdAt);
                        if (d.getFullYear() === now.getFullYear()) {
                          const mIdx = d.getMonth();
                          if (mIdx >= 0 && mIdx < 12) {
                            months[mIdx].size += file.fileSize;
                          }
                        }
                      });

                      const currentMIdx = now.getMonth();
                      months.forEach((m, idx) => {
                        if (idx === currentMIdx) {
                          m.color = 'bg-indigo-600 dark:bg-[#dffe4c]';
                        } else if (m.size > 0) {
                          m.color = 'bg-purple-500 dark:bg-[#b5a3ff]';
                        }
                      });

                      let startIdx = Math.max(0, currentMIdx - 6);
                      if (startIdx + 7 > 12) {
                        startIdx = 5;
                      }
                      const visibleMonths = months.slice(startIdx, startIdx + 7);

                      const maxSize = Math.max(...visibleMonths.map(m => m.size), 1);
                      chartData = visibleMonths.map(m => ({
                        label: m.label,
                        heightPercent: m.size > 0 ? Math.max((m.size / maxSize) * 100, 15) : 0,
                        color: m.color,
                        tooltip: `${m.label}: ${formatBytes(m.size)} uploaded`,
                      }));
                    } else if (statsView === 'Yearly') {
                      const currentYear = now.getFullYear();
                      const years = [
                        { label: String(currentYear - 3), size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: String(currentYear - 2), size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: String(currentYear - 1), size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                        { label: String(currentYear), size: 0, color: 'bg-zinc-200 dark:bg-zinc-800' },
                      ];

                      files.forEach(file => {
                        const d = new Date(file.createdAt);
                        const yr = d.getFullYear();
                        const yrIdx = years.findIndex(y => y.label === String(yr));
                        if (yrIdx !== -1) {
                          years[yrIdx].size += file.fileSize;
                        }
                      });

                      years.forEach((y, idx) => {
                        if (y.label === String(currentYear)) {
                          y.color = 'bg-indigo-600 dark:bg-[#dffe4c]';
                        } else if (y.size > 0) {
                          y.color = 'bg-purple-500 dark:bg-[#b5a3ff]';
                        }
                      });

                      const maxSize = Math.max(...years.map(y => y.size), 1);
                      chartData = years.map(y => ({
                        label: y.label,
                        heightPercent: y.size > 0 ? Math.max((y.size / maxSize) * 100, 15) : 0,
                        color: y.color,
                        tooltip: `${y.label}: ${formatBytes(y.size)} uploaded`,
                      }));
                    }

                    return chartData.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1" title={item.tooltip}>
                        <div className="w-full bg-zinc-100/60 dark:bg-zinc-900/50 rounded-t-md h-12 flex items-end">
                          <div
                            className={`w-full rounded-t-md transition-all duration-700 ${item.color}`}
                            style={{ height: `${item.heightPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{item.label}</span>
                      </div>
                    ));
                  })()}
                </div>

              </div>

              {/* Dropzone Upload card */}
              <div className="glass-card rounded-3xl p-5 border border-zinc-200/60 dark:border-zinc-850 flex flex-col justify-center min-h-[220px] bg-white dark:bg-zinc-950/30">
                <DropzoneUpload 
                  onUploadSuccess={fetchAllData} 
                  activeFolder={activeFolder} 
                  totalSize={totalSize} 
                  storageLimit={20 * 1024 * 1024 * 1024} 
                />
              </div>
            </div>
          )}

          {/* Files Grid and view toggles */}
          <div className="glass-card rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-850 bg-white dark:bg-zinc-950/20 relative">
            
            {/* Bulk Actions Floating Bar */}
            {(selectedFileIds.length > 0 || selectedFolderIds.length > 0) && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-indigo-600 p-4 text-white shadow-lg animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white font-extrabold text-xs">
                    {selectedFileIds.length + selectedFolderIds.length}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Items Selected</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Download (Files only) */}
                  {selectedFileIds.length > 0 && (
                    <button
                      onClick={handleBulkDownload}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white"
                      title="Download selected files as ZIP"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download ZIP
                    </button>
                  )}

                  {/* Move (Files only) */}
                  {selectedFileIds.length > 0 && currentTab === 'my-files' && (
                    <button
                      onClick={() => setShowMoveModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white"
                    >
                      <FolderClosed className="h-3.5 w-3.5" />
                      Move
                    </button>
                  )}

                  {/* Trash / Restore / Delete */}
                  {currentTab === 'trash' ? (
                    <>
                      <button
                        onClick={handleBulkRestore}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Delete Forever
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleBulkTrash}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Move to Trash
                    </button>
                  )}

                  {/* Clear Selection */}
                  <button
                    onClick={() => { setSelectedFileIds([]); setSelectedFolderIds([]); }}
                    className="text-xs font-bold uppercase hover:underline ml-2 transition-all cursor-pointer text-zinc-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Filters and Sorting Bar */}
            {currentTab !== 'settings' && (
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-5">
                {/* Category Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'All', id: 'all' },
                    { label: 'Images', id: 'image' },
                    { label: 'PDFs', id: 'pdf' },
                    { label: 'Documents', id: 'document' },
                    { label: 'Videos', id: 'video' },
                    { label: 'Audio', id: 'audio' },
                    { label: 'Code/Text', id: 'text' },
                  ].map((chip) => {
                    const isActive = fileTypeFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => setFileTypeFilter(chip.id)}
                        className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sort Option Control */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="createdAt_desc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Newest First</option>
                    <option value="createdAt_asc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Oldest First</option>
                    <option value="fileSize_desc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Size: Largest</option>
                    <option value="fileSize_asc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Size: Smallest</option>
                    <option value="fileName_asc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Name: A-Z</option>
                    <option value="fileName_desc" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">Name: Z-A</option>
                  </select>
                </div>
              </div>
            )}

            <FileGrid 
              files={files} 
              folders={folders}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              loading={loading} 
              refreshFiles={fetchAllData}
              searchVal={searchVal}
              currentTab={currentTab}
              onShareClick={(file) => setSharingFile(file)}
              onViewFile={setPreviewFile}
              selectedFileIds={selectedFileIds}
              setSelectedFileIds={setSelectedFileIds}
              selectedFolderIds={selectedFolderIds}
              setSelectedFolderIds={setSelectedFolderIds}
            />
          </div>
        </div>
      )}

      {/* New Folder custom modal prompt overlay */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm" onClick={() => setShowNewFolderModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Create new folder</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Folders let you group documents and keep your vault organized.</p>
            
            <input
              type="text"
              placeholder="Folder name (e.g. Invoices, Code)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="mt-4 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 px-3 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolderModal(false);
              }}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal overlay portal */}
      <ShareModal 
        isOpen={!!sharingFile} 
        onClose={() => setSharingFile(null)} 
        file={sharingFile} 
        onShareToggle={handleShareToggle}
      />
    </DashboardLayout>
    <UploadDrawer />
    <FilePreviewModal 
      isOpen={!!previewFile} 
      onClose={() => setPreviewFile(null)} 
      file={previewFile} 
      refreshFiles={fetchFiles}
    />
      {/* Bulk Move Target Folder Selection Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white">Move files to folder</h3>
            <p className="text-xs text-zinc-500 mt-1">Select the destination folder for the {selectedFileIds.length} selected file(s).</p>
            
            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {/* Root option */}
              <button
                onClick={() => handleBulkMove('Root')}
                className="flex w-full items-center gap-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 px-4 py-3 text-xs font-bold text-zinc-200 text-left transition-all cursor-pointer"
              >
                <FolderClosed className="h-4 w-4 text-indigo-500" />
                Root Directory
              </button>

              {/* User custom folders list */}
              {folders.map((folderItem) => (
                <button
                  key={folderItem._id}
                  onClick={() => handleBulkMove(folderItem.name)}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 px-4 py-3 text-xs font-bold text-zinc-200 text-left transition-all cursor-pointer"
                >
                  <FolderClosed className="h-4 w-4 text-indigo-500" />
                  {folderItem.name}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="rounded-xl border border-zinc-800 hover:bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </UploadProvider>
  );
}
