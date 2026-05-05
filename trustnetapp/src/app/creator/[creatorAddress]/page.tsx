"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useReadContract } from "thirdweb/react";
import { client } from "../../client";
import { sepolia } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import Image from 'next/image';
import { TrustNetsFactory } from '../../constants/contracts';
import LoadingContent from "../../components/LoadingContent";

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const getLevel = (claimsCreated: number) => {
  if (claimsCreated >= 100) return { name: 'Grandmaster', icon: 'Grandmaster.png' };
  if (claimsCreated >= 50) return { name: 'Master', icon: 'Master.png' };
  if (claimsCreated >= 20) return { name: 'Expert', icon: 'Expert.png' };
  if (claimsCreated >= 5) return { name: 'Apprentice', icon: 'Apprentice.png' };
  return { name: 'Novice', icon: 'Novice.png' };
};

const getBadges = (claims: readonly Claim[], votes: readonly any[]) => {
  const badges = [];

  if (claims.length >= 1) badges.push("First Contributor");
  if (claims.length > 3) badges.push("Active Creator");
  if (claims.length > 7) badges.push("Prolific Creator");
  if (claims.length > 15) badges.push("Claim Master");

  return badges;
};

const CreatorProfilePage = () => {
  const params = useParams();
  const creatorAddress = params.creatorAddress as string;

  const [creatorClaims, setCreatorClaims] = useState<Claim[]>([]);
  const [creatorVotes, setCreatorVotes] = useState<any[]>([]); // Placeholder for votes
  const [creatorLevel, setCreatorLevel] = useState({ name: "Novice", icon: "Novice.png" });
  const [creatorBadges, setCreatorBadges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const factoryContract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory
  });

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!creatorAddress) {
        console.log("Creator address not available yet.");
        setIsLoading(false); // Ensure loading is set to false if address is missing
        return;
      }
      setIsLoading(true);
      console.log("Fetching data for creator:", creatorAddress);
      try {
        // Fetch all claims and filter by creator address
        const allClaims = await readContract({
          contract: factoryContract,
          method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
          params: [],
        });

        console.log("All claims fetched:", allClaims);

        const claimsCreatedByCreator = allClaims.filter((claim: any) => claim.owner === creatorAddress);
        console.log("Claims created by creator:", claimsCreatedByCreator);

        setCreatorClaims(claimsCreatedByCreator);

        // TODO: Fetch creator's votes (this requires contract interaction not available in readContract)
        const votesByCreator: any[] = []; // Placeholder
        setCreatorVotes(votesByCreator);

        // Calculate level and badges
        const level = getLevel(claimsCreatedByCreator.length);
        console.log("Calculated level:", level);
        setCreatorLevel(level);
        const badges = getBadges(claimsCreatedByCreator, votesByCreator);
        console.log("Calculated badges:", badges);
        setCreatorBadges(badges);

      } catch (error) {
        console.error("Error fetching creator profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorAddress]);

  if (isLoading) {
    return <LoadingContent />;
  }

  if (!creatorAddress) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Creator address not provided.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 text-white mt-20">
      <div className="bg-[#1c1c24] rounded-xl p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">Creator Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#2c2f32] flex items-center justify-center">
             {console.log('Creator Profile Page Icon Source:', creatorLevel.icon)}
             <Image 
                src={`/${creatorLevel.icon}`}
                alt={`${creatorLevel.name} Level Icon`} 
                width={48} 
                height={48} 
                className="rounded-full"
              />
          </div>
          <div>
            <h2 className="text-xl font-semibold break-all">Address: {creatorAddress}</h2>
            <p className="text-[#808191] mt-1">Level: {creatorLevel.name}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Badges:</h3>
          <div className="flex flex-wrap gap-2">
            {creatorBadges.length > 0 ? (
              creatorBadges.map((badge, index) => (
                <span key={index} className="bg-[#c6ff20]/20 text-[#c6ff20] px-3 py-1 rounded-full text-sm">
                  {badge}
                </span>
              ))
            ) : (
              <span className="text-[#808191] text-sm">No badges yet.</span>
            )}
          </div>
        </div>

        {/* You can add sections for created claims, votes, etc. here */}

      </div>
    </div>
  );
};

export default CreatorProfilePage; 