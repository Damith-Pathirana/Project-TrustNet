"use client";

import React, { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import { useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { useRouter } from 'next/navigation';
import { getContractInstance } from '../utils/contractUtils';
import { needsContentProtection } from '../utils/contentFilter';

type CampaignCardProps = {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
};

type ClaimDetails = {
  title: string;
  description: string;
  image: string;
  source: string;
  category: string;
  owner: string;
  validVotes: bigint;
  invalidVotes: bigint;
  unverifiableVotes: bigint;
  misleadingVotes: bigint;
};

const isValidImageUrl = (url: string): boolean => {
  if (!url || url === "N/A") return false;
  return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://");
};

// Safe Image component that handles unconfigured domain errors
const SafeImage = ({ src, alt, fill, className, onError }: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  onError?: () => void;
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return null; // Return null to trigger the fallback in parent component
  }

  return (
    <Image 
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};

// Error boundary component
class ImageErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('Image error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const CampaignCard = memo(({ claimAddress, owner, title, creationTime, category }: CampaignCardProps) => {
  const router = useRouter();
  const [claimDetails, setClaimDetails] = useState<ClaimDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isContentProtected, setIsContentProtected] = useState(false);

  const claimContract = getContract({
    client: client,
    chain: sepolia,
    address: claimAddress,
  });

  const { data: details, isPending } = useReadContract({
    contract: claimContract,
    method: "function getClaimDetails(uint256) view returns (string title, string description, string image, string source, string category, address owner, uint256 validVotes, uint256 invalidVotes, uint256 unverifiableVotes, uint256 misleadingVotes)",
    params: [0n],
  });

  useEffect(() => {
    if (details) {
      const [
        title,
        description,
        image,
        source,
        category,
        owner,
        validVotes,
        invalidVotes,
        unverifiableVotes,
        misleadingVotes
      ] = details;

      // Check if content needs protection
      const shouldProtect = needsContentProtection(image, title, description);
      setIsContentProtected(shouldProtect);

      setClaimDetails({
        title,
        description,
        image: shouldProtect ? 'N/A' : image,
        source,
        category,
        owner,
        validVotes: BigInt(validVotes),
        invalidVotes: BigInt(invalidVotes),
        unverifiableVotes: BigInt(unverifiableVotes),
        misleadingVotes: BigInt(misleadingVotes),
      });
      setIsLoading(false);
    }
  }, [details]);

  // Dummy function to simulate a vote or action that triggers confetti
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000); // Confetti duration
  };

  const handleClick = () => {
    router.push(`/claim/${claimAddress}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const displayImage =
    isContentProtected || imageError
      ? "/path/to/privacy-protected-image.png" // Replace with your actual privacy-protected image path
      : claimDetails?.image || "";

  if (isLoading || isPending || !claimDetails) {
    return (
      <div className="sm:w-[288px] w-full rounded-[15px] bg-white/5 backdrop-blur-md p-4 overflow-hidden border border-white/10 shadow-lg">
        <div className="animate-pulse">
          <div className="h-[158px] bg-white/10 rounded-[15px] mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalVotes = Number(claimDetails.validVotes) + Number(claimDetails.invalidVotes) + 
    Number(claimDetails.unverifiableVotes) + Number(claimDetails.misleadingVotes);
  const majorityThreshold = totalVotes / 2;

  const determineMajorityVote = () => {
    const validVotes = Number(claimDetails.validVotes);
    const invalidVotes = Number(claimDetails.invalidVotes);
    const unverifiableVotes = Number(claimDetails.unverifiableVotes);
    const misleadingVotes = Number(claimDetails.misleadingVotes);
    
    const maxVotes = Math.max(validVotes, invalidVotes, unverifiableVotes, misleadingVotes);
    const majorityThreshold = totalVotes / 2;

    if (maxVotes <= majorityThreshold) return "no majority";
    
    if (validVotes === maxVotes) return "valid";
    if (invalidVotes === maxVotes) return "invalid";
    if (unverifiableVotes === maxVotes) return "unverifiable";
    if (misleadingVotes === maxVotes) return "misleading";
    
    return "no majority";
  };

  const majorityVote = determineMajorityVote();

  const getVoteColor = (voteType: "valid" | "invalid" | "unverifiable" | "misleading") => {
    const isMajority = majorityVote === voteType;
    switch (voteType) {
      case "valid":
        return isMajority ? "bg-green-500" : "bg-green-300";
      case "invalid":
        return isMajority ? "bg-red-500" : "bg-red-300";
      case "unverifiable":
        return isMajority ? "bg-yellow-500" : "bg-yellow-300";
      case "misleading":
        return isMajority ? "bg-blue-500" : "bg-blue-300";
      default:
        return "bg-gray-300";
    }
  };

  const showPrivacyMessage = !isValidImageUrl(displayImage) || imageError || isContentProtected;

  const calculatePercentage = (votes: bigint) => {
    return totalVotes > 0 ? (Number(votes) / totalVotes) * 100 : 0;
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="sm:w-[288px] w-full rounded-[15px] bg-white/5 backdrop-blur-md cursor-pointer relative overflow-hidden border border-white/10 shadow-lg">
      {showConfetti && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Confetti particles */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 10}%`,
                backgroundColor: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#800080', '#ffa500', '#008000'][i % 8],
                animationDelay: `${Math.random() * 2}s`,
                // The animation transform is defined in tailwind.config.js
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full h-[158px] bg-[#2c2c34] rounded-t-[15px] overflow-hidden">
        {!showPrivacyMessage ? (
          <ImageErrorBoundary
            fallback={
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                <div className="text-[#808191]">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0H9m3 0h2m-3 3v2m0 0h2m-2 0H9" />
                  </svg>
                  <p className="text-sm font-medium">Image Not Available</p>
                  <p className="text-xs mt-1">This image could not be loaded (possibly due to an unallowed domain)</p>
                </div>
              </div>
            }
          >
            <SafeImage 
              src={displayImage}
              alt={claimDetails.title || "Campaign image"}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          </ImageErrorBoundary>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <div className="text-[#808191]">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0H9m3 0h2m-3 3v2m0 0h2m-2 0H9" />
              </svg>
              <p className="text-sm font-medium">
                {isContentProtected || imageError ? 'Image Not Available' : 'Image Protected'}
              </p>
              <p className="text-xs mt-1">
                {isContentProtected 
                  ? 'This content has been flagged as sensitive'
                  : imageError ? 'This image could not be loaded (possibly due to an unallowed domain)' : 'This source has privacy protections enabled'}
              </p>
              {isContentProtected && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full mt-2 inline-block">
                  18+
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col p-4">
        <div className="flex flex-row items-center mb-[18px]">
          <p className="ml-[12px] mt-[2px] font-epilogue font-medium text-[12px] text-[#808191]">{claimDetails.category}</p>
        </div>

        <div className="block">
          <h3 className="font-epilogue font-semibold text-[16px] text-white text-left leading-[26px] truncate">{claimDetails.title}</h3>
          <p className="mt-[5px] font-epilogue font-normal text-[#808191] text-left leading-[18px] truncate">{claimDetails.description}</p>
        </div>

        <div className="flex justify-between flex-wrap mt-[15px] gap-2">
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">Votes</h4>
            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[#808191] sm:max-w-[120px] truncate">Total: {totalVotes}</p>
          </div>
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">Majority</h4>
            <p className={`mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] sm:max-w-[120px] truncate ${
              majorityVote === "no majority" 
                ? "text-[#808191]" 
                : majorityVote === "valid" 
                  ? "text-green-500" 
                  : majorityVote === "invalid" 
                    ? "text-red-500" 
                    : majorityVote === "unverifiable" 
                      ? "text-yellow-500" 
                      : "text-blue-500"
            }`}>
              {majorityVote === "no majority" ? "No Majority" : capitalizeFirstLetter(majorityVote)}
            </p>
          </div>
        </div>

        <div className="flex items-center mt-[20px] gap-[12px]">
          <div className="flex space-x-2">
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                <div 
                  className={`absolute bottom-0 w-full ${getVoteColor("valid")} rounded-t transition-all duration-300`} 
                  style={{ height: `${calculatePercentage(claimDetails.validVotes)}%` }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${majorityVote === "valid" ? "text-green-500 font-semibold" : "text-[#808191]"}`}>
                {capitalizeFirstLetter("valid")} ({calculatePercentage(claimDetails.validVotes).toFixed(1)}%)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                <div 
                  className={`absolute bottom-0 w-full ${getVoteColor("invalid")} rounded-t transition-all duration-300`} 
                  style={{ height: `${calculatePercentage(claimDetails.invalidVotes)}%` }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${majorityVote === "invalid" ? "text-red-500 font-semibold" : "text-[#808191]"}`}>
                {capitalizeFirstLetter("invalid")} ({calculatePercentage(claimDetails.invalidVotes).toFixed(1)}%)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                <div 
                  className={`absolute bottom-0 w-full ${getVoteColor("unverifiable")} rounded-t transition-all duration-300`} 
                  style={{ height: `${calculatePercentage(claimDetails.unverifiableVotes)}%` }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${majorityVote === "unverifiable" ? "text-yellow-500 font-semibold" : "text-[#808191]"}`}>
                {capitalizeFirstLetter("unverifiable")} ({calculatePercentage(claimDetails.unverifiableVotes).toFixed(1)}%)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                <div 
                  className={`absolute bottom-0 w-full ${getVoteColor("misleading")} rounded-t transition-all duration-300`} 
                  style={{ height: `${calculatePercentage(claimDetails.misleadingVotes)}%` }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${majorityVote === "misleading" ? "text-blue-500 font-semibold" : "text-[#808191]"}`}>
                {capitalizeFirstLetter("misleading")} ({calculatePercentage(claimDetails.misleadingVotes).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClick}
          className="mt-6 w-full bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-4 py-2 rounded-xl hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-medium shadow-lg"
        >
          View Claim
        </button>
      </div>
    </div>
  );
});

CampaignCard.displayName = 'CampaignCard';

export default CampaignCard;
