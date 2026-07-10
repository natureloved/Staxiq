import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import { NetworkProvider } from './context/NetworkContext';
import { useWallet } from './hooks/useWallet';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import Hero from './components/Hero';
import Footer from './components/Footer';

// Route-level code splitting — each page loads on demand instead of shipping
// one monolithic bundle on first visit.
const Overview = lazy(() => import('./pages/Dashboard'));
const YieldCalculator = lazy(() => import('./pages/YieldCalculator'));
const StackingTracker = lazy(() => import('./pages/StackingTracker'));
const HealthScore = lazy(() => import('./pages/HealthScore'));
const CompareProtocols = lazy(() => import('./pages/CompareProtocols'));
const Achievements = lazy(() => import('./pages/Achievements'));
const AICopilotPage = lazy(() => import('./pages/AICopilotPage'));
const ResearchMode = lazy(() => import('./pages/ResearchMode'));
const ProtocolDetail = lazy(() => import('./pages/ProtocolDetail'));

function RouteFallback() {
  return (
    <div className="max-w-5xl mx-auto py-16 text-center">
      <div className="animate-pulse text-sm opacity-60">Loading…</div>
    </div>
  );
}


function AppContent() {
  const { isDark } = useTheme();
  const { connected, address, connectWallet, disconnectWallet, loading } = useWallet();

  const { isDemoMode } = useDemo();

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 relative"
      style={{
        backgroundColor: isDark ? '#0a0e1a' : '#f8faff',
        color: isDark ? '#f0f4ff' : '#0a0e1a',
      }}
    >
      <Navbar
        connected={connected}
        address={address}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        loading={loading}
      />

      {(!connected && !isDemoMode) && <Hero />}

      <DashboardLayout connected={connected} isDemoMode={isDemoMode}>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={
            <Overview connected={connected} address={address} />
          } />
          <Route path="/yield" element={
            <YieldCalculator connected={connected} />
          } />
          <Route path="/stacking" element={
            <StackingTracker connected={connected} address={address} />
          } />
          <Route path="/health" element={
            <HealthScore connected={connected} address={address} />
          } />
          <Route path="/compare" element={
            <CompareProtocols />
          } />
          <Route path="/achievements" element={
            <Achievements connected={connected} address={address} />
          } />
          <Route path="/copilot" element={
            <AICopilotPage
              connected={connected}
              address={address}
            />
          } />
          <Route path="/research" element={
            <ResearchMode connected={connected} address={address} />
          } />
          <Route path="/protocols/:slug" element={<ProtocolDetail />} />

        </Routes>
        </Suspense>
      </DashboardLayout>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <NetworkProvider>
            <DemoProvider>
              <Onboarding onComplete={() => { }} />
              <AppContent />
            </DemoProvider>
          </NetworkProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
