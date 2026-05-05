'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import { TrustNetsFactory } from '../constants/contracts';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';

interface Claim {
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

interface ClaimVoteStatusCheckerProps {
  claim: Claim;
  walletAddress: string;
  onVoteStatusChecked: (claim: Claim, hasVoted: boolean) => void;
}

const ClaimVoteStatusChecker: React.FC<ClaimVoteStatusCheckerProps> = ({
  claim,
  walletAddress,
  onVoteStatusChecked,
}) => {
  const claimContract = getContract({
    client: client,
    chain: sepolia,
    address: claim.claimAddress,
  });

  const { data: hasVoted, isLoading } = useReadContract({
    contract: claimContract,
    method: "function hasVoted(uint256, address) view returns (bool)",
    params: [0n, walletAddress],
  });

  useEffect(() => {
    if (!isLoading && hasVoted !== undefined) {
      onVoteStatusChecked(claim, hasVoted);
    }
  }, [hasVoted, isLoading, claim, onVoteStatusChecked]);

  return null; // This component doesn't render anything visual
};

// Custom hook for checking if a user has voted on a claim
const useHasVoted = (claimAddress: string, userAddress: string) => {
  const claimContract = getContract({
    client: client,
    chain: sepolia,
    address: claimAddress,
  });

  const { data: hasVoted, isLoading } = useReadContract({
    contract: claimContract,
    method: "function hasVoted(uint256, address) view returns (bool)",
    params: [0n, userAddress],
    queryOptions: { enabled: !!userAddress }
  });

  return { hasVoted, isLoading };
};

// Recommendation System Logic
const analyzeUserPreferences = (userClaims: readonly Claim[], userVotes: readonly Claim[]) => {
  const categoryInteractions: { [key: string]: number } = {};

  // Count interactions in each category for claims created
  userClaims.forEach(claim => {
    const category = claim.category;
    categoryInteractions[category] = (categoryInteractions[category] || 0) + 1;
  });

  // Count interactions in each category for votes cast
  // NOTE: Fetching userVotes is a TODO in this implementation
  // userVotes.forEach(vote => {
  //   // Assuming votes have a category field, this needs to be confirmed based on actual vote data structure
  //   const category = vote.category;
  //   categoryInteractions[category] = (categoryInteractions[category] || 0) + 1;
  // });

  // Determine the most interacted category
  let preferredCategory = '';
  let maxInteractions = 0;

  Object.entries(categoryInteractions).forEach(([category, count]) => {
    if (count > maxInteractions) {
      maxInteractions = count;
      preferredCategory = category;
    }
  });

  return preferredCategory;
};

const getRecommendations = (preferredCategory: string, claims: readonly Claim[], accountAddress?: string, votedClaims?: readonly Claim[]) => {
  if (!preferredCategory || preferredCategory.length === 0) return [];
  // Filter claims related to the preferred category
  const recommendedClaims = claims.filter(claim => 
    claim.category === preferredCategory
  );
  
  // Filter out claims the user has created or voted on
  const filterdRecommendations = recommendedClaims.filter(claim => 
    claim.owner !== accountAddress && // Exclude claims created by the user
    !(votedClaims && votedClaims.some(votedClaim => votedClaim.claimAddress === claim.claimAddress)) // Exclude claims the user has voted on (if votedClaims is available)
  );

  return filterdRecommendations;
};

// Notification Component
interface NotificationCardProps {
  claim: Claim;
  onClose: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ claim, onClose }) => {
  const router = useRouter();
  
  const handleViewClaim = () => {
    router.push(`/claim/${claim.claimAddress}`);
    onClose(); // Close notification after navigating
  };

  return (
    <div className="fixed top-4 right-4 bg-[#1c1c24] text-white p-4 rounded-lg shadow-lg border border-[#2c2c34] z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-2">Recommendation: Verify This Fact</h3>
      <p className="text-sm text-[#808191] mb-2">From your preferred category: <span className="text-[#c6ff20]">{claim.category}</span></p>
      <h4 className="font-semibold text-white mb-1 break-words">{claim.title}</h4>
      {/* Optional: Display a snippet of description if available */}
      {/* <p className="text-sm text-[#808191] mb-2">{claim.description.substring(0, 100)}...</p> */}
      <div className="flex justify-end gap-2 mt-4">
        <button 
          onClick={handleViewClaim}
          className="bg-[#c6ff20] text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a8e01d] transition-colors"
        >
          View Claim
        </button>
        <button onClick={onClose} className="bg-[#2c2f32] text-[#808191] px-4 py-2 rounded-md text-sm font-medium hover:text-white transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
};

const getLevelName = (claims: readonly Claim[]) => {
  const claimsCreated = claims.length;
  if (claimsCreated >= 100) return { name: 'Grandmaster', icon: 'Grandmaster.png' };
  if (claimsCreated >= 50) return { name: 'Master', icon: 'Master.png' };
  if (claimsCreated >= 20) return { name: 'Expert', icon: 'Expert.png' };
  if (claimsCreated >= 5) return { name: 'Apprentice', icon: 'Apprentice.png' };
  return { name: 'Novice', icon: 'Novice.png' };
};

const getBadges = (claims: readonly Claim[], votes: readonly Claim[]) => {
  const badges = [];
  const claimsCreated = claims.length;
  const votesCast = votes.length;
  
  // Milestone badges based on claims created
  if (claimsCreated >= 1) badges.push("First Claim");
  if (claimsCreated >= 5) badges.push("Rising Star");
  if (claimsCreated >= 10) badges.push("Trust Builder");
  if (claimsCreated >= 20) badges.push("Fact Champion");
  if (claimsCreated >= 50) badges.push("Truth Guardian");
  if (claimsCreated >= 100) badges.push("Legendary Fact-Checker");

  // Badges based on votes cast
  if (votesCast >= 1) badges.push("First Vote");
  if (votesCast >= 5) badges.push("Active Voter");
  if (votesCast >= 10) badges.push("Engaged Citizen");
  if (votesCast >= 20) badges.push("Voting Expert");
  if (votesCast >= 50) badges.push("Democratic Pillar");

  // Badges based on combined activity
  if (claimsCreated > 0 && votesCast > 0) badges.push("Contributor & Voter");
  if (claimsCreated >= 5 && votesCast >= 10) badges.push("Community Builder");
  if (claimsCreated >= 10 && votesCast >= 20) badges.push("Influential Member");

  return badges;
};

const ProfilePage = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [votedClaims, setVotedClaims] = useState<Claim[]>([]);
  const [recommendations, setRecommendations] = useState<Claim[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<Claim | null>(null);
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const profileBadgeRef = useRef<HTMLDivElement>(null);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [isCheckingVotes, setIsCheckingVotes] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  // Fetch user's created claims
  const { data: userClaims, isPending: isClaimsLoading } = useReadContract({
    contract,
    method: "function getUserClaims(address _user) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  // Fetch all claims for recommendations AND to check vote status
  const { data: allClaims, isPending: isAllClaimsLoading } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  // Handle vote status check for a claim
  const handleVoteStatusChecked = (claim: Claim, hasVoted: boolean) => {
    if (hasVoted) {
      setVotedClaims(prev => {
        if (!prev.some(c => c.claimAddress === claim.claimAddress)) {
          return [...prev, claim];
        }
        return prev;
      });
    }
  };

  // Reset voted claims when all claims or account changes
  useEffect(() => {
    setVotedClaims([]);
  }, [allClaims, account?.address]);

  // Analyze preferences and get recommendations
  useEffect(() => {
    if (userClaims === undefined || allClaims === undefined) return; // Wait for data, including voted claims
    
    const preferredCategory = analyzeUserPreferences(userClaims, votedClaims as readonly Claim[]);
    const recommendedClaims = getRecommendations(preferredCategory, allClaims, account?.address, votedClaims as readonly Claim[]);

    setRecommendations(recommendedClaims);
    setRecommendationIndex(0); // Reset index when recommendations change

  }, [userClaims, votedClaims, allClaims, account?.address]);

  // Show notification and cycle through recommendations
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (recommendations.length > 0) {
      setCurrentRecommendation(recommendations[recommendationIndex]);
      setShowNotification(true);

      intervalId = setInterval(() => {
        setRecommendationIndex(prevIndex => (prevIndex + 1) % recommendations.length);
      }, 10000); // Change recommendation every 10 seconds

    } else {
      setShowNotification(false);
      setCurrentRecommendation(null);
    };

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

  }, [recommendations, recommendationIndex]);

  useEffect(() => {
    const checkVotedClaims = async () => {
      if (!allClaims || !account?.address) return;
      setIsCheckingVotes(true);
      let votes = 0;
      setCheckProgress({ current: 0, total: allClaims.length });
      for (let i = 0; i < allClaims.length; i++) {
        const claim = allClaims[i];
        setCheckProgress({ current: i + 1, total: allClaims.length });
        const claimContract = getContract({
          client: client,
          chain: sepolia,
          address: claim.claimAddress,
        });
        try {
          const hasVoted = await readContract({
            contract: claimContract,
            method: "function hasVoted(uint256, address) view returns (bool)",
            params: [0n, account.address],
          });
          if (hasVoted) votes++;
        } catch (error) {
          // ignore
        }
      }
      setTotalVotesCast(votes);
      setIsCheckingVotes(false);
      setCheckProgress({ current: 0, total: 0 });
    };
    if (allClaims && account?.address) {
      checkVotedClaims();
    }
  }, [allClaims, account?.address]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getVoteColor = (voteType: string) => {
    switch (voteType) {
      case "valid": return "text-green-500";
      case "invalid": return "text-red-500";
      case "unverifiable": return "text-yellow-500";
      case "misleading": return "text-blue-500";
      default: return "text-gray-400";
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const determineMajorityVote = (details: any) => {
    const [, , , , , , validVotes, invalidVotes, unverifiableVotes, misleadingVotes] = details;
    const totalVotes = Number(validVotes) + Number(invalidVotes) + Number(unverifiableVotes) + Number(misleadingVotes);
    const maxVotes = Math.max(Number(validVotes), Number(invalidVotes), Number(unverifiableVotes), Number(misleadingVotes));
    const majorityThreshold = totalVotes / 2;

    if (maxVotes <= majorityThreshold) return "no majority";

    if (Number(validVotes) === maxVotes) return "valid";
    if (Number(invalidVotes) === maxVotes) return "invalid";
    if (Number(unverifiableVotes) === maxVotes) return "unverifiable";
    if (Number(misleadingVotes) === maxVotes) return "misleading";

    return "no majority";
  };

  const ClaimCard = ({ claim, index, showVoteStatus = true }: { claim: Claim; index: number; showVoteStatus?: boolean }) => {
    const claimContract = getContract({
      client: client,
      chain: sepolia,
      address: claim.claimAddress,
    });

    const { data: details, isLoading: isDetailsLoading } = useReadContract({
      contract: claimContract,
      method: "function getClaimDetails(uint256) view returns (string title, string description, string image, string source, string category, address owner, uint256 validVotes, uint256 invalidVotes, uint256 unverifiableVotes, uint256 misleadingVotes)",
      params: [0n],
    });

    if (isDetailsLoading) {
      return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      );
    }

    const majorityVote = determineMajorityVote(details);

    return (
      <div 
        key={index}
        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/claim/${claim.claimAddress}`)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-medium">{claim.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{claim.category}</p>
            {showVoteStatus && (
              <div className="flex items-center mt-2">
                <span className="text-sm font-medium">Majority: </span>
                <span className={`text-sm ml-2 ${getVoteColor(majorityVote)}`}>
                  {majorityVote === "no majority" ? "No Majority" : capitalizeFirstLetter(majorityVote)}
                </span>
              </div>
            )}
          </div>
          <span className="text-gray-400 text-sm">{formatDate(claim.creationTime)}</span>
        </div>
      </div>
    );
  };

  const handleShareProfile = async () => {
    if (profileBadgeRef.current) {
      try {
        const dataUrl = await toPng(profileBadgeRef.current, { cacheBust: true });
        const blob = await fetch(dataUrl).then(res => res.blob());
        const file = new File([blob], 'trustnet-profile-badge.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My TrustNet Profile',
            text: `Check out my TrustNet profile and achievements! My rank is ${getLevelName(userClaims as readonly Claim[] || []).name}.`,
          });
        } else {
          // Fallback for browsers that do not support Web Share API
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'trustnet-profile-badge.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert("Profile badge downloaded! You can share it manually.");
        }
      } catch (error) {
        console.error('Error sharing profile badge:', error);
        alert("Failed to share profile. Please try again.");
      }
    }
  };

  const levelObj = getLevelName(userClaims as readonly Claim[] || []);

  if (!account) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="bg-white/5 backdrop-blur-md rounded-[10px] sm:p-10 p-4 border border-white/10 shadow-lg w-full max-w-2xl mx-auto">
          <div className="flex justify-center items-center p-[16px] bg-white/10 rounded-[10px] mb-8">
            <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Profile</h1>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* Profile Image - show level icon only */}
            <div className="w-32 h-32 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Image
                src={`/${levelObj.icon}`}
                alt={levelObj.name + ' Icon'}
                width={96}
                height={96}
                className="rounded-full"
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  console.error(`Failed to load icon for level ${levelObj.name}: ${e.currentTarget.src}`);
                  e.currentTarget.src = '/Novice.png'; // Fallback icon
                  e.currentTarget.className = "rounded-full"; // Apply filter to fallback
                }}
              />
            </div>

            {/* Profile Level and Badges Section to Capture */}
            <div ref={profileBadgeRef} className="w-full bg-gradient-to-br from-[#1c1c24] to-[#2c2c34] rounded-xl p-6 border-2 border-[#c6ff20]/30 shadow-[0_0_20px_rgba(198,255,32,0.1)] relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c6ff20] to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c6ff20] to-transparent opacity-50"></div>
              
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">TrustNet Honor Badge</h1>
                <p className="text-[#c6ff20] text-sm">Awarded for contributions to truth and verification</p>
              </div>

              {/* Level Section */}
              <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-[#c6ff20]/20">
                <Image
                  src={`/${levelObj.icon}`}
                  alt={levelObj.name + ' Icon'}
                  width={64}
                  height={64}
                  className="rounded-full"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    console.error(`Failed to load icon for level ${levelObj.name}: ${e.currentTarget.src}`);
                    e.currentTarget.src = '/Novice.png';
                    e.currentTarget.className = "rounded-full";
                  }}
                />
                <div>
                  <h2 className="text-sm font-medium text-gray-400">Current Rank</h2>
                  <p className="text-2xl font-bold text-[#c6ff20]">{levelObj.name}</p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3 border border-[#c6ff20]/20">
                  <p className="text-sm text-gray-400">Claims Created</p>
                  <p className="text-xl font-bold text-white">{(userClaims?.length || 0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-[#c6ff20]/20">
                  <p className="text-sm text-gray-400">Votes Cast</p>
                  <p className="text-xl font-bold text-white">{totalVotesCast}</p>
                </div>
              </div>

              {/* Badges Section */}
              <div className="bg-white/5 rounded-lg p-4 border border-[#c6ff20]/20">
                <h2 className="text-sm font-medium text-gray-400 mb-3">Achievements</h2>
                <div className="flex flex-wrap gap-2">
                  {getBadges(userClaims as readonly Claim[] || [], votedClaims as readonly Claim[]).map((badge, index) => (
                    <div key={index} className="px-3 py-1 bg-[#c6ff20]/20 text-[#c6ff20] rounded-full text-sm border border-[#c6ff20]/30">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleShareProfile}
                className="mt-6 w-full bg-[#c6ff20] text-black py-3 rounded-md font-semibold text-lg hover:bg-[#a8e01d] transition-colors shadow-lg"
              >
                Share My TrustNet Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-4">
      {showNotification && currentRecommendation && (
        <NotificationCard claim={currentRecommendation} onClose={() => setShowNotification(false)} />
      )}
      <div className="bg-white/5 backdrop-blur-md rounded-[10px] sm:p-10 p-4 border border-white/10 shadow-lg w-full max-w-2xl mx-auto">
        <div className="flex justify-center items-center p-[16px] bg-white/10 rounded-[10px] mb-8">
          <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Profile</h1>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {/* Profile Image - show level icon only */}
          <div className="w-32 h-32 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Image
              src={`/${levelObj.icon}`}
              alt={levelObj.name + ' Icon'}
              width={96}
              height={96}
              className="rounded-full"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                console.error(`Failed to load icon for level ${levelObj.name}: ${e.currentTarget.src}`);
                e.currentTarget.src = '/Novice.png'; // Fallback icon
                e.currentTarget.className = "rounded-full"; // Apply filter to fallback
              }}
            />
          </div>

          {/* Profile Level and Badges Section to Capture */}
          <div ref={profileBadgeRef} className="w-full bg-gradient-to-br from-[#1c1c24] to-[#2c2c34] rounded-xl p-6 border-2 border-[#c6ff20]/30 shadow-[0_0_20px_rgba(198,255,32,0.1)] relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c6ff20] to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c6ff20] to-transparent opacity-50"></div>
            
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">TrustNet Honor Badge</h1>
              <p className="text-[#c6ff20] text-sm">Awarded for contributions to truth and verification</p>
            </div>

            {/* Level Section */}
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-[#c6ff20]/20">
              <Image
                src={`/${levelObj.icon}`}
                alt={levelObj.name + ' Icon'}
                width={64}
                height={64}
                className="rounded-full"
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  console.error(`Failed to load icon for level ${levelObj.name}: ${e.currentTarget.src}`);
                  e.currentTarget.src = '/Novice.png';
                  e.currentTarget.className = "rounded-full";
                }}
              />
              <div>
                <h2 className="text-sm font-medium text-gray-400">Current Rank</h2>
                <p className="text-2xl font-bold text-[#c6ff20]">{levelObj.name}</p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 border border-[#c6ff20]/20">
                <p className="text-sm text-gray-400">Claims Created</p>
                <p className="text-xl font-bold text-white">{(userClaims?.length || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-[#c6ff20]/20">
                <p className="text-sm text-gray-400">Votes Cast</p>
                <p className="text-xl font-bold text-white">{totalVotesCast}</p>
              </div>
            </div>

            {/* Badges Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-[#c6ff20]/20">
              <h2 className="text-sm font-medium text-gray-400 mb-3">Achievements</h2>
              <div className="flex flex-wrap gap-2">
                {getBadges(userClaims as readonly Claim[] || [], votedClaims as readonly Claim[]).map((badge, index) => (
                  <div key={index} className="px-3 py-1 bg-[#c6ff20]/20 text-[#c6ff20] rounded-full text-sm border border-[#c6ff20]/30">
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleShareProfile}
              className="mt-6 w-full bg-[#c6ff20] text-black py-3 rounded-md font-semibold text-lg hover:bg-[#a8e01d] transition-colors shadow-lg"
            >
              Share My TrustNet Profile
            </button>
          </div>

          {/* User Claims Section */}
          <section className="w-full mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Claims You've Created</h2>
            {userClaims && userClaims.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userClaims.map((claim, index) => (
                  <ClaimCard key={claim.claimAddress} claim={claim} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No claims created yet.</p>
            )}
          </section>

          {/* Claims You've Voted On Section */}
          <section className="w-full mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Claims You've Voted On</h2>
            {votedClaims && votedClaims.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {votedClaims.map((claim, index) => (
                  <ClaimCard key={claim.claimAddress} claim={claim} index={index} showVoteStatus={false} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No claims voted on yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 