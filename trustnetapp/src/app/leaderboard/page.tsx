"use client";

import { useReadContract, useActiveAccount } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import LoadingContent from "../components/LoadingContent";

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

interface UserStats {
  address: string;
  claimsCreated: number;
  level: { name: string; icon: string };
  badges: string[];
}

const getLevel = (claimsCreated: number) => {
  if (claimsCreated >= 100) return { name: 'Grandmaster', icon: 'Grandmaster.png' };
  if (claimsCreated >= 50) return { name: 'Master', icon: 'Master.png' };
  if (claimsCreated >= 20) return { name: 'Expert', icon: 'Expert.png' };
  if (claimsCreated >= 5) return { name: 'Apprentice', icon: 'Apprentice.png' };
  return { name: 'Novice', icon: 'Novice.png' };
};

const getBadges = (claimsCreated: number) => {
  const badges = [];
  
  // Milestone badges
  if (claimsCreated >= 1) badges.push("First Claim");
  if (claimsCreated >= 5) badges.push("Rising Star");
  if (claimsCreated >= 10) badges.push("Trust Builder");
  if (claimsCreated >= 20) badges.push("Fact Champion");
  if (claimsCreated >= 50) badges.push("Truth Guardian");
  if (claimsCreated >= 100) badges.push("Legendary Fact-Checker");

  return badges;
};

const getPoints = (claimsCreated: number) => claimsCreated * 10;

const LevelRoadmap = () => {
  const levels = [
    { name: 'Novice', icon: 'Novice.svg', requirement: 'Start your journey', description: 'Begin your fact-checking journey' },
    { name: 'Apprentice', icon: 'Apprentice.svg', requirement: '5 Claims', description: 'Master the basics of fact-checking' },
    { name: 'Expert', icon: 'Expert.svg', requirement: '20 Claims', description: 'Become a trusted fact-checker' },
    { name: 'Master', icon: 'Master.png', requirement: '50 Claims', description: 'Lead the community in truth-seeking' },
    { name: 'Grandmaster', icon: 'Grandmaster.svg', requirement: '100 Claims', description: 'Achieve legendary status' },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Level Progression</h2>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#c6ff20]/20 -translate-y-1/2"></div>
        
        {/* Level Cards */}
        <div className="flex justify-between items-center relative">
          {levels.map((level, index) => (
            <div key={level.name} className="flex flex-col items-center">
              {/* Level Icon */}
              <div className="w-24 h-24 rounded-full bg-[#1c1c24] border-2 border-[#c6ff20] flex items-center justify-center mb-4 z-10 overflow-hidden relative">
                <Image
                  src={`/${level.icon}`}
                  alt={level.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    console.error(`Error loading level icon: ${level.icon}`, e);
                    e.currentTarget.src = '/Novice.png';
                  }}
                />
              </div>
              
              {/* Level Info */}
              <div className="text-center max-w-[180px]">
                <h3 className="text-lg font-bold text-[#c6ff20] mb-1">{level.name}</h3>
                <p className="text-white/80 text-sm mb-1">{level.requirement}</p>
                <p className="text-white/60 text-xs">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Leaderboard() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const account = useActiveAccount();

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  const { data: claims, isPending, error } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  useEffect(() => {
    if (claims) {
      // Process claims to get user stats
      const userStatsMap: { [address: string]: number } = {};
      
      // Count claims created
      claims.forEach(claim => {
        userStatsMap[claim.owner] = (userStatsMap[claim.owner] || 0) + 1;
      });

      // Calculate stats and format for display
      const calculatedUserStats: UserStats[] = Object.entries(userStatsMap).map(([address, claimsCreated]) => ({
        address,
        claimsCreated,
        level: getLevel(claimsCreated),
        badges: getBadges(claimsCreated)
      }));

      // Sort by claims created (descending)
      calculatedUserStats.sort((a, b) => b.claimsCreated - a.claimsCreated);

      setUserStats(calculatedUserStats);
    }
  }, [claims]);

  if (isPending) {
    return <LoadingContent />;
  }

  if (error) {
    console.error("Error fetching claims for leaderboard:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Error Loading Leaderboard</h2>
        <p className="text-[#808191] mb-6">There was an error loading the leaderboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <main className="p-4 pb-10 min-h-[100vh] container max-w-screen-lg mx-auto text-white">
      <div className="py-20">
        <h1 className="text-4xl font-bold text-white mb-10 text-center">Leaderboard</h1>
        
        <LevelRoadmap />
        
        {userStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold mb-4">No Claims Created Yet</h2>
            <p className="text-[#808191]">The leaderboard is empty. Be the first to create a claim!</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-6">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Claims</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Badges</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {userStats.map((user, index) => {
                  const isCurrentUser = account?.address && user.address.toLowerCase() === account.address.toLowerCase();
                  return (
                    <tr
                      key={user.address}
                      className={
                        (isCurrentUser ? "bg-[#c6ff20]/10 border-l-4 border-[#c6ff20] " : "") + "hover:bg-white/5 transition-colors"
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#808191]">
                        {isCurrentUser ? <span className="font-bold text-[#c6ff20]">You</span> : user.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90 flex items-center">
                        <Image
                          src={`/${user.level.icon}`}
                          alt={user.level.name}
                          width={20}
                          height={20}
                          className="mr-2"
                          onError={(e) => {
                            console.error(`Failed to load icon for level ${user.level.name}: ${e.currentTarget.src}`);
                            e.currentTarget.src = '/Novice.png';
                          }}
                        />
                        {user.level.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{user.claimsCreated}</td>
                      <td className="px-6 py-4 text-sm text-white/90">
                        <div className="flex flex-wrap gap-1">
                          {user.badges.map((badge, idx) => (
                            <span key={idx} className="px-2 py-1 bg-[#c6ff20]/20 text-[#c6ff20] rounded-full text-xs">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90 font-bold">{getPoints(user.claimsCreated)} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 