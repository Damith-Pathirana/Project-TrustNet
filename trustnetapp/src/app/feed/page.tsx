"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from '../constants/contracts';
import dynamic from 'next/dynamic';
import { createPagination, getTotalPages } from '../utils/pagination';
import Pagination from '../components/Pagination';
import LoadingContent from "../components/LoadingContent";

// Dynamically import CampaignCard to avoid SSR issues if it uses client-side hooks
const CampaignCard = dynamic(() => import("../components/Campaigncard"), {
  ssr: false,
  loading: () => (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-white/10 rounded w-1/2"></div>
    </div>
  ),
});

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const ITEMS_PER_PAGE = 9;

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'reverse-alphabetical', label: 'Z-A' }
];

// More robust recommendation logic based on the profile page
const analyzeUserPreferences = (userClaims: readonly Claim[]): string => {
  if (!userClaims || userClaims.length === 0) return '';
  
  const categoryCount: { [key: string]: number } = {};
  
  userClaims.forEach(claim => {
    categoryCount[claim.category] = (categoryCount[claim.category] || 0) + 1;
  });
  
  let preferredCategory = '';
  let maxInteractions = 0;

  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > maxInteractions) {
      maxInteractions = count;
      preferredCategory = category;
    }
  });

  return preferredCategory;
};

const getRecommendations = (
  preferredCategory: string,
  allClaims: readonly Claim[],
  userAddress: string | undefined
) => {
  if (!preferredCategory || !allClaims || !userAddress) return [];
  
  // Filter claims related to the preferred category
  const recommendedClaims = allClaims.filter(claim => claim.category === preferredCategory);
  
  // Filter out claims the user has created themselves
  // Note: We are not filtering by voted claims yet, as that data isn't fetched on this page.
  return recommendedClaims.filter(claim => claim.owner !== userAddress);
};

const FeedPage = () => {
  const account = useActiveAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Claim[]>([]);

  const contract = getContract({ client, chain: sepolia, address: TrustNetsFactory });

  const { data: allClaims, isLoading: isAllClaimsLoading } = useReadContract({
    contract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  const { data: userClaims, isLoading: isUserClaimsLoading } = useReadContract({
    contract,
    method: "function getUserClaims(address _user) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!account?.address },
  });

  useEffect(() => {
    if (!isAllClaimsLoading && !isUserClaimsLoading) {
      if (userClaims && allClaims && account?.address) {
        const preferredCategory = analyzeUserPreferences(userClaims);
        const newRecommendations = getRecommendations(preferredCategory, allClaims, account.address);
        setRecommendations(newRecommendations);
      } else {
        // Handle case where user has no claims or is not logged in
        setRecommendations([]);
      }
      setIsLoading(false);
    }
  }, [allClaims, userClaims, isAllClaimsLoading, isUserClaimsLoading, account?.address]);

  const sortClaims = (claimsToSort: Claim[], sortType: string): Claim[] => {
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

  const sortedRecommendations = useMemo(() => {
    return sortClaims(recommendations, sortBy);
  }, [recommendations, sortBy]);

  const paginatedData = useMemo(() => {
    return createPagination(sortedRecommendations, currentPage, ITEMS_PER_PAGE);
  }, [sortedRecommendations, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return <LoadingContent />;
  }

  const totalPages = getTotalPages(recommendations.length, ITEMS_PER_PAGE);

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20 w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">Recommended Claims</h1>
        
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
            {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {paginatedData.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedData.items.map((claim) => (
                <CampaignCard
                  key={claim.claimAddress}
                  claimAddress={claim.claimAddress}
                  owner={claim.owner}
                  title={claim.title}
                  creationTime={claim.creationTime}
                  category={claim.category}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center text-[#808191] text-lg">
            No recommendations based on your activity yet. Explore more claims to get started!
          </div>
        )}
      </div>
    </main>
  );
};

export default FeedPage; 