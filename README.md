# Staxiq - Bitcoin DeFi Intelligence on Stacks

**Staxiq** is a professional-grade Bitcoin DeFi dashboard and AI Copilot built natively on the Stacks L2 blockchain. It provides real-time insights, yield optimization, and portfolio management for Bitcoin-integrated DeFi protocols.

![Staxiq Dashboard](https://raw.githubusercontent.com/natureloved/Staxiq/main/public/banner.png) *(Placeholder banner)*

## 🚀 Features

- **Portolio Overview**: Real-time tracking of STX and sBTC balances.
- **Yield Calculator**: Simulate compound returns across top Stacks DeFi protocols (Alex, Zest, Hermetica, etc.).
- **Stacking Tracker**: Manage your STX stacking positions and rewards.
- **Wallet Health Score**: Proprietary algorithm to analyze portfolio diversification and risk.
- **AI DeFi Copilot**: Personalized strategy recommendations based on on-chain activity.
- **Protocol Comparison**: Deep-dive analytics into APY, TVL, and risk profiles.

## 🛠️ Tech Stack

- **Frontend**: Vite + React + Tailwind CSS
- **Blockchain Interface**: @stacks/connect, @stacks/transactions
- **Data Visualization**: Recharts
- **Backend API**: Express (Proxying blockchain data)

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/) Wallet extension

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/natureloved/Staxiq.git
   cd Staxiq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3005](http://localhost:3005) in your browser.

## 🌐 Roadmap

- [x] Testnet v1 Integration
- [x] AI Strategy Log
- [ ] Mainnet Alpha Launch
- [ ] sBTC Bridge Integration
- [ ] Multi-wallet Support

## 🛡️ Security

Staxiq is non-custodial. We never ask for your private keys. All transactions are signed locally via your wallet provider.

## 📄 License

MIT © 2026 Staxiq
