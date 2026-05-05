// pages/claim/[id].tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { client } from "../../client";
import { sepolia } from "thirdweb/chains";
import { getContract, prepareContractCall } from "thirdweb";

const ClaimDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [voteType, setVoteType] = useState('valid');
  const stakeAmount = BigInt("25000000000000000"); // 0.025 ETH in wei

  const claimContract = getContract({
    client: client,
    chain: sepolia,
    address: id as string,
  });

  const { data: details, isPending } = useReadContract({
    contract: claimContract,
    method: "function getClaimDetails(uint256) view returns (string title, string description, string image, string source, string category, address owner, uint256 validVotes, uint256 invalidVotes, uint256 unverifiableVotes, uint256 misleadingVotes)",
    params: [0n],
  });

  const { mutate: sendTransaction } = useSendTransaction();

  const handleVote = () => {
    const transaction = prepareContractCall({
      contract: claimContract,
      method: "function voteOnClaim(uint256 _id, string _voteType) payable",
      params: [0n, voteType],
      value: stakeAmount,
    });
    sendTransaction(transaction);
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!details) {
    return <div>No claim details found.</div>;
  }

  const [title, description, image, source, category, owner, validVotes, invalidVotes, unverifiableVotes, misleadingVotes] = details;

  // Split description into paragraphs
  const descriptionParagraphs = description ? description.split('\\n').map((paragraph, index) => (
    <p key={index} className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify mb-4 last:mb-0">
      {paragraph}
    </p>
  )) : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <img src={image} alt={title} className="w-full h-64 object-cover rounded mb-4" />
      <div className="bg-[#1c1c24] rounded-xl p-6">
        <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase mb-4">Description</h4>
        {descriptionParagraphs}
      </div>
      <p className="text-gray-500 mb-2">Source: {source}</p>
      <p className="text-gray-500 mb-2">Category: {category}</p>
      <p className="text-gray-500 mb-4">Owner: {owner}</p>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Vote</h2>
        <select
          value={voteType}
          onChange={(e) => setVoteType(e.target.value)}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        >
          <option value="valid">Valid</option>
          <option value="invalid">Invalid</option>
          <option value="unverifiable">Unverifiable</option>
          <option value="misleading">Misleading</option>
        </select>
        <button
          onClick={handleVote}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Vote with {stakeAmount} Sepolia ETH
        </button>
      </div>
    </div>
  );
};

export default ClaimDetailsPage;
