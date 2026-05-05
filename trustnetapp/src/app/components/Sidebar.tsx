"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from "@public/Logo.png";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";
import Tutorial from './Tutorial';

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const getLevel = (claimCount: number) => {
  if (claimCount >= 10) return { name: 'Guru', icon: 'Guru.png' };
  if (claimCount >= 5) return { name: 'Expert', icon: 'Expert.png' };
  if (claimCount >= 2) return { name: 'Advanced', icon: 'Advanced.png' };
  if (claimCount >= 1) return { name: 'Intermediate', icon: 'Intermediate.png' };
  return { name: 'Novice', icon: 'Novice.png' };
};

interface IconProps {
  styles?: string;
  name: string;
  imgUrl: any;
  isActive?: string;
  disabled?: boolean;
  handleClick?: () => void;
}

const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick }: IconProps) => {
  // Determine if this is a leaderboard or feed icon
  const isSpecialIcon = name === 'leaderboard' || name === 'feed';
  
  return (
    <div
      className={`${isSpecialIcon ? 'w-[56px] h-[56px]' : 'w-[48px] h-[48px]'} rounded-[10px] ${
        isActive === name ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'hover:bg-white/5'
      } flex justify-center items-center ${!disabled ? 'cursor-pointer' : ''} ${styles} transition-all duration-300`}
      onClick={handleClick}
    >
      <Image
        src={imgUrl}
        alt="icon"
        width={isSpecialIcon ? 32 : 24}
        height={isSpecialIcon ? 32 : 24}
        className={`${isActive !== name ? 'opacity-60 hover:opacity-100 brightness-0 invert' : 'brightness-0 invert'} transition-opacity duration-300`}
      />
    </div>
  );
};

const Sidebar = () => {
  const router = useRouter();
  const [isActive, setIsActive] = useState('dashboard');
  const account = useActiveAccount();
  const [profileIcon, setProfileIcon] = useState('/profile.png'); // Default profile icon
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Check if user has seen the tutorial
  useEffect(() => {
    if (account?.address) {
      const tutorialSeen = localStorage.getItem(`tutorial_seen_${account.address}`);
      setHasSeenTutorial(!!tutorialSeen);
    }
  }, [account?.address]);

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  const { data: userClaims } = useReadContract({
    contract,
    method: "function getUserClaims(address _user) view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!account?.address },
  });

  useEffect(() => {
    if (userClaims !== undefined) {
      const level = getLevel(userClaims.length);
      setProfileIcon(`/${level.icon}`); // Update profile icon based on level
    } else {
      setProfileIcon('/profile.png'); // Revert to default if no account/claims
    }
  }, [userClaims, account?.address]);

  useEffect(() => {
    if (account?.address && !hasSeenTutorial && userClaims && userClaims.length === 0) {
      setIsTutorialOpen(true);
    }
  }, [account?.address, hasSeenTutorial, userClaims]);

  const handleTutorialClose = () => {
    setIsTutorialOpen(false);
    if (account?.address) {
      localStorage.setItem(`tutorial_seen_${account.address}`, 'true');
      setHasSeenTutorial(true);
    }
  };

  const navlinks = [
    {
      name: 'dashboard',
      imgUrl: '/dashboard.png',
      link: '/',
      disabled: false,
    },
    {
      name: 'feed',
      imgUrl: '/feed.png',
      link: '/feed',
      disabled: false,
    },
    {
      name: 'my-claims',
      imgUrl: '/myclaim.png',
      link: '/my-claims',
      disabled: false,
    },
    {
      name: 'about',
      imgUrl: '/dashboard.png',
      link: '/about',
      disabled: false,
    },
    {
      name: 'leaderboard',
      imgUrl: '/leadboard.png',
      link: '/leaderboard',
      disabled: false,
    },
    {
      name: 'profile',
      imgUrl: '/profile.png',
      link: '/profile',
      disabled: false,
    },
  ];

  return (
    <>
      <Tutorial isOpen={isTutorialOpen} onClose={handleTutorialClose} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
      >
        <svg 
          className="w-6 h-6 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          )}
        </svg>
      </button>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-40 w-[76px] bg-white/5 backdrop-blur-md border-r border-white/10 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center h-full py-4">
          <Link href="/" className="mb-8">
            <div className="w-[52px] h-[52px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
              <Image src={Logo} alt="home" width={32} height={32} className="filter drop-shadow-lg" />
            </div>
          </Link>

          <div className="flex-1 flex flex-col justify-evenly items-center">
            <div className="flex flex-col justify-center items-center gap-3">
              {navlinks.map((link) => (
                <Icon
                  key={link.name}
                  {...link}
                  isActive={isActive}
                  handleClick={() => {
                    if (!link.disabled) {
                      setIsActive(link.name);
                      router.push(link.link);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Tutorial Button */}
              <div
                onClick={() => setIsTutorialOpen(true)}
                className="w-[48px] h-[48px] rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 flex justify-center items-center cursor-pointer hover:bg-white/10 transition-all duration-300"
              >
                <svg 
                  className="w-6 h-6 text-white opacity-60 hover:opacity-100" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex justify-between items-center flex-col sticky top-5 h-[calc(100vh-500px)] ml-[20px] mb-[250px]">
        <Link href="/">
          <div className="w-[52px] h-[52px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
            <Image src={Logo} alt="home" width={32} height={32} className="filter drop-shadow-lg" />
          </div>
        </Link>

        <div className="flex-1 flex flex-col justify-evenly items-center bg-white/5 backdrop-blur-md rounded-[20px] w-[76px] py-4 mt-12 border border-white/10 shadow-lg">
          <div className="flex flex-col justify-center items-center gap-3">
            {navlinks.map((link) => (
              <Icon
                key={link.name}
                {...link}
                isActive={isActive}
                handleClick={() => {
                  if (!link.disabled) {
                    setIsActive(link.name);
                    router.push(link.link);
                  }
                }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {/* Tutorial Button */}
            <div
              onClick={() => setIsTutorialOpen(true)}
              className="w-[48px] h-[48px] rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 flex justify-center items-center cursor-pointer hover:bg-white/10 transition-all duration-300"
            >
              <svg 
                className="w-6 h-6 text-white opacity-60 hover:opacity-100" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
