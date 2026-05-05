"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { client } from "./client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "./constants/contracts";
import CampaignCard from "./components/Campaigncard";
import LoadingContent from "./components/LoadingContent";
import HomeSidebar from './components/HomeSidebar';

const categories = [
  'All',
  "Geo Politics",
  "Sports",
  "Business",
  "Innovation",
  "Culture",
  "Arts",
  "Travel",
  "Conspiracy",
  "Technology",
  "Health",
  "Entertainment",
  "Politics",
  "Environment",
  "Other",
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'reverse-alphabetical', label: 'Z-A' }
];

// Recommendation Logic and Component
interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const analyzeUserPreferences = (userClaims: readonly Claim[], userVotes: readonly Claim[]) => {
  const categoryInteractions: { [key: string]: number } = {};
  userClaims.forEach(claim => {
    categoryInteractions[claim.category] = (categoryInteractions[claim.category] || 0) + 1;
  });
  // This part needs voted claims data, which we will fetch
  // userVotes.forEach(vote => { ... });
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
  if (!preferredCategory || !claims) return [];
  const recommendedClaims = claims.filter(claim => claim.category === preferredCategory);
  return recommendedClaims.filter(claim =>
    claim.owner !== accountAddress &&
    !(votedClaims && votedClaims.some(votedClaim => votedClaim.claimAddress === claim.claimAddress))
  );
};

const NotificationCard: React.FC<{ claim: Claim; onClose: () => void }> = ({ claim, onClose }) => {
  const router = useRouter();
  const handleViewClaim = () => {
    router.push(`/claim/${claim.claimAddress}`);
    onClose();
  };

  return (
    <div className="fixed top-4 right-4 bg-[#1c1c24] text-white p-4 rounded-lg shadow-lg border border-[#2c2c34] z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-2">Recommendation: Verify This Fact</h3>
      <p className="text-sm text-[#808191] mb-2">From your preferred category: <span className="text-[#c6ff20]">{claim.category}</span></p>
      <h4 className="font-semibold text-white mb-1 break-words">{claim.title}</h4>
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

export default function Home() {
  const router = useRouter();
  const account = useActiveAccount();
  const [claims, setClaims] = useState<any[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // State for recommendations
  const [recommendations, setRecommendations] = useState<Claim[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<Claim | null>(null);

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  const { data: allClaims, isPending: isAllClaimsLoading } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  // Fetch user's created claims for recommendations
  const { data: userClaims, isPending: isUserClaimsLoading } = useReadContract({
    contract,
    method: "function getUserClaims(address _user) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!account?.address },
  });

  // Analyze preferences and get recommendations
  useEffect(() => {
    if (userClaims && allClaims) {
      const preferredCategory = analyzeUserPreferences(userClaims, []); // Passing empty array for voted claims for now
      const newRecommendations = getRecommendations(preferredCategory, allClaims, account?.address, []);
      setRecommendations(newRecommendations);
    }
  }, [userClaims, allClaims, account?.address]);

  // Effect to show notification when recommendations are available
  useEffect(() => {
    if (recommendations.length > 0) {
      setCurrentRecommendation(recommendations[0]);
      setShowNotification(true);
    }
  }, [recommendations]);

  // Function to sort claims based on different criteria
  const sortClaims = (claimsToSort: any[], sortType: string) => {
    const sortedClaims = [...claimsToSort];
    
    switch (sortType) {
      case 'newest':
        return sortedClaims.sort((a, b) => Number(b.creationTime) - Number(a.creationTime));
      case 'oldest':
        return sortedClaims.sort((a, b) => Number(a.creationTime) - Number(b.creationTime));
      case 'alphabetical':
        return sortedClaims.sort((a, b) => a.title.localeCompare(b.title));
      case 'reverse-alphabetical':
        return sortedClaims.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedClaims;
    }
  };

  useEffect(() => {
    if (allClaims) {
      const formattedClaims = allClaims.map((claim: any) => ({
        id: claim.claimId?.toString() || Math.random().toString(),
        claimAddress: claim.claimAddress,
        owner: claim.owner,
        title: claim.title,
        creationTime: claim.creationTime,
        category: claim.category,
      }));
      setClaims(formattedClaims);
      setFilteredClaims(formattedClaims);
      setIsLoading(false);
    }
  }, [allClaims]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategories(prev => {
      if (category === 'All') {
        return ['All'];
      }
      
      const newCategories = prev.filter(c => c !== 'All');
      if (prev.includes(category)) {
        const filtered = newCategories.filter(c => c !== category);
        return filtered.length === 0 ? ['All'] : filtered;
      } else {
        return [...newCategories, category];
      }
    });
  };

  useEffect(() => {
    if (selectedCategories.includes('All')) {
      const sortedClaims = sortClaims(claims, sortBy);
      setFilteredClaims(sortedClaims);
    } else {
      const filtered = claims.filter(claim => selectedCategories.includes(claim.category));
      const sortedClaims = sortClaims(filtered, sortBy);
      setFilteredClaims(sortedClaims);
    }
  }, [selectedCategories, claims, sortBy]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1); // -1 for precision issues
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [filteredClaims]); // Re-check when claims change

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      {showNotification && currentRecommendation && (
        <NotificationCard
          claim={currentRecommendation}
          onClose={() => setShowNotification(false)}
        />
      )}
      <div className="py-20 w-full">
        <h1 className="text-4xl font-bold mb-8">TrustNet</h1>
        
        {/* Category Filter with Arrows */}
        <div className="mb-8 relative flex items-center">
          {showLeftArrow && (
            <button 
              onClick={() => handleScroll('left')}
              className="absolute -left-4 z-10 bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div 
            ref={scrollContainerRef} 
            onScroll={checkScroll}
            className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedCategories.includes(category)
                    ? 'bg-[#c6ff20] text-black shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                {category}
                {selectedCategories.includes(category) && category !== 'All' && (
                  <span className="ml-2 text-xs">×</span>
                )}
              </button>
            ))}
          </div>
          {showRightArrow && (
            <button 
              onClick={() => handleScroll('right')}
              className="absolute -right-4 z-10 bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Filter */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <label className="text-white text-sm font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-[#c6ff20] focus:outline-none transition-all duration-200"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#1c1c24] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[#808191] text-sm">
            {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} found
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <LoadingContent />
          ) : filteredClaims.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#808191] text-lg">No claims found in selected categories</p>
            </div>
          ) : (
            filteredClaims.map((claim, index) => (
              <CampaignCard 
                key={index} 
                claimAddress={claim.claimAddress}
                owner={claim.owner}
                title={claim.title}
                creationTime={claim.creationTime}
                category={claim.category}
              />
            ))
          )}
        </div>
        <HomeSidebar />
      </div>
    </main>
  );
}
