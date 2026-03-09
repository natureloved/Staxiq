import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import { NetworkProvider } from './context/NetworkContext';
import { useWallet } from './hooks/useWallet';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import Hero from './components/Hero';
import Footer from './components/Footer';

import Overview from './pages/Dashboard';
import YieldCalculator from './pages/YieldCalculator';
import StackingTracker from './pages/StackingTracker';
import HealthScore from './pages/HealthScore';
import CompareProtocols from './pages/CompareProtocols';
import Achievements from './pages/Achievements';


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

        </Routes>
      </DashboardLayout>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
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
  );
}
