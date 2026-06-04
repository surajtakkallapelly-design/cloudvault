import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SharedPreviewPage from './pages/SharedPreviewPage';
import CookieConsent from './components/CookieConsent';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // Handle anonymous/public shared file preview path routing
  const path = window.location.pathname;
  if (path.startsWith('/shared-preview/')) {
    const fileId = path.substring('/shared-preview/'.length);
    return <SharedPreviewPage fileId={fileId} />;
  }

  return (
    <>
      {user ? <Dashboard /> : <AuthPage />}
      {/* Cookie consent banner — shown on every page until user makes a choice */}
      <CookieConsent />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
