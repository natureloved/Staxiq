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

const CONTRACT_ADDRESS = 'ST9ZZEP9M6VZ9YJA0P69H313CRPV0HQ1ZNPVS8NZ';
const CONTRACT_NAME = 'staxiq-user-profile';

function getNetwork() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? STACKS_TESTNET
        : STACKS_MAINNET;
}

// ✅ Save risk profile on-chain
export async function saveRiskProfile(riskLevel) {
    try {
        const riskMap = { Conservative: 1, Balanced: 2, Aggressive: 3 };
        const level = riskMap[riskLevel] || 2;
        const network = getNetwork();

        const txOptions = {
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'set-risk-profile',
            functionArgs: [uintCV(level)],
            network,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
        };

        const transaction = await makeContractCall(txOptions);
        const result = await broadcastTransaction({ transaction, network });
        console.log('✅ Risk profile saved:', result.txid);
        return result.txid;
    } catch (err) {
        console.warn('Risk profile save failed:', err);
        return null;
    }
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

// ✅ Anchor strategy on-chain
export async function anchorStrategy(strategyHash, protocol) {
    try {
        const network = getNetwork();

        const txOptions = {
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'save-strategy',
            functionArgs: [
                stringAsciiCV(strategyHash.slice(0, 64)),
                stringAsciiCV(protocol.slice(0, 32)),
            ],
            network,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
        };

        const transaction = await makeContractCall(txOptions);
        const result = await broadcastTransaction({ transaction, network });
        console.log('✅ Strategy anchored:', result.txid);
        return result.txid;
    } catch (err) {
        console.warn('Strategy anchoring failed:', err);
        return null;
    }
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
