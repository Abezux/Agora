import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LandingView from '@/views/LandingView';
import AuthView from '@/views/AuthView';
import OnboardingView from '@/views/OnboardingView';
import Navbar, { Sidebar } from '@/components/navigation/Navbar';
import SellPage from '@/views/SellView';
import InventoryPage from '@/views/InventoryView';
import SalesHistoryPage from '@/views/SalesView';
import AuditPage from '@/views/AuditView';
import AnalyticsPage from '@/views/AnalyticsView';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, store, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('sell');
  const [authViewMode, setAuthViewMode] = useState<'LOGIN' | 'SIGNUP' | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.replace('#', '');
      const baseTab = rawHash.split('?')[0];

      if (baseTab === 'auth' || baseTab === 'login') {
        setAuthViewMode('LOGIN');
      } else if (baseTab === 'signup') {
        setAuthViewMode('SIGNUP');
      } else if (
        ['sell', 'inventory', 'sales', 'audit', 'analytics', 'landing'].includes(baseTab)
      ) {
        setActiveTab(baseTab);
        if (baseTab !== 'landing') setAuthViewMode(null);
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-agora-bg text-agora-ink flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-agora-terracotta animate-spin" />
          <span className="text-sm font-semibold text-agora-ink-muted">Loading Agora...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authViewMode) {
      return (
        <AuthView
          initialMode={authViewMode}
          onBackToLanding={() => {
            setAuthViewMode(null);
            window.location.hash = '';
          }}
        />
      );
    }
    return (
      <LandingView
        onOpenAuth={(mode = 'LOGIN') => {
          setAuthViewMode(mode);
          window.location.hash = mode.toLowerCase();
        }}
      />
    );
  }

  if (!store) {
    return <OnboardingView />;
  }

  return (
    <div className="bg-agora-bg text-agora-ink h-screen flex flex-col overflow-hidden">
      <Navbar activeTab={activeTab} onNavigate={navigateTo} />
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        <Sidebar activeTab={activeTab} onNavigate={navigateTo} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 overflow-y-auto pb-20 lg:pb-6 h-full">
          {activeTab === 'landing' && <LandingView onOpenAuth={() => navigateTo('sell')} />}
          {activeTab === 'sell' && <SellPage />}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'sales' && <SalesHistoryPage />}
          {activeTab === 'audit' && <AuditPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
