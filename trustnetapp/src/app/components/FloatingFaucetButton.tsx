'use client';

import React, { useState } from 'react';
import FaucetWidget from './FaucetWidget';

const FloatingFaucetButton: React.FC = () => {
  const [showFaucet, setShowFaucet] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setShowFaucet(!showFaucet)}
          className="bg-[#c6ff20] text-black w-16 h-16 rounded-full shadow-lg hover:bg-[#a8e01d] transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          title="Get Sepolia ETH"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a1 1 0 000 2c.552 0 1 .448 1 1v1H4a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V8a1 1 0 00-1-1h-2V6c0-.552.448-1 1-1a1 1 0 000-2H5z" />
          </svg>
        </button>
      </div>

      {/* Faucet Modal */}
      {showFaucet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#1c1c24] rounded-2xl border border-[#2c2c34] max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Get Sepolia ETH</h2>
                <button
                  onClick={() => setShowFaucet(false)}
                  className="text-[#808191] hover:text-white transition-colors duration-300"
                >
                  ✕
                </button>
              </div>
              <FaucetWidget />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingFaucetButton; 