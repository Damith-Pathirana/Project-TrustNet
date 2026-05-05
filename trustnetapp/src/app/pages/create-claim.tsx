'use client'

import React, { useState } from 'react';
import { useSendTransaction } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract, prepareContractCall } from "thirdweb";
import { useRouter } from 'next/navigation';

const predefinedCategories = [
  "Geo Politics",
  "Sports",
  "Business",
  "Innovation",
  "Culture",
  "Arts",
  "Travel",
  "Weather",
  "Conspiracy"
];

const CreateClaimForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState(predefinedCategories[0]);
  const router = useRouter();

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: "YOUR_CONTRACT_ADDRESS", // Replace with your contract address
  });

  const { mutate: sendTransaction } = useSendTransaction();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prepare the contract call
    const transaction = prepareContractCall({
      contract,
      method: "function createClaim(string, string, string, string, string)",
      params: [title, description, image, source, category],
    });

    try {
      // Send the transaction and wait for it to complete
      await sendTransaction(transaction);
      
      // Redirect to home page after successful submission
      router.push('/');
    } catch (error) {
      console.error("Error creating claim:", error);
      alert("Failed to create claim. Please try again."); // Basic error notification
    }
  };

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Create a New Claim</h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full mt-[65px] flex flex-col gap-[30px]">
        <div className="flex flex-wrap gap-[40px]">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
              required
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-300">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            required
          />
        </div>

        <div className="flex flex-wrap gap-[40px]">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300">Image URL *</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
              placeholder="Enter the URL of the image"
              required
            />
            <p className="text-xs text-gray-500 mt-1">To get an image URL, upload your image to an image hosting service and copy the direct link.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-[40px]">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300">Source *</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
              required
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-300">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            required
          >
            {predefinedCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center items-center mt-[40px]">
          <button
            type="submit"
            className="w-full bg-[#1dc071] hover:bg-[#1dc071cc] text-white font-bold py-2 px-4 rounded"
          >
            Create Claim
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClaimForm;
