import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { useWallet } from './hooks/useWallet';

function AppContent() {
  const { connected, address, connectWallet, disconnectWallet } = useWallet();
  return (
    // ✅ These classes handle full page theme switching
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0e1a] text-gray-900 dark:text-[#f0f4ff] transition-colors duration-300">
      <Navbar
        connected={connected}
        address={address}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />
      <main className="flex-grow">
        {!connected && <Hero />}
        <div className="pt-6 pb-12">
          <Dashboard connected={connected} address={address} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Onboarding onComplete={() => { }} />
      <AppContent />
    </ThemeProvider>
  );
}
