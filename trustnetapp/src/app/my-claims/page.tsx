"use client";

import { useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";
import CampaignCard from "../components/Campaigncard";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingContent from "../components/LoadingContent";
import { prepareContractCall, sendTransaction } from "thirdweb";

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

export default function MyClaims() {
  const account = useActiveAccount();
  const router = useRouter();
  const [userClaims, setUserClaims] = useState<readonly Claim[]>([]);
  const [distributingId, setDistributingId] = useState<string | null>(null);
  const [distributionStatus, setDistributionStatus] = useState<string>("");

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  // Fetch user's created claims
  const { data: claims, isPending, error } = useReadContract({
    contract,
    method: "function getUserClaims(address _user) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!account?.address },
  });

  useEffect(() => {
    if (claims) {
      setUserClaims(claims);
    }
  }, [claims]);

  const handleDistributeRewards = async (claimAddress: string) => {
    setDistributingId(claimAddress);
    setDistributionStatus("");
    try {
      // Get the TrustNet claim contract instance
      const contract = getContract({
        client: client,
        chain: sepolia,
        address: claimAddress,
      });
      // Prepare the transaction to call distributeRewards(0)
      const transaction = await prepareContractCall({
        contract,
        method: "function distributeRewards(uint256 _id)",
        params: [0], // Always 0 for single-claim contracts
      });
      // Send the transaction from the user's account
      await sendTransaction({
        transaction,
        account: account?.address,
      });
      setDistributionStatus("success");
    } catch (error) {
      setDistributionStatus("error");
    } finally {
      setDistributingId(null);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-[#808191] mb-6">Please connect your wallet to view your claims</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#c6ff20] text-black px-6 py-2 rounded-xl hover:bg-[#a8e01d] transition-all duration-300 font-medium"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (isPending) {
    return <LoadingContent />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Error Loading Claims</h2>
        <p className="text-[#808191] mb-6">There was an error loading your claims. Please try again later.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#c6ff20] text-black px-6 py-2 rounded-xl hover:bg-[#a8e01d] transition-all duration-300 font-medium"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <main className="p-4 pb-10 min-h-[100vh] container max-w-screen-lg mx-auto">
      <div className="py-20">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-white">My Claims</h1>
          <button
            onClick={() => router.push('/create-claim')}
            className="bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-2 rounded-xl hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-medium shadow-lg"
          >
            Create New Claim
          </button>
        </div>

        {userClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white">
            <h2 className="text-2xl font-bold mb-4">No Claims Yet</h2>
            <p className="text-[#808191] mb-6">You haven't created any claims yet. Start by creating your first claim!</p>
            <button
              onClick={() => router.push('/create-claim')}
              className="bg-[#c6ff20] text-black px-6 py-2 rounded-xl hover:bg-[#a8e01d] transition-all duration-300 font-medium"
            >
              Create Your First Claim
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userClaims.map((claim, index) => {
              const isOwner = account?.address?.toLowerCase() === claim.owner.toLowerCase();
              const claimAgeSeconds = (Date.now() / 1000) - Number(claim.creationTime);
              const isEligible = isOwner && claimAgeSeconds > 2 * 24 * 60 * 60;
              return (
                <div key={index} className="relative">
                  <CampaignCard 
                    claimAddress={claim.claimAddress}
                    owner={claim.owner}
                    title={claim.title}
                    creationTime={claim.creationTime}
                    category={claim.category}
                  />
                  {isEligible && (
                    <div className="mt-4 p-3 bg-[#23232b] rounded-lg border border-[#c6ff20]/40 flex flex-col items-center relative overflow-hidden">
                      <span className="text-[#c6ff20] font-semibold mb-2">Distribute Rewards</span>
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black rounded-lg font-bold text-base shadow-lg opacity-60 cursor-not-allowed mb-2"
                        disabled
                        style={{ filter: 'blur(0.5px)' }}
                      >
                        Distribute Now
                      </button>
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10">
                        <span className="text-[#c6ff20] text-center font-semibold text-base px-4 py-2 rounded-lg">
                          <svg className="w-6 h-6 inline-block mr-2 align-middle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          This functionality has been <span className="underline">disabled</span> due to beta testing.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
} 