"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { client } from "../../client";
import { sepolia } from "thirdweb/chains";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import Image from 'next/image';
import thirdwebIcon from "@public/thirdweb.svg";
import { TrustNetsFactory } from '../../constants/contracts';
import LoadingContent from "../../components/LoadingContent";

const getLevelName = (claims: readonly any[], votes: readonly any[]) => {
  const totalContributions = claims.length + votes.length;
  const levels = [
    { name: "Novice", icon: "/Novice.svg" },
    { name: "Apprentice", icon: "/Apprentice.svg" },
    { name: "Expert", icon: "/Expert.svg" },
    { name: "Master", icon: "/Master.svg" },
    { name: "Grandmaster", icon: "/Grandmaster.svg" }
  ];

  if (totalContributions < 5) return levels[0];
  if (totalContributions < 20) return levels[1];
  if (totalContributions < 50) return levels[2];
  if (totalContributions < 100) return levels[3];
  return levels[4];
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

const ClaimDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const account = useActiveAccount();
  const id = params.id as string;
  const [voteType, setVoteType] = useState('valid');
  const stakeAmount = BigInt("25000000000000000"); // 0.025 ETH in wei
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });
  const [showFireworks, setShowFireworks] = useState(false);
  const [creatorLevel, setCreatorLevel] = useState({ name: "Novice", icon: "/Novice.svg" });
  const [creatorAddress, setCreatorAddress] = useState<string>('');

  useEffect(() => {
    console.log('Current creatorLevel object:', creatorLevel);
  }, [creatorLevel]);

  const isValidImageUrl = (url: string): boolean => {
    if (!url || url === "N/A") return false;
    return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://");
  };

  const claimContract = getContract({
    client: client,
    chain: sepolia,
    address: id,
  });

  const { data: details, isPending } = useReadContract({
    contract: claimContract,
    method: "function getClaimDetails(uint256) view returns (string title, string description, string image, string source, string category, address owner, uint256 validVotes, uint256 invalidVotes, uint256 unverifiableVotes, uint256 misleadingVotes, uint256 creationTime)",
    params: [0n],
  });

  const { data: hasVoted, isPending: isCheckingVote, refetch: refetchHasVoted } = useReadContract({
    contract: claimContract,
    method: "function hasVoted(uint256, address) view returns (bool)",
    params: [0n, account?.address || '0x0000000000000000000000000000000000000000'],
    queryOptions: { enabled: !!account }
  });

  const { mutate: sendTransaction, isPending: isSendingTransaction, error: transactionError } = useSendTransaction();

  const factoryContract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory
  });

  const { data: userClaims } = useReadContract({
    contract: factoryContract,
    method: "function getUserClaims(address) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || '0x0000000000000000000000000000000000000000'],
  });

  const { data: allClaims } = useReadContract({
    contract: factoryContract,
    method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [],
  });

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const data = await readContract({
          contract: factoryContract,
          method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
          params: [],
        });

        const claim = data.find((claim: any) => claim.claimAddress === id);
        if (claim) {
          setCreatorAddress(claim.owner);
          
          const creatorClaims = data.filter((c: any) => c.owner === claim.owner);
          const level = getLevelName(creatorClaims, []);
          setCreatorLevel(level);
        }
      } catch (error) {
        console.error("Error fetching creator data:", error);
      }
    };

    fetchCreatorData();
  }, [id]);

  useEffect(() => {
    if (!isSendingTransaction && (notification.show && notification.type === 'success' || transactionError)) {
      refetchHasVoted();
    }
  }, [isSendingTransaction, notification.show, notification.type, transactionError, refetchHasVoted]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    if (type === 'success') {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000);
    }
    setTimeout(() => {
      setNotification({ type, message: '', show: false });
    }, 5000);
  };

  const voteOptions = [
    { type: 'valid', label: 'Valid' },
    { type: 'invalid', label: 'Invalid' },
    { type: 'unverifiable', label: 'Unverifiable' },
    { type: 'misleading', label: 'Misleading' },
  ];

  const handleVote = async () => {
    console.log("handleVote called");
    console.log("account:", account);
    console.log("hasVoted:", hasVoted);
    console.log("isCheckingVote:", isCheckingVote);
    console.log("isSendingTransaction:", isSendingTransaction);

    if (!account) {
      showNotification('error', '🔒 Connect your wallet to cast your vote!');
      return;
    }

    if (isCheckingVote || isSendingTransaction) {
      console.log("Vote attempt ignored: isCheckingVote or isSendingTransaction is true");
      return;
    }

    if (hasVoted) {
      console.log("User has already voted.");
      showNotification('info', '🎯 You\'ve already cast your vote on this claim!');
      return;
    }
    
    console.log("Proceeding with vote transaction.");
    setIsLoading(true);
    try {
      const transaction = prepareContractCall({
        contract: claimContract,
        method: "function voteOnClaim(uint256 _id, string _voteType) payable",
        params: [0n, voteType],
        value: stakeAmount,
      });
      
      await sendTransaction(transaction);
      
      showNotification('success', '🎉 Vote cast successfully! Your voice matters in building trust!');
      
    } catch (error) {
      console.error("Error voting:", error);
      const errorMessage = (error as any).message || 'Oops! Something went wrong. Please try again.';
      showNotification('error', `❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return <LoadingContent />;
  }

  if (!details) {
    return <div className="text-center text-white mt-10">No claim details found.</div>;
  }

  const [title, description, image, source, category, owner, validVotes, invalidVotes, unverifiableVotes, misleadingVotes, creationTime] = details;
  const totalVotes = Number(validVotes) + Number(invalidVotes) + Number(unverifiableVotes) + Number(misleadingVotes);

  const determineMajorityVote = () => {
    const validVotesNum = Number(validVotes);
    const invalidVotesNum = Number(invalidVotes);
    const unverifiableVotesNum = Number(unverifiableVotes);
    const misleadingVotesNum = Number(misleadingVotes);
    
    const maxVotes = Math.max(validVotesNum, invalidVotesNum, unverifiableVotesNum, misleadingVotesNum);
    const majorityThreshold = totalVotes / 2;

    if (maxVotes <= majorityThreshold) return "no majority";
    
    if (validVotesNum === maxVotes) return "valid";
    if (invalidVotesNum === maxVotes) return "invalid";
    if (unverifiableVotesNum === maxVotes) return "unverifiable";
    if (misleadingVotesNum === maxVotes) return "misleading";
    
    return "no majority";
  };

  const majorityVote = determineMajorityVote();

  const calculatePercentage = (votes: bigint) => {
    return totalVotes > 0 ? (Number(votes) / totalVotes) * 100 : 0;
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const descriptionParagraphs = description ? description.split('\\n').map((paragraph, index) => (
    <p key={index} className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify mb-4 last:mb-0">
      {paragraph}
    </p>
  )) : null;

  const getVoteGlassColor = (voteType: "valid" | "invalid" | "unverifiable" | "misleading", isSelected: boolean) => {
    switch (voteType) {
      case "valid":
        return isSelected ? "bg-green-500/30 border-green-500/50" : "bg-white/5 border-white/10 hover:bg-white/10";
      case "invalid":
        return isSelected ? "bg-red-500/30 border-red-500/50" : "bg-white/5 border-white/10 hover:bg-white/10";
      case "unverifiable":
        return isSelected ? "bg-yellow-500/30 border-yellow-500/50" : "bg-white/5 border-white/10 hover:bg-white/10";
      case "misleading":
        return isSelected ? "bg-blue-500/30 border-blue-500/50" : "bg-white/5 border-white/10 hover:bg-white/10";
      default:
        return "bg-white/5 border-white/10 hover:bg-white/10";
    }
  };

  return (
    <div className="container mx-auto px-4 text-white mt-20">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingContent />
        </div>
      )}

      {showFireworks && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 10}%`,
                backgroundColor: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#800080', '#ffa500', '#008000'][i % 8],
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transform transition-all duration-500 ${
          notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex flex-col items-center space-y-4">
            <span className="text-4xl animate-bounce">
              {notification.type === 'success' ? '🎉' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <p className="text-white text-xl font-medium text-center max-w-md">
              {notification.message}
            </p>
            {notification.type === 'success' && (
              <div className="mt-4 text-sm text-white/80 text-center">
                Thank you for contributing to the community!
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>

        <div className="bg-[#1c1c24] rounded-xl p-6 mb-8">
          <div className="relative w-full h-[410px] rounded-xl overflow-hidden mb-6">
            {!isValidImageUrl(image) || imageError ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-[#2c2c34]">
                <div className="text-[#808191]">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0H9m3 0h2m-3 3v2m0 0h2m-2 0H9" />
                  </svg>
                  <p className="text-sm font-medium">Image Protected</p>
                  <p className="text-xs mt-1">This source has privacy protections enabled</p>
                </div>
              </div>
            ) : (
              <ImageErrorBoundary
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-[#2c2c34]">
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
                  src={image} 
                  alt={title} 
                  fill 
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </ImageErrorBoundary>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
              <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Valid Votes</h4>
              <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">{Number(validVotes)}</p>
            </div>
            <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
              <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Invalid Votes</h4>
              <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">{Number(invalidVotes)}</p>
            </div>
            <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
              <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Unverifiable</h4>
              <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">{Number(unverifiableVotes)}</p>
            </div>
            <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
              <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Misleading</h4>
              <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">{Number(misleadingVotes)}</p>
            </div>
            <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
              <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Total Votes</h4>
              <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">{totalVotes}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[12px] mb-8">
            <div className="flex space-x-2">
              <div className="flex flex-col items-center">
                <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                  <div 
                    className={`absolute bottom-0 w-full ${getVoteGlassColor("valid", voteType === "valid")} rounded-t transition-all duration-300`} 
                    style={{ height: `${calculatePercentage(validVotes)}%` }}
                  ></div>
                </div>
                <span className={`text-xs mt-2 ${majorityVote === "valid" ? "text-green-500 font-semibold" : "text-[#808191]"}`}>
                  Valid ({calculatePercentage(validVotes).toFixed(1)}%)
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                  <div 
                    className={`absolute bottom-0 w-full ${getVoteGlassColor("invalid", voteType === "invalid")} rounded-t transition-all duration-300`} 
                    style={{ height: `${calculatePercentage(invalidVotes)}%` }}
                  ></div>
                </div>
                <span className={`text-xs mt-2 ${majorityVote === "invalid" ? "text-red-500 font-semibold" : "text-[#808191]"}`}>
                  Invalid ({calculatePercentage(invalidVotes).toFixed(1)}%)
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                  <div 
                    className={`absolute bottom-0 w-full ${getVoteGlassColor("unverifiable", voteType === "unverifiable")} rounded-t transition-all duration-300`} 
                    style={{ height: `${calculatePercentage(unverifiableVotes)}%` }}
                  ></div>
                </div>
                <span className={`text-xs mt-2 ${majorityVote === "unverifiable" ? "text-yellow-500 font-semibold" : "text-[#808191]"}`}>
                  Unverifiable ({calculatePercentage(unverifiableVotes).toFixed(1)}%)
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-8 h-24 bg-gray-800 rounded-t">
                  <div 
                    className={`absolute bottom-0 w-full ${getVoteGlassColor("misleading", voteType === "misleading")} rounded-t transition-all duration-300`} 
                    style={{ height: `${calculatePercentage(misleadingVotes)}%` }}
                  ></div>
                </div>
                <span className={`text-xs mt-2 ${majorityVote === "misleading" ? "text-blue-500 font-semibold" : "text-[#808191]"}`}>
                  Misleading ({calculatePercentage(misleadingVotes).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#2c2c34] p-4 rounded-[10px] text-center">
            <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Majority Vote</h4>
            <p className={`mt-[4px] font-epilogue font-semibold text-[20px] ${
              majorityVote === "valid" ? "text-green-500" :
              majorityVote === "invalid" ? "text-red-500" :
              majorityVote === "unverifiable" ? "text-yellow-500" :
              majorityVote === "misleading" ? "text-blue-500" :
              "text-[#808191]"
            }`}>
              {majorityVote === "no majority" ? "No Majority" : capitalizeFirstLetter(majorityVote)}
            </p>
            <p className="text-sm text-[#808191] mt-2">
              {majorityVote === "no majority" 
                ? "No clear majority yet" 
                : `${calculatePercentage(
                    majorityVote === "valid" ? validVotes :
                    majorityVote === "invalid" ? invalidVotes :
                    majorityVote === "unverifiable" ? unverifiableVotes :
                    misleadingVotes
                  ).toFixed(1)}% of total votes`}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1c1c24] rounded-xl p-6">
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Creator</h4>
              <div className="flex flex-row items-center flex-wrap gap-[14px]">
                <div 
                  className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/creator/${creatorAddress}`)}
                >
                  <Image 
                    src={creatorLevel.icon}
                    alt={`${creatorLevel.name} Level Icon`} 
                    width={48} 
                    height={48} 
                    className="object-contain w-full h-full p-1"
                  />
                </div>
                <div>
                  <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">Creator: {creatorAddress}</h4>
                  <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]">
                    Category: {category}
                  </p>
                  <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]">
                    Contract: {id}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#1c1c24] rounded-xl p-6">
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Description</h4>
              {descriptionParagraphs}
            </div>

            <div className="bg-[#1c1c24] rounded-xl p-6">
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Source</h4>
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] break-all">{source}</p>
            </div>

            <div className="bg-[#1c1c24] rounded-xl p-6">
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Analytics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2c2c34] p-4 rounded-[10px]">
                  <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Vote Confidence</h4>
                  <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">
                    {majorityVote !== "no majority" 
                      ? `${(Math.max(
                          calculatePercentage(validVotes),
                          calculatePercentage(invalidVotes),
                          calculatePercentage(unverifiableVotes),
                          calculatePercentage(misleadingVotes)
                        )).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-[#2c2c34] p-4 rounded-[10px]">
                  <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Creator Level</h4>
                  <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">
                    {creatorLevel.name}
                  </p>
                </div>
                <div className="bg-[#2c2c34] p-4 rounded-[10px]">
                  <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Vote Distribution</h4>
                  <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">
                    {majorityVote === "no majority" ? "Balanced" : "Skewed"}
                  </p>
                </div>
                <div className="bg-[#2c2c34] p-4 rounded-[10px]">
                  <h4 className="font-epilogue font-semibold text-[14px] text-[#808191]">Voting Power</h4>
                  <p className="mt-[4px] font-epilogue font-semibold text-[20px] text-white">
                    {(totalVotes * 0.025).toFixed(2)} ETH
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#1c1c24] rounded-xl p-6 sticky top-24">
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Vote</h4>   
              <div className="flex flex-col">
                <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[#808191] mb-6">
                  {hasVoted ? 'You\'ve already voted!' : 'Cast your vote'}
                </p>
                
                <div className={`grid grid-cols-2 gap-4 mb-4 ${hasVoted ? 'opacity-50 pointer-events-none' : ''}`}>
                  {voteOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setVoteType(option.type)}
                      disabled={hasVoted || isCheckingVote || isSendingTransaction}
                      className={`p-4 rounded-xl text-center transition-all duration-200 border backdrop-blur-md 
                        ${getVoteGlassColor(option.type as any, voteType === option.type)}
                        ${hasVoted || isCheckingVote || isSendingTransaction ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span className="font-epilogue font-semibold text-[14px]">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-[#13131a] rounded-[10px]">
                  <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">Vote with 0.025 ETH</h4>
                  <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">
                    {hasVoted 
                      ? 'Thank you for contributing to the community!'
                      : 'Your vote helps maintain the integrity of the platform.'}
                  </p>
                </div>

                <button
                  onClick={handleVote}
                  disabled={hasVoted || isCheckingVote || isSendingTransaction}
                  className={`w-full bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-2 rounded-xl transition-all duration-300 font-medium shadow-lg mt-4 ${
                    hasVoted || isCheckingVote || isSendingTransaction
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-[#a8e01d] hover:to-[#c6ff20]'
                  }`}
                >
                  {isSendingTransaction ? 'Voting...' : hasVoted ? 'Vote Cast ✓' : 'Cast Vote'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetailsPage; 
