'use client';

import React, { useState } from 'react';
import { useSendTransaction } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract, prepareContractCall } from "thirdweb";
import { useRouter } from 'next/navigation';
import { TrustNetsFactory } from '../constants/contracts';
import LoadingContent from "../components/LoadingContent";
import { getSanitizedImageUrl, getSanitizedSourceUrl } from '../utils/contentFilter';

const predefinedCategories = [
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

const CreateClaimPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState(predefinedCategories[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    show: boolean;
  }>({ type: 'success', message: '', show: false });

  const router = useRouter();

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification({ type, message: '', show: false });
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sanitize the image URL and source URL before creating the claim
      const sanitizedImageUrl = getSanitizedImageUrl(image, title, description);
      const sanitizedSourceUrl = getSanitizedSourceUrl(source, title, description);

      // Prepare the contract call with the correct method name
      const transaction = prepareContractCall({
        contract,
        method: "function createClaimInstance(string _title, string _description, string _image, string _source, string _category)",
        params: [title, description, sanitizedImageUrl, sanitizedSourceUrl, category],
      });

      // Send the transaction and wait for it to complete
      await sendTransaction(transaction);
      
      // Show success notification
      showNotification('success', '🎉 Claim created successfully!');

      // Redirect to home page after a delay for the user to see the notification
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      console.error("Error creating claim:", error);
      // Show error notification
      const errorMessage = (error as any).message || 'Failed to create claim. Please try again.';
      showNotification('error', `❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingContent />
        </div>
      )}

      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transform transition-all duration-500 ${
          notification.type === 'success' ? 'bg-green-500' :
          'bg-red-500'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{notification.type === 'success' ? '🎉' : '❌'}</span>
            <p className="text-white font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-[10px] sm:p-10 p-4 border border-white/10 shadow-lg w-full max-w-2xl mx-auto">
        <div className="flex justify-center items-center p-[16px] bg-white/10 rounded-[10px] mb-8">
          <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Create a New Claim</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[20px]">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white shadow-sm focus:border-[#c6ff20] focus:ring-[#c6ff20] p-2"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white shadow-sm focus:border-[#c6ff20] focus:ring-[#c6ff20] p-2 h-32"
              required
            />
             <p className="text-xs text-gray-400 mt-1">Use newline characters (Enter key) to create paragraphs.</p>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">Image URL *</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white shadow-sm focus:border-[#c6ff20] focus:ring-[#c6ff20] p-2"
              placeholder="Enter the URL of the image"
              required
            />
            <p className="text-xs text-gray-400 mt-1">To get an image URL, upload your image to an image hosting service and copy the direct link.</p>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">Source *</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 block w-full rounded-md bg-white/5 border border-white/10 text-white shadow-sm focus:border-[#c6ff20] focus:ring-[#c6ff20] p-2"
              placeholder="Enter any source URL, website, or reference"
              required
            />
            <p className="text-xs text-gray-400 mt-1">You can add any source - news websites, social media, documents, or any other reference. Blocked sites will be filtered out.</p>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {predefinedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button" // Important to prevent form submission
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-md text-center transition-all duration-200 border 
                    ${category === cat 
                      ? 'bg-[#c6ff20]/20 border-[#c6ff20]/50 backdrop-blur-sm text-white' 
                      : 'bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 text-gray-300 hover:text-white'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center mt-[30px]">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-3 rounded-xl hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-bold shadow-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating Claim...' : 'Create Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClaimPage; 