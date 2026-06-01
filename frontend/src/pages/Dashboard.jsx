import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import DropzoneUpload from '../components/DropzoneUpload';
import FileGrid from '../components/FileGrid';
import ShareModal from '../components/ShareModal';
import { FolderPlus, ChevronRight, Cloud, Lock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

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
      const { data } = await api.get('/api/files/my-files');
      setFiles(data);
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

  useEffect(() => {
    fetchAllData();
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

  const handleShareToggle = async (fileId) => {
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

                {/* Storage limit calculation */}
                {(() => {
                  const storageLimit = 20 * 1024 * 1024 * 1024;
                  const storagePercent = Math.min((totalSize / storageLimit) * 100, 100).toFixed(1);
                  return (
                    <div className="grid grid-cols-2 gap-4 my-2">
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-900/60">
                        <div className="flex items-center gap-2">
                          <div className="h-4.5 w-1.5 bg-indigo-600 dark:bg-[#dffe4c] rounded-full"></div>
                          <span className="text-2xl font-extrabold tracking-tight">{storagePercent}%</span>
                        </div>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Capacity Used</p>
                      </div>
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-900/60">
                        <div className="flex items-center gap-2">
                          <div className="h-4.5 w-1.5 bg-purple-500 dark:bg-[#b5a3ff] rounded-full"></div>
                          <span className="text-2xl font-extrabold tracking-tight">{formatBytes(totalSize)}</span>
                        </div>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Used of {formatBytes(storageLimit)} Limit</p>
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
          <div className="glass-card rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-850 bg-white dark:bg-zinc-950/20">
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
  );
}
