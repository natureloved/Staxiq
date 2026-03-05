import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import { useWallet } from './hooks/useWallet';

function App() {
  const { connected, address, connectWallet, disconnectWallet } = useWallet();

  return (
    <div className="App">
      <Navbar
        connected={connected}
        address={address}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />
      <Dashboard connected={connected} address={address} />
    </div>
  );
}

export default App;
