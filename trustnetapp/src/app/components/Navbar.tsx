'use client';
import { client } from "@/app/client";
import Link from "next/link";
import { ConnectButton, lightTheme, useActiveAccount } from "thirdweb/react";
import Image from 'next/image';
import Logo from "@public/Logo.png";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';
import FaucetWidget from './FaucetWidget';

const Navbar = () => {
    const account = useActiveAccount();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showFaucetDropdown, setShowFaucetDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowFaucetDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="bg-transparent text-white relative z-50">
            {/* Notification Banner */}
            <div className="w-full bg-[#23232b] border-b border-[#c6ff20]/40 text-[#c6ff20] text-center text-xs py-2 px-4 font-medium shadow-md">
                TrustNet is a community-driven platform. We do not guarantee the truth or falsity of any claim or vote. The final decision to believe or not is yours. This is a transparent, reliable, and decentralized fact-checking solution.
            </div>
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
                            <Image
                                src={Logo}
                                alt="TrustNet Logo"
                                width={32}
                                height={32}
                                className="filter drop-shadow-lg"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">
                                TrustNet
                            </span>
                            <span className="text-xs text-white/60">Decentralized Fact-Checking</span>
                        </div>
                    </div>

                    {/* Search Bar - Centered */}
                    <div className="hidden md:block flex-1 max-w-2xl mx-8">
                        <SearchBar />
                    </div>

                    {/* Connect and Create Claim */}
                    <div className="flex items-center space-x-4">
                        {account ? (
                            <>
                                <button
                                    onClick={() => router.push('/create-claim')}
                                    className="hidden md:block bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-2 rounded-xl hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-medium shadow-lg"
                                >
                                    Create Claim
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFaucetDropdown(!showFaucetDropdown)}
                                        className="hidden md:block bg-[#2c2c34] text-white px-4 py-2 rounded-xl hover:bg-[#3c3c44] transition-all duration-300 font-medium border border-[#3c3c44] hover:border-[#c6ff20]"
                                    >
                                        🚰 Faucet
                                    </button>
                                    {showFaucetDropdown && (
                                        <div className="absolute top-full right-0 mt-2 w-80 z-50" ref={dropdownRef}>
                                            <FaucetWidget compact={true} />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                        <ConnectButton 
                            client={client}
                            theme={lightTheme({
                                colors: {
                                    accentButtonBg: '#c6ff20',
                                    accentButtonText: '#000000',
                                }
                            })} 
                        />
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                        >
                            <svg 
                                className="w-6 h-6" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
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
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 p-4 bg-[#1c1c24] rounded-xl border border-white/10">
                        <div className="space-y-4">
                            {/* Mobile Search Bar */}
                            <SearchBar />
                            
                            {account && (
                                <>
                                    <button
                                        onClick={() => {
                                            router.push('/create-claim');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-2 rounded-xl hover:from-[#a8e01d] hover:to-[#c6ff20] transition-all duration-300 font-medium shadow-lg"
                                    >
                                        Create Claim
                                    </button>
                                    <div className="w-full">
                                        <FaucetWidget compact={true} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
