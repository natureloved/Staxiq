// contractService.js - correct imports for latest @stacks/transactions
import {
    makeContractCall,
    stringAsciiCV,
    uintCV,
    AnchorMode,
    PostConditionMode,
    broadcastTransaction,
} from '@stacks/transactions';

import {
    fetchCallReadOnlyFunction,
    cvToJSON,
} from '@stacks/blockchain-api-client';

import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { showConnect } from '@stacks/connect';

const CONTRACT_ADDRESS = 'ST9ZZEP9M6VZ9YJA0P69H313CRPV0HQ1ZNPVS8NZ';
const CONTRACT_NAME = 'staxiq-user-profile';

function getNetwork() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? STACKS_TESTNET
        : STACKS_MAINNET;
}

// ✅ Save risk profile on-chain (Wallet Popup)
export async function saveRiskProfile(riskLevel) {
    return new Promise((resolve) => {
        const riskMap = { HODLer: 1, Builder: 2, Degen: 3 };
        const level = riskMap[riskLevel] || 2;

        showConnect({
            appDetails: { name: 'Staxiq', icon: window.location.origin + '/logo.png' },
            redirectTo: '/',
            onFinish: (data) => resolve(data.txId),
            onCancel: () => resolve(null),
            finished: (data) => resolve(data.txId),
            userSession: null, // Connect will handle if null
            sendToEmptyAddress: false,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'set-risk-profile',
            functionArgs: [uintCV(level)],
            network: getNetwork(),
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
        });
    });
}

// ✅ Read user profile from chain
export async function getUserProfile(address) {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-user-profile',
            functionArgs: [],
            senderAddress: address,
            network: getNetwork(),
        });
        return cvToJSON(result);
    } catch (err) {
        console.warn('Get profile failed:', err);
        return null;
    }
}

// ✅ Check if user has existing profile
export async function checkHasProfile(address) {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'has-profile',
            functionArgs: [],
            senderAddress: address,
            network: getNetwork(),
        });
        return cvToJSON(result).value;
    } catch (err) {
        return false;
    }
}

// ✅ Anchor strategy on-chain (Wallet Popup)
export async function anchorStrategy(strategyHash, protocol) {
    return new Promise((resolve) => {
        showConnect({
            appDetails: { name: 'Staxiq', icon: window.location.origin + '/logo.png' },
            onFinish: (data) => resolve(data.txId),
            onCancel: () => resolve(null),
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'save-strategy',
            functionArgs: [
                stringAsciiCV(strategyHash.slice(0, 64)),
                stringAsciiCV(protocol.slice(0, 32)),
            ],
            network: getNetwork(),
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
        });
    });
}

// ✅ Get strategy count
export async function getStrategyCount(address) {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-strategy-count',
            functionArgs: [],
            senderAddress: address,
            network: getNetwork(),
        });
        return cvToJSON(result).value || 0;
    } catch (err) {
        return 0;
    }
}
