'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount, useConnect, useDisconnect } from "thirdweb/react";

interface FaucetIntegrationProps {
  className?: string;
}

const FaucetIntegration: React.FC<FaucetIntegrationProps> = ({ className = '' }) => {
  const account = useActiveAccount();
  const connectedAddress = account?.address;
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (connectedAddress) {
      setWalletAddress(connectedAddress);
    } else {
      setWalletAddress('');
    }
  }, [connectedAddress]);

  const handleGoogleFaucet = () => {
    if (!walletAddress.trim()) {
      alert("Please provide a wallet address.");
      return;
    }
    navigator.clipboard.writeText(walletAddress);
    alert("Your wallet address has been copied to the clipboard. You will be redirected to the Google Faucet. Please paste your address there.");
    window.open('https://cloud.google.com/application/web3/faucet/ethereum/sepolia', '_blank', 'noopener,noreferrer');
  };

  const handlePowFaucet = () => {
    if (!walletAddress.trim()) {
      alert("Please provide a wallet address.");
      return;
    }
    navigator.clipboard.writeText(walletAddress);
    alert("Your wallet address has been copied and will be auto-filled for the PoW Faucet.");
    window.open(`https://sepolia-faucet.pk910.de/?address=${walletAddress}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-[#1c1c24] p-8 rounded-2xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 ${className}`}>
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🚰</div>
        <h3 className="text-2xl font-semibold text-white mb-2">Get Sepolia Testnet ETH</h3>
        <p className="text-[#808191] text-lg">
          You need Sepolia ETH to create claims and vote on TrustNet.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <label htmlFor="wallet-address-input" className="block text-sm font-medium text-white">Your Wallet Address</label>
        <div className="flex gap-2">
          <input
            id="wallet-address-input"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x... or connect your wallet"
            className="w-full bg-[#2c2c34] border border-[#3c3c44] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#c6ff20] disabled:opacity-70"
            disabled={!!connectedAddress}
          />
          {!connectedAddress ? (
            <button
              onClick={() => connect()}
              disabled={isConnecting}
              className="px-4 py-2 bg-[#c6ff20] text-black font-semibold rounded-lg hover:bg-[#a8e01d] transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-300 whitespace-nowrap"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Faucet */}
        <div className="bg-[#2c2c34] p-6 rounded-xl border border-[#3c3c44] text-center">
          <div className="text-3xl mb-3">🔍</div>
          <h4 className="text-xl font-semibold text-white mb-2">Google Faucet</h4>
          <p className="text-[#808191] mb-4 text-sm">
            Receive 0.05 Sepolia ETH. Your address will be copied to clipboard.
          </p>
          <button
            onClick={handleGoogleFaucet}
            className="w-full bg-[#c6ff20] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#a8e01d] transition-all duration-300"
          >
            Use Google Faucet
          </button>
        </div>
        
        {/* PoW Faucet */}
        <div className="bg-[#2c2c34] p-6 rounded-xl border border-[#3c3c44] text-center">
          <div className="text-3xl mb-3">⛏️</div>
          <h4 className="text-xl font-semibold text-white mb-2">PoW Mining Faucet</h4>
          <p className="text-[#808191] mb-4 text-sm">
            Mine for more ETH. Your address will be copied & auto-filled.
          </p>
          <button
            onClick={handlePowFaucet}
            className="w-full bg-[#c6ff20] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#a8e01d] transition-all duration-300"
          >
            Use PoW Faucet
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaucetIntegration; 