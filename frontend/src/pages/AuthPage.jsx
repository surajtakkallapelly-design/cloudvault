import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, Loader2, Mail, Lock, User, Eye, EyeOff, 
  Globe, History, Layers, Shield, Search, Upload, Share2, 
  Trash2, CheckCircle2, ChevronRight, Plus, Database, HardDrive, RefreshCw, X, FileText, Image, FileArchive, Laptop, Server, Cloud, ArrowLeft
} from 'lucide-react';

export default function AuthPage() {
  // Real Authentication States
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot-email' | 'forgot-otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, requestOtp, resetPassword } = useAuth();

  // Interactive Mockup States
  const [mockTab, setMockTab] = useState('vault'); // 'vault' | 'shared' | 'versions'
  const [mockSearch, setMockSearch] = useState('');
  const [mockStorageUsed, setMockStorageUsed] = useState(6.4); // GB out of 20
  const [mockActiveFolderId, setMockActiveFolderId] = useState(null);
  const [mockUploading, setMockUploading] = useState(false);
  const [mockToast, setMockToast] = useState('');

  // Mock Data
  const [mockFolders, setMockFolders] = useState([
    { id: 1, name: 'Design Assets', shared: true, collaborators: ['sarah@company.com', 'alex@company.com'] },
    { id: 2, name: 'Personal Receipts', shared: false, collaborators: [] },
    { id: 3, name: 'Production Backups', shared: false, collaborators: [] }
  ]);

  const [mockFiles, setMockFiles] = useState([
    { id: 101, name: 'Q3_Roadmap_Final.pdf', size: '2.4 MB', type: 'pdf', versions: 3, lastModified: '2 hrs ago', activeFolderId: 1 },
    { id: 102, name: 'hero_landing_mockup.png', size: '4.8 MB', type: 'image', versions: 2, lastModified: 'Yesterday', activeFolderId: 1 },
    { id: 103, name: 'onboarding_specs.docx', size: '780 KB', type: 'doc', versions: 1, lastModified: '3 days ago', activeFolderId: 2 },
    { id: 104, name: 'financials_q2.xlsx', size: '1.6 MB', type: 'spreadsheet', versions: 4, lastModified: '1 week ago', activeFolderId: null }
  ]);

  const [mockSharedFolders, setMockSharedFolders] = useState([
    { id: 201, name: 'Shared Branding Guidelines', owner: 'sarah@design.com', permission: 'Editor' },
    { id: 202, name: 'API Endpoints Draft', owner: 'tech-lead@team.com', permission: 'Viewer' }
  ]);

  const [mockSharedFiles, setMockSharedFiles] = useState([
    { id: 301, name: 'website_copy_v3.docx', size: '340 KB', type: 'doc', owner: 'copywriter@agency.com', permission: 'Editor' },
    { id: 302, name: 'analytics_db_dump.sql', size: '124.5 MB', type: 'code', owner: 'devops@company.com', permission: 'Viewer' }
  ]);

  // Mock Interactive Modals/Drawers States
  const [selectedMockFile, setSelectedMockFile] = useState(null); // File object for version history drawer
  const [selectedMockFolderToShare, setSelectedMockFolderToShare] = useState(null); // Folder object for sharing overlay
  const [mockCollaboratorEmail, setMockCollaboratorEmail] = useState('');
  const [mockCollaboratorRole, setMockCollaboratorRole] = useState('Viewer');

  // Real Auth Form Validation
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (mode === 'login' || mode === 'signup') {
      if (mode === 'signup' && !name) {
        setError('Name is required.');
        return false;
      }
      if (!email || !password) {
        setError('Please fill in all fields.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
    }

    if (mode === 'forgot-otp') {
      if (!otp || !newPassword) {
        setError('Please enter the OTP and a new password.');
        return false;
      }
      if (otp.length !== 6 || isNaN(otp)) {
        setError('OTP must be a 6-digit number.');
        return false;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return false;
      }
    }

    return true;
  };

  // Real Auth Form Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setLoading(true);
    let result;

    if (mode === 'login') {
      result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } else if (mode === 'signup') {
      result = await signup(name, email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } else if (mode === 'forgot-email') {
      result = await requestOtp(email);
      setLoading(false);
      if (result.success) {
        setSuccessMessage('OTP sent successfully. Please check your email (check your spam folder if not found in your inbox).');
        setMode('forgot-otp');
      } else {
        setError(result.error);
      }
    } else if (mode === 'forgot-otp') {
      result = await resetPassword(email, otp, newPassword);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  const resetFields = () => {
    setError('');
    setSuccessMessage('');
    setName('');
    setEmail('');
    setPassword('');
    setOtp('');
    setNewPassword('');
  };

  // Mockup Helper Actions
  const showToast = (message) => {
    setMockToast(message);
    setTimeout(() => setMockToast(''), 3000);
  };

  const handleMockUpload = () => {
    if (mockStorageUsed >= 20.0) {
      showToast('Error: Storage quota exceeded! Clear space to upload.');
      return;
    }

    setMockUploading(true);
    setTimeout(() => {
      const isPdf = Math.random() > 0.5;
      const fileSizeNum = parseFloat((Math.random() * 4 + 0.5).toFixed(1));
      const newFile = {
        id: Date.now(),
        name: isPdf ? `s3_backup_${mockFiles.length + 1}.pdf` : `screenshot_layout_${mockFiles.length + 1}.png`,
        size: `${fileSizeNum} MB`,
        type: isPdf ? 'pdf' : 'image',
        versions: 1,
        lastModified: 'Just now',
        activeFolderId: mockActiveFolderId
      };

      setMockFiles(prev => [newFile, ...prev]);
      const addedGB = parseFloat((fileSizeNum / 1000).toFixed(2));
      setMockStorageUsed(prev => parseFloat(Math.min(20.0, prev + addedGB).toFixed(2)));
      setMockUploading(false);
      showToast('Mock File uploaded to AWS S3 successfully!');
    }, 1200);
  };

  const handleMockShare = (e) => {
    e.preventDefault();
    if (!mockCollaboratorEmail) return;

    setMockFolders(prev => prev.map(folder => {
      if (folder.id === selectedMockFolderToShare.id) {
        return {
          ...folder,
          shared: true,
          collaborators: [...folder.collaborators, mockCollaboratorEmail]
        };
      }
      return folder;
    }));

    showToast(`Shared "${selectedMockFolderToShare.name}" with ${mockCollaboratorEmail}!`);
    setMockCollaboratorEmail('');
    setSelectedMockFolderToShare(null);
  };

  const handleMockDeleteFile = (id) => {
    const file = mockFiles.find(f => f.id === id);
    if (!file) return;

    setMockFiles(prev => prev.filter(f => f.id !== id));
    const sizeMB = parseFloat(file.size.split(' ')[0]);
    const savedGB = parseFloat((sizeMB / 1000).toFixed(2));
    setMockStorageUsed(prev => parseFloat(Math.max(0.0, prev - savedGB).toFixed(2)));
    showToast(`Deleted mock file "${file.name}"`);
  };

  const handleMockRestoreVersion = (versionIndex) => {
    showToast(`Restored version ${versionIndex} of "${selectedMockFile.name}"!`);
    setSelectedMockFile(null);
  };

  // Filter mockup data based on active tab & search query
  const filteredMockFolders = mockTab === 'vault' 
    ? mockFolders.filter(f => mockActiveFolderId === null && f.name.toLowerCase().includes(mockSearch.toLowerCase()))
    : mockTab === 'shared' 
      ? mockSharedFolders.filter(f => f.name.toLowerCase().includes(mockSearch.toLowerCase()))
      : [];

  const filteredMockFiles = mockTab === 'vault'
    ? mockFiles.filter(f => f.activeFolderId === mockActiveFolderId && f.name.toLowerCase().includes(mockSearch.toLowerCase()))
    : mockTab === 'shared'
      ? mockSharedFiles.filter(f => f.name.toLowerCase().includes(mockSearch.toLowerCase()))
      : mockFiles.filter(f => f.versions > 1 && f.name.toLowerCase().includes(mockSearch.toLowerCase())); // show versioned items

  // Auth labels helpers
  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'forgot-email': return 'Reset your password';
      case 'forgot-otp': return 'Enter verification OTP';
      case 'login':
      default: return 'Welcome back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Get 20 GB of free cloud storage';
      case 'forgot-email': return 'We will send a One-Time Password to your email';
      case 'forgot-otp': return `Check your inbox/spam folder for the code sent to ${email}`;
      case 'login':
      default: return 'Access your secure storage vault';
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-rose-450" />;
      case 'image': return <Image className="h-4 w-4 text-emerald-450" />;
      case 'spreadsheet': return <Layers className="h-4 w-4 text-indigo-400" />;
      case 'zip': return <FileArchive className="h-4 w-4 text-amber-500" />;
      default: return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Neon Blur Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[600px] right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-650 text-white shadow-lg shadow-indigo-650/30">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide leading-none">CloudVault</h1>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5 block">Storage Workspace</span>
            </div>
          </div>

          {/* Nav links (hidden on mobile, smooth scroll to sections) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
            <a href="#preview" className="hover:text-indigo-400 transition-colors">Sandbox Preview</a>
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
          </nav>

          <div>
            <button 
              onClick={() => {
                resetFields();
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-850 hover:text-indigo-300 transition-all cursor-pointer"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      {/* Section 1: Hero & Auth split layout */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Hero Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
            ⚡ AWS S3 & MongoDB Cloud Vault
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-550 bg-clip-text text-transparent">
            Secure, Collaborative, <br />
            <span className="text-indigo-400">Vault-Class Storage.</span>
          </h2>
          
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Experience next-generation storage. Upload directly and securely to AWS S3 using presigned URLs, collaborate on shared folders with emails, and track/restore file histories with timeline versioning.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="#preview" 
              className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all group"
            >
              Explore Interactive Sandbox
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#features" 
              className="flex items-center gap-2 text-xs font-bold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-5 py-3.5 rounded-xl transition-all"
            >
              Check Features
            </a>
          </div>

          {/* Quick Metrics display */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-900/60 max-w-lg">
            <div>
              <div className="text-2xl font-bold text-white">20 GB</div>
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Flat Quota / User</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Direct S3</div>
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Presigned Uploads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Active v2</div>
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Timeline History</div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          {/* Main Form container */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-2xl bg-zinc-950/70 border border-zinc-900/80 backdrop-blur-xl relative">
            
            {/* Header info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
              <p className="text-xs text-zinc-500 mt-1">{getSubtitle()}</p>
            </div>

            {/* Error & Success States */}
            {error && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide" htmlFor="name">Full Name</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              {mode !== 'forgot-otp' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide" htmlFor="email">Email Address</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide" htmlFor="password">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot-email'); setError(''); }}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 border-0 bg-transparent cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'forgot-otp' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide" htmlFor="otp">Verification OTP</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-zinc-500" />
                      </div>
                      <input
                        id="otp"
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="6-digit code"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide" htmlFor="new-password">New Password</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-zinc-500" />
                      </div>
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/40 pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-550 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 border-0 bg-transparent cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-650 hover:bg-indigo-550 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  mode === 'login' ? 'Sign In' :
                  mode === 'signup' ? 'Sign Up' :
                  mode === 'forgot-email' ? 'Send OTP Code' : 'Reset Password & Login'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' || mode === 'signup' ? (
                <button
                  onClick={() => { resetFields(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-350 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              ) : (
                <button
                  onClick={() => { resetFields(); setMode('login'); }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-350 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  Back to Sign In
                </button>
              )}
            </div>

            {/* Quick Demo Helper Tag */}
            <div className="mt-4 pt-4 border-t border-zinc-900/60 text-center">
              <span className="text-[10px] text-zinc-500">
                Tip: Try sandbox with <strong className="text-zinc-400">surajtakkallapelly@gmail.com / 123456</strong>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Section 2: Sandbox Interactive Workspace Mockup */}
      <section id="preview" className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10 border-t border-zinc-900/40">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-450 tracking-wider uppercase">
            🧪 Simulated Sandbox
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Interactive Workspace Preview</h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Test folder collaborative sharing, AWS S3 upload simulation, search features, and check version restore mechanics directly in this miniature web-client replica.
          </p>
        </div>

        {/* Mockup Window Container */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/40 shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Title Bar */}
          <div className="bg-zinc-950 px-4 py-3 flex items-center justify-between border-b border-zinc-900 select-none">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold bg-zinc-900/50 px-4 py-1 rounded-lg">
              <Globe className="h-3 w-3 text-zinc-550" />
              <span>cloudvault.suraj.app / guest-sandbox</span>
            </div>
            
            <div className="w-12"></div> {/* spacing hack */}
          </div>

          {/* Sandbox Body: Sidebar + Main Area */}
          <div className="flex flex-col md:flex-row h-[420px] select-none text-zinc-300 relative">
            
            {/* Sidebar (Desktop view) */}
            <aside className="hidden md:flex w-1/4 bg-zinc-950/20 border-r border-zinc-900/60 p-4 flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Navigation</span>
                  <RefreshCw className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" title="Reset Sandbox" onClick={() => {
                    setMockStorageUsed(6.4);
                    setMockActiveFolderId(null);
                    setMockTab('vault');
                    setMockSearch('');
                    setMockFolders([
                      { id: 1, name: 'Design Assets', shared: true, collaborators: ['sarah@company.com', 'alex@company.com'] },
                      { id: 2, name: 'Personal Receipts', shared: false, collaborators: [] },
                      { id: 3, name: 'Production Backups', shared: false, collaborators: [] }
                    ]);
                    setMockFiles([
                      { id: 101, name: 'Q3_Roadmap_Final.pdf', size: '2.4 MB', type: 'pdf', versions: 3, lastModified: '2 hrs ago', activeFolderId: 1 },
                      { id: 102, name: 'hero_landing_mockup.png', size: '4.8 MB', type: 'image', versions: 2, lastModified: 'Yesterday', activeFolderId: 1 },
                      { id: 103, name: 'onboarding_specs.docx', size: '780 KB', type: 'doc', versions: 1, lastModified: '3 days ago', activeFolderId: 2 },
                      { id: 104, name: 'financials_q2.xlsx', size: '1.6 MB', type: 'spreadsheet', versions: 4, lastModified: '1 week ago', activeFolderId: null }
                    ]);
                    showToast('Sandbox Reset Successfully');
                  }} />
                </div>
                
                <nav className="space-y-1.5 text-xs">
                  <button 
                    onClick={() => { setMockTab('vault'); setMockActiveFolderId(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold transition-all border-0 cursor-pointer ${mockTab === 'vault' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'}`}
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span>My Vault</span>
                  </button>

                  <button 
                    onClick={() => { setMockTab('shared'); setMockActiveFolderId(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold transition-all border-0 cursor-pointer ${mockTab === 'shared' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'}`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Shared With Me</span>
                  </button>

                  <button 
                    onClick={() => { setMockTab('versions'); setMockActiveFolderId(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-semibold transition-all border-0 cursor-pointer ${mockTab === 'versions' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'}`}
                  >
                    <History className="h-4 w-4" />
                    <span>Version History</span>
                  </button>
                </nav>
              </div>

              {/* Progress Storage details */}
              <div className="space-y-2 border-t border-zinc-900/60 pt-4">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-semibold">Global Limit</span>
                  </div>
                  <span className="font-bold">{mockStorageUsed} GB / 20 GB</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                    style={{ width: `${(mockStorageUsed / 20) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-zinc-550 font-medium">Flat quota applies dynamically to S3 bucket size.</p>
              </div>
            </aside>

            {/* Main content grid */}
            <main className="flex-1 flex flex-col min-w-0 bg-zinc-900/10">
              
              {/* Internal Actions: search and upload */}
              <div className="p-4 border-b border-zinc-900 flex items-center gap-3 justify-between bg-zinc-950/20">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={mockSearch}
                    onChange={(e) => setMockSearch(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder={`Search in ${mockTab}...`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {mockActiveFolderId !== null && (
                    <button 
                      onClick={() => setMockActiveFolderId(null)}
                      className="flex items-center gap-1.5 text-[10px] font-bold border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg text-zinc-300 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back</span>
                    </button>
                  )}

                  {mockTab === 'vault' && (
                    <button 
                      onClick={handleMockUpload}
                      disabled={mockUploading}
                      className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-all border-0"
                    >
                      {mockUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      ) : (
                        <Upload className="h-3 w-3 text-white" />
                      )}
                      <span>{mockUploading ? 'Uploading...' : 'S3 Upload'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mockup Workspace view */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                
                {/* Simulated Toast Overlay */}
                {mockToast && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-lg border border-indigo-400/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{mockToast}</span>
                  </div>
                )}

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Vault</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className={mockActiveFolderId ? 'text-zinc-400' : 'text-indigo-400'}>
                    {mockTab === 'vault' ? 'My Vault' : mockTab === 'shared' ? 'Shared with me' : 'Version History'}
                  </span>
                  {mockActiveFolderId && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-indigo-450">
                        {mockFolders.find(f => f.id === mockActiveFolderId)?.name}
                      </span>
                    </>
                  )}
                </div>

                {/* Grid items rendering */}
                <div className="space-y-4">
                  {/* Folders List Header */}
                  {filteredMockFolders.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">Folders</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {filteredMockFolders.map(folder => (
                          <div 
                            key={folder.id}
                            onDoubleClick={() => {
                              if (mockTab === 'vault') {
                                setMockActiveFolderId(folder.id);
                              }
                            }}
                            className="group relative flex items-center justify-between border border-zinc-800/80 bg-zinc-950/30 p-2.5 rounded-xl hover:border-zinc-700/80 hover:bg-zinc-950/60 transition-all cursor-pointer select-none"
                            title={mockTab === 'vault' ? "Double click to enter folder" : ""}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg">📁</span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-zinc-250 leading-tight">{folder.name}</p>
                                <span className="text-[8px] text-zinc-500 leading-none">
                                  {mockTab === 'shared' ? `Owner: ${folder.owner}` : `${folder.collaborators.length} collaborators`}
                                </span>
                              </div>
                            </div>

                            {/* Share button or Shared collaborators indicator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {folder.shared && (
                                <span className="text-[9px] bg-indigo-900/60 border border-indigo-700/40 text-indigo-300 px-1 rounded font-bold" title={folder.collaborators.join(', ')}>
                                  👥
                                </span>
                              )}
                              
                              {mockTab === 'vault' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMockFolderToShare(folder);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-indigo-400 rounded hover:bg-zinc-900 border-0 bg-transparent transition-all cursor-pointer"
                                  title="Share Folder"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files List Rendering */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">Files</span>
                    {filteredMockFiles.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/20">
                        <table className="min-w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-950/40 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Size</th>
                              <th className="px-4 py-2 text-center">Version</th>
                              <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {filteredMockFiles.map(file => (
                              <tr 
                                key={file.id} 
                                className="hover:bg-zinc-900/40 text-zinc-300 cursor-pointer group"
                                onClick={() => setSelectedMockFile(file)}
                                title="Click to view history timeline"
                              >
                                <td className="px-4 py-2.5 font-semibold text-zinc-200">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getFileIcon(file.type)}
                                    <span className="truncate max-w-[140px] sm:max-w-[200px]" title={file.name}>
                                      {file.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 font-medium">{file.size}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    v{file.versions}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      className="p-1 text-zinc-500 hover:text-indigo-400 rounded hover:bg-zinc-900/80 border-0 bg-transparent cursor-pointer transition-colors"
                                      title="Version history details"
                                      onClick={(e) => { e.stopPropagation(); setSelectedMockFile(file); }}
                                    >
                                      <History className="h-3.5 w-3.5" />
                                    </button>
                                    
                                    {mockTab === 'vault' && (
                                      <button 
                                        className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-900/80 border-0 bg-transparent cursor-pointer transition-colors"
                                        title="Trash File"
                                        onClick={(e) => { e.stopPropagation(); handleMockDeleteFile(file.id); }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-zinc-900/50 rounded-xl bg-zinc-950/15 text-center select-none">
                        <span className="text-lg mb-2">📁</span>
                        <p className="text-xs text-zinc-400 font-bold">No simulated files found</p>
                        <p className="text-[10px] text-zinc-550 mt-0.5">Click "S3 Upload" above to simulate adding files to this folder.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile View Bottom Mock Navigation (Visible < md) */}
              <div className="flex md:hidden border-t border-zinc-900 bg-zinc-950 py-2 justify-around text-zinc-500 text-[10px] select-none">
                <button 
                  onClick={() => { setMockTab('vault'); setMockActiveFolderId(null); }}
                  className={`flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer font-bold ${mockTab === 'vault' ? 'text-indigo-400' : 'text-zinc-500'}`}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>My Vault</span>
                </button>
                <button 
                  onClick={() => { setMockTab('shared'); setMockActiveFolderId(null); }}
                  className={`flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer font-bold ${mockTab === 'shared' ? 'text-indigo-400' : 'text-zinc-500'}`}
                >
                  <Globe className="h-4 w-4" />
                  <span>Shared</span>
                </button>
                <button 
                  onClick={() => { setMockTab('versions'); setMockActiveFolderId(null); }}
                  className={`flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer font-bold ${mockTab === 'versions' ? 'text-indigo-400' : 'text-zinc-500'}`}
                >
                  <History className="h-4 w-4" />
                  <span>Versions</span>
                </button>
              </div>
            </main>

            {/* Sandbox Modal: Share Dialog */}
            {selectedMockFolderToShare && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs z-50 animate-in fade-in duration-200">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Share Folder: {selectedMockFolderToShare.name}</span>
                    </h4>
                    <button 
                      onClick={() => setSelectedMockFolderToShare(null)}
                      className="text-zinc-500 hover:text-zinc-300 border-0 bg-transparent cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleMockShare} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">Collaborator Email</label>
                      <input
                        type="email"
                        required
                        value={mockCollaboratorEmail}
                        onChange={(e) => setMockCollaboratorEmail(e.target.value)}
                        className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-3 pr-3 py-2 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-indigo-500"
                        placeholder="collaborator@company.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">Permission level</label>
                      <select 
                        value={mockCollaboratorRole}
                        onChange={(e) => setMockCollaboratorRole(e.target.value)}
                        className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-3 pr-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Viewer">Viewer (Read-only)</option>
                        <option value="Editor">Editor (Read-Write)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-550 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border-0"
                    >
                      Invite Collaborator
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Sandbox Drawer: Version history detail */}
            {selectedMockFile && (
              <div className="absolute top-0 right-0 h-full w-64 bg-zinc-950 border-l border-zinc-900 p-4 shadow-2xl z-40 transform transition-all duration-300 ease-out flex flex-col justify-between animate-in slide-in-from-right-4">
                <div className="space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Versions History</span>
                    </h4>
                    <button 
                      onClick={() => setSelectedMockFile(null)}
                      className="text-zinc-500 hover:text-zinc-300 border-0 bg-transparent cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-zinc-550 font-bold uppercase block">Selected File</span>
                    <p className="text-xs font-bold text-zinc-200 truncate">{selectedMockFile.name}</p>
                    <span className="text-[9px] text-zinc-400 font-medium">{selectedMockFile.size}</span>
                  </div>

                  {/* Versions timeline */}
                  <div className="space-y-3 pt-3">
                    <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider block">Timeline History</span>
                    
                    <div className="space-y-3 pl-2 border-l border-zinc-900">
                      
                      {/* Active Version */}
                      <div className="relative pl-4 space-y-0.5">
                        <div className="absolute left-[-12.5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-900/30"></div>
                        <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1 rounded">
                          Version {selectedMockFile.versions} (Active)
                        </span>
                        <p className="text-[10px] text-zinc-400 font-semibold">{selectedMockFile.lastModified}</p>
                        <p className="text-[8px] text-zinc-500 font-medium">Uploaded by me</p>
                      </div>

                      {/* Older mock history versions */}
                      {selectedMockFile.versions > 1 && Array.from({ length: selectedMockFile.versions - 1 }).map((_, idx) => {
                        const versionNum = selectedMockFile.versions - 1 - idx;
                        return (
                          <div key={versionNum} className="relative pl-4 space-y-1.5">
                            <div className="absolute left-[-12.5px] top-1.5 h-2 w-2 rounded-full bg-zinc-800 ring-4 ring-zinc-950"></div>
                            <span className="text-[9px] text-zinc-400 font-semibold">
                              Version {versionNum}
                            </span>
                            <p className="text-[9px] text-zinc-500 font-medium">{idx + 1} day ago</p>
                            <button
                              onClick={() => handleMockRestoreVersion(versionNum)}
                              className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 border-0 bg-transparent cursor-pointer transition-colors block"
                            >
                              Restore version
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-900/80 pt-4 mt-4">
                  <p className="text-[8.5px] text-zinc-500 leading-relaxed font-semibold">
                    Note: Direct S3 uploads override file paths but preserve file history records automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Feature Details Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 border-t border-zinc-900/40">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
            🚀 CloudVault Power Pack
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Production-Grade Infrastructure</h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
            Engineered with a minimalist approach, avoiding bulk while providing maximum utility and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Folder sharing */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Collaborative Shared Folders</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Share full folders directly via collaborator email address. Add viewer or editor access permissions. Shares automatically populate under the "Shared with me" tab for team collaboration.
            </p>
          </div>

          {/* Feature 2: Quota Limits */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Global 20 GB Limit</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Enforced storage limits computed globally across all active files and historical S3 file versions. Rejects presigned URL generation and metadata uploads instantly when quota is exceeded.
            </p>
          </div>

          {/* Feature 3: Direct S3 uploading */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Direct-to-S3 Presigned URLs</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Upload binaries directly to secure AWS S3 buckets rather than routing through the Node application server. Low latency, optimal bandwidth consumption, and safe credentials preservation.
            </p>
          </div>

          {/* Feature 4: Timeline Versioning */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">File Version History Timeline</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Never overwrite a critical file by mistake. Every time a file with the same filename is uploaded, a new S3 version identifier is linked, enabling timeline analysis and instant rollbacks.
            </p>
          </div>

          {/* Feature 5: Bulk operations */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Batch & Bulk Operations</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Select multiple files at once. Perform bulk deletions or package selected items directly into a generated zip file for quick bulk download from S3.
            </p>
          </div>

          {/* Feature 6: Custom Security */}
          <div className="glass-card bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 group-hover:scale-105 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">OTP Verification Security</h4>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Secured session control with password reset protection via email-sent One Time Passwords (OTP) and JSON Web Tokens (JWT) handling authentication states.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: CSS Architecture Flow Diagram */}
      <section id="architecture" className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10 border-t border-zinc-900/40">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 tracking-wider uppercase">
            ⚙️ Technical Specs
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Data Pipeline Architecture</h3>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
            CloudVault uses a split-responsibility pattern. Binary files are handled by AWS S3, while file metadata and permissions are handled by MongoDB.
          </p>
        </div>

        {/* Diagram grid container */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative">
            
            {/* Element 1: React Dashboard Client */}
            <div className="flex-1 w-full flex flex-col items-center p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-indigo-500/20 transition-all select-none text-center">
              <div className="h-11 w-11 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
                <Laptop className="h-6 w-6" />
              </div>
              <h5 className="text-xs font-bold text-zinc-200">React Client App</h5>
              <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-1 block">Vite & Tailwind</span>
              <p className="text-[10px] text-zinc-400 mt-2 max-w-xs leading-normal">
                1. Requests pre-signed upload URL. <br />
                2. Uploads file directly to S3. <br />
                3. Saves upload metadata to backend.
              </p>
            </div>

            {/* Connection Arrow 1 */}
            <div className="hidden lg:flex flex-col items-center text-zinc-600">
              <ChevronRight className="h-6 w-6 animate-pulse text-indigo-500" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-550 mt-1">Presigned URL</span>
            </div>

            {/* Element 2: Node express server */}
            <div className="flex-1 w-full flex flex-col items-center p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-indigo-500/20 transition-all select-none text-center">
              <div className="h-11 w-11 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
                <Server className="h-6 w-6" />
              </div>
              <h5 className="text-xs font-bold text-zinc-200">Express API Gateway</h5>
              <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-1 block">NodeJS Server</span>
              <p className="text-[10px] text-zinc-400 mt-2 max-w-xs leading-normal">
                - Validates account 20 GB quota. <br />
                - Generates secure S3 presigned URLs. <br />
                - Coordinates collaborator access logs.
              </p>
            </div>

            {/* Connection Arrow 2 */}
            <div className="hidden lg:flex flex-col items-center text-zinc-600">
              <ChevronRight className="h-6 w-6 animate-pulse text-indigo-500" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-550 mt-1">Direct Binary</span>
            </div>

            {/* Double output branches: S3 bucket and MongoDB */}
            <div className="flex-1 w-full flex flex-col gap-4">
              {/* S3 Storage */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/20 transition-all select-none">
                <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Cloud className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-zinc-200">AWS S3 Bucket</h5>
                  <span className="text-[8px] text-zinc-550 font-semibold uppercase tracking-wider leading-none block mt-0.5 font-mono">Bucket Storage</span>
                  <p className="text-[9.5px] text-zinc-400 mt-1 leading-tight">Stores actual binary objects with version history identifiers.</p>
                </div>
              </div>

              {/* MongoDB Metadata */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/20 transition-all select-none">
                <div className="h-8.5 w-8.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Database className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-zinc-200">MongoDB Atlas</h5>
                  <span className="text-[8px] text-zinc-550 font-semibold uppercase tracking-wider leading-none block mt-0.5 font-mono">Metadata DB</span>
                  <p className="text-[9.5px] text-zinc-400 mt-1 leading-tight">Stores directories schema, shares matrix, and file descriptors.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950 py-10 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold text-white tracking-wide">CloudVault Project</span>
          </div>

          <p className="text-[10px] text-zinc-550 font-semibold">
            &copy; 2026 CloudVault. Built with React, Node.js, AWS S3, and MongoDB Atlas.
          </p>

          <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-4">
            <span>Quota Check: Enabled (20 GB)</span>
            <span>Version History: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
