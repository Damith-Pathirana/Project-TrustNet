'use client';

import React, { useState } from 'react';
import { useActiveAccount } from "thirdweb/react";

interface FaucetWidgetProps {
  className?: string;
  compact?: boolean;
}

const FaucetWidget: React.FC<FaucetWidgetProps> = ({ className = '', compact = false }) => {
  const account = useActiveAccount();
  const address = account?.address;
  const [showDetails, setShowDetails] = useState(false);

  const openGoogleFaucet = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert("Your wallet address has been copied to the clipboard. You will be redirected to the Google Faucet. Please paste your address there.");
    }
    window.open('https://cloud.google.com/application/web3/faucet/ethereum/sepolia', '_blank', 'noopener,noreferrer');
  };

  const openPowFaucet = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert("Your wallet address has been copied and will be auto-filled for the PoW Faucet.");
    }
    const powUrl = address 
      ? `https://sepolia-faucet.pk910.de/?address=${address}`
      : 'https://sepolia-faucet.pk910.de/';
    window.open(powUrl, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <div className={`bg-[#1c1c24] p-4 rounded-xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">🚰 Get Sepolia ETH</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[#c6ff20] hover:text-[#a8e01d] transition-colors duration-300"
          >
            {showDetails ? '−' : '+'}
          </button>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={openGoogleFaucet}
            className="w-full bg-[#c6ff20] text-black font-semibold px-3 py-2 rounded-lg hover:bg-[#a8e01d] transition-all duration-300 text-sm"
          >
            Google Faucet
          </button>
          
          <button
            onClick={openPowFaucet}
            className="w-full bg-[#c6ff20] text-black font-semibold px-3 py-2 rounded-lg hover:bg-[#a8e01d] transition-all duration-300 text-sm"
          >
            PoW Mining Faucet
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-[#3c3c44]">
            <p className="text-xs text-[#808191]">
              Use these faucets to get testnet ETH for creating claims and voting.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Redesigned non-compact version for the floating button modal
  return (
    <div className={`bg-transparent rounded-xl ${className}`}>
        <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-white">Get Sepolia Testnet ETH</h3>
            <p className="text-[#808191] text-sm mt-2">
            {address ? `Sending to: ${address.slice(0,6)}...${address.slice(-4)}` : "Connect your wallet for a better experience."}
            </p>
        </div>

        <div className="space-y-4">
          {/* Google Faucet Card */}
          <div className="bg-[#2c2c34] p-5 rounded-lg border border-transparent hover:border-[#c6ff20] transition-colors duration-300">
            <div className="flex items-start gap-4">
              <div className="text-3xl mt-1">🔍</div>
              <div>
                <h4 className="font-semibold text-white">Google Faucet</h4>
                <p className="text-sm text-[#808191] mt-1 mb-3">Get 0.05 ETH daily. Your address will be copied to your clipboard.</p>
                <button
                  onClick={openGoogleFaucet}
                  className="bg-[#c6ff20] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#a8e01d] transition-all"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>

          {/* PoW Faucet Card */}
          <div className="bg-[#2c2c34] p-5 rounded-lg border border-transparent hover:border-[#c6ff20] transition-colors duration-300">
            <div className="flex items-start gap-4">
              <div className="text-3xl mt-1">⛏️</div>
              <div>
                <h4 className="font-semibold text-white">PoW Faucet</h4>
                <p className="text-sm text-[#808191] mt-1 mb-3">Mine for more ETH. Your address is copied & auto-filled.</p>
                <button
                  onClick={openPowFaucet}
                  className="bg-[#c6ff20] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#a8e01d] transition-all"
                >
                  Start Mining
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default FaucetWidget; 