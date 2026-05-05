"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";

const getPoints = (claimsCreated: number) => claimsCreated * 10;

const HomeSidebar = () => {
  const router = useRouter();

  // Fetch all claims
  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });
  const { data: allClaims } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  // Calculate top contributors dynamically
  let topContributors: { address: string; points: number }[] = [];
  if (allClaims) {
    const userPoints: { [address: string]: number } = {};
    allClaims.forEach((claim: any) => {
      userPoints[claim.owner] = (userPoints[claim.owner] || 0) + 1;
    });
    topContributors = Object.entries(userPoints)
      .map(([address, claimsCreated]) => ({ address, points: getPoints(claimsCreated) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="fixed bottom-8 right-8 w-64">
      {/* Top Contributors Card */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Top Contributors</h3>
          <button 
            onClick={() => router.push('/leaderboard')}
            className="text-[#c6ff20] text-sm hover:underline"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {topContributors.map((contributor, index) => (
            <div key={contributor.address} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#c6ff20] flex items-center justify-center text-black font-bold">{index + 1}</div>
              <p className="text-white text-sm">{formatAddress(contributor.address)}</p>
              <p className="text-[#c6ff20] text-sm ml-auto">{contributor.points} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSidebar; 