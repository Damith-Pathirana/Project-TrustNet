// pages/profile.tsx
import React, { useEffect, useState } from 'react';
import { useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

interface ClaimInstance {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

interface Vote {
  voter: string;
  voteType: string;
  voteTime: bigint;
}

const ProfilePage = () => {
  const account = useActiveAccount();
  const walletAddress = account?.address || '';
  const [votedClaims, setVotedClaims] = useState<ClaimInstance[]>([]);
  const [isCheckingVotes, setIsCheckingVotes] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });

  const factoryContract = getContract({
    client: client,
    chain: sepolia,
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
  });

  const { data: userClaims, isPending: isUserClaimsPending } = useReadContract({
    contract: factoryContract,
    method: "function getUserClaims(address) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [walletAddress],
  });

  const { data: allClaims, isPending: isAllClaimsPending } = useReadContract({
    contract: factoryContract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  useEffect(() => {
    const checkVotedClaims = async () => {
      if (!allClaims || !account?.address) return;
      
      setIsCheckingVotes(true);
      const voted: ClaimInstance[] = [];
      const claims = allClaims as ClaimInstance[];
      
      setCheckProgress({ current: 0, total: claims.length });
      
      try {
        for (let i = 0; i < claims.length; i++) {
          const claim = claims[i];
          setCheckProgress(prev => ({ ...prev, current: i + 1 }));
          
          const claimContract = getContract({
            client: client,
            chain: sepolia,
            address: claim.claimAddress,
          });

          try {
            // Use the same method as in claim details page
            const { data: hasVoted } = await useReadContract({
              contract: claimContract,
              method: "function hasVoted(uint256, address) view returns (bool)",
              params: [0n, account.address],
            });

            console.log(`Checking claim ${i + 1}/${claims.length}:`, {
              claimAddress: claim.claimAddress,
              hasVoted
            });
            
            if (hasVoted) {
              voted.push(claim);
            }
          } catch (error) {
            console.error(`Error checking claim ${claim.claimAddress}:`, error);
          }
        }
      } catch (error) {
        console.error('Error checking voted claims:', error);
      } finally {
        console.log('Final voted claims:', voted);
        setVotedClaims(voted);
        setIsCheckingVotes(false);
        setCheckProgress({ current: 0, total: 0 });
      }
    };

    if (allClaims && account?.address) {
      checkVotedClaims();
    }
  }, [allClaims, account?.address]);

  if (isUserClaimsPending || isAllClaimsPending) {
    return <div>Loading claims...</div>;
  }

  if (!walletAddress) {
    return <div className="container mx-auto p-4">Please connect your wallet to view your profile.</div>;
  }

  const getLevelName = (claims: ClaimInstance[], votes: ClaimInstance[]) => {
    const totalContributions = claims.length + votes.length;
    const levels = ["Novice", "Apprentice", "Expert", "Master", "Grandmaster"] as const;

    if (totalContributions < 5) return levels[0];
    if (totalContributions < 20) return levels[1];
    if (totalContributions < 50) return levels[2];
    if (totalContributions < 100) return levels[3];
    return levels[4];
  };

  const getBadges = (claims: ClaimInstance[], votes: ClaimInstance[]) => {
    const badges: string[] = [];

    if (claims.length > 10) badges.push("Top Contributor");
    if (votes.length > 20) badges.push("Active Voter");
    if (claims.length > 5 && votes.length > 10) badges.push("Engaged User");

    return badges;
  };

  const badges = getBadges((userClaims as ClaimInstance[]) || [], votedClaims);
  const levelName = getLevelName((userClaims as ClaimInstance[]) || [], votedClaims);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      {isCheckingVotes && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-600">
            Checking votes... {checkProgress.current} of {checkProgress.total} claims
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(checkProgress.current / checkProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Profile Level</h2>
        <p className="text-lg font-semibold text-blue-600">Level: {levelName}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 ? (
            <p className="text-gray-500">No badges earned yet. Keep contributing to earn badges!</p>
          ) : (
            badges.map((badge, index) => (
              <div key={index} className="px-3 py-1 bg-blue-500 text-white rounded-full shadow-md">
                {badge}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Claims Created</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          {(userClaims as ClaimInstance[])?.map((claim, index) => (
            <div key={index} className="mb-4 p-3 bg-white rounded shadow">
              <h3 className="font-semibold">{claim.title}</h3>
              <p className="text-sm text-gray-600">Category: {claim.category}</p>
              <p className="text-sm text-gray-500">
                Created: {new Date(Number(claim.creationTime) * 1000).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Claims Voted On</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          {votedClaims.length === 0 ? (
            <p className="text-gray-500">You haven't voted on any claims yet.</p>
          ) : (
            votedClaims.map((claim, index) => (
              <div key={index} className="mb-4 p-3 bg-white rounded shadow">
                <h3 className="font-semibold">{claim.title}</h3>
                <p className="text-sm text-gray-600">Category: {claim.category}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(Number(claim.creationTime) * 1000).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Profile Analytics</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="mb-2">Claims Created: <span className="font-semibold">{(userClaims as ClaimInstance[])?.length || 0}</span></p>
          <p>Claims Voted On: <span className="font-semibold">{votedClaims.length}</span></p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
