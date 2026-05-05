'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { TrustNetsFactory } from "../constants/contracts";

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const SearchBar = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Claim[]>([]);
  const [similarClaims, setSimilarClaims] = useState<Claim[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  // Fetch all claims
  const { data: claims } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim() || !claims) {
      setSearchResults([]);
      setSimilarClaims([]);
      return;
    }

    // Check if input is a URL
    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(searchQuery);

    if (isUrl) {
      // Search for claims with similar URLs in title or description
      const urlResults = claims.filter(claim => 
        claim.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(urlResults);

      // Find similar claims based on domain
      const domain = new URL(searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`).hostname;
      const similar = claims.filter(claim => 
        claim.title.toLowerCase().includes(domain)
      );
      setSimilarClaims(similar);
    } else {
      // Regular title search
      const results = claims.filter(claim => 
        claim.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setSimilarClaims([]);
    }
  }, [searchQuery, claims]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleCreateClaim = () => {
    router.push(`/create-claim?url=${encodeURIComponent(searchQuery)}`);
    setIsDropdownOpen(false);
  };

  const handleClaimClick = (claimAddress: string) => {
    router.push(`/claim/${claimAddress}`);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          placeholder="Search by title or paste URL..."
          className="w-full px-4 py-2 pl-10 pr-12 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/60 
                   focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10
                   transition-all duration-200 shadow-lg border border-white/10"
        />
        <svg 
          className="absolute left-3 top-2.5 h-5 w-5 text-white/60" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
        <button 
          type="submit"
          className="absolute right-2 top-1.5 bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-3 py-1 rounded-lg text-sm hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-medium"
        >
          Search
        </button>
      </form>

      {/* Dropdown Results */}
      {isDropdownOpen && (searchResults.length > 0 || similarClaims.length > 0 || searchQuery.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c24] rounded-xl border border-white/10 shadow-lg overflow-hidden z-50">
          {/* Direct Results */}
          {searchResults.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-2">Exact Matches</h3>
              {searchResults.map((claim) => (
                <button
                  key={claim.claimAddress}
                  onClick={() => handleClaimClick(claim.claimAddress)}
                  className="w-full text-left p-2 hover:bg-white/5 rounded-lg transition-colors duration-200"
                >
                  <div className="text-white font-medium">{claim.title}</div>
                  <div className="text-sm text-white/60">{claim.category}</div>
                </button>
              ))}
            </div>
          )}

          {/* Similar Claims */}
          {similarClaims.length > 0 && (
            <div className="p-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white/60 mb-2">Similar Claims</h3>
              {similarClaims.map((claim) => (
                <button
                  key={claim.claimAddress}
                  onClick={() => handleClaimClick(claim.claimAddress)}
                  className="w-full text-left p-2 hover:bg-white/5 rounded-lg transition-colors duration-200"
                >
                  <div className="text-white font-medium">{claim.title}</div>
                  <div className="text-sm text-white/60">{claim.category}</div>
                </button>
              ))}
            </div>
          )}

          {/* Create New Claim Option */}
          {searchQuery.trim() && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleCreateClaim}
                className="w-full bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-4 py-2 rounded-lg text-sm font-medium hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300"
              >
                Create New Claim
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 