// src/data/demoData.js
// Realistic mock data for demo mode — shown when wallet not connected

export const DEMO_WALLET = {
    address: 'SP2X4Y8DEMO3K4J9STAXIQ0BTC1DEFI2K3FQ',
    stxBalance: '2450.0000',
    sbtcBalance: '0.04820000',
    totalUSD: '12847.50',
    txCount: 47,
};

export const DEMO_STACKING = {
    stackedSTX: 2000,
    totalSTXEarned: 187.4,
    totalBTCEarned: 0.00241,
    cyclesCompleted: 14,
    currentCycle: 15,
    cycleProgress: 68,
    nextPayoutDays: 6,
    nextPayoutSTX: 18.2,
    nextPayoutDate: 'Mar 14, 2026',
    earnings: [
        { cycle: 14, stxEarned: 18.7, btcValue: 0.000198, date: 'Feb 25, 2026', status: 'Paid' },
        { cycle: 13, stxEarned: 17.9, btcValue: 0.000187, date: 'Feb 04, 2026', status: 'Paid' },
        { cycle: 12, stxEarned: 19.2, btcValue: 0.000201, date: 'Jan 14, 2026', status: 'Paid' },
        { cycle: 11, stxEarned: 16.8, btcValue: 0.000175, date: 'Dec 24, 2025', status: 'Paid' },
        { cycle: 10, stxEarned: 18.1, btcValue: 0.000190, date: 'Dec 03, 2025', status: 'Paid' },
    ],
};

export const DEMO_HEALTH = {
    score: 74,
    label: 'Good',
    issues: [
        { text: 'No sBTC deployed in lending protocols', impact: -12, fix: 'Deposit sBTC into Zest Protocol to earn 8.2% APY' },
        { text: 'All STX in a single protocol', impact: -8, fix: 'Diversify across StackingDAO + ALEX for better risk balance' },
        { text: '18% of portfolio sitting idle', impact: -6, fix: 'Deploy idle STX to earn stacking rewards' },
    ],
    wins: [
        'Holding sBTC — earning passive Bitcoin exposure ✓',
        'Active transaction history shows engagement ✓',
        'Portfolio value above $10K threshold ✓',
        'Wallet has been active for multiple stacking cycles ✓',
    ],
};

export const DEMO_STRATEGY = `🎯 RECOMMENDED STRATEGY
Split your portfolio across StackingDAO and Zest Protocol for a strong risk-adjusted Bitcoin DeFi position.

📊 ALLOCATION
StackingDAO: 60% → 9.5% APY → Est. $732/yr on your STX position
Zest Protocol: 40% → 8.2% APY → Est. $421/yr on your sBTC position
BLENDED APY: ~9.0% → ~$1,153/yr on $12,847 portfolio

🔁 OPTIMIZATION PLAY
Auto-compound your StackingDAO rewards every 2 cycles (~4 weeks). Reinvesting 18 STX per cycle at current prices adds ~$340 in compounded gains annually on top of base yield.

⚠️ RISKS TO MONITOR
- sBTC peg stability — monitor sBTC/BTC ratio weekly, currently at 1.0001
- Smart contract risk on Zest — audited but relatively new, keep individual position under 30% of net worth

🚀 EXECUTE NOW
Step 1: Go to stackingdao.com and connect this Xverse wallet
Step 2: Click "Stack STX" → enter 1,470 STX (60% of balance) → confirm
Step 3: Go to zestprotocol.com → click "Supply" → deposit 0.029 sBTC → confirm`;

export const IS_DEMO_ADDRESS = (address) =>
    address === DEMO_WALLET.address;
