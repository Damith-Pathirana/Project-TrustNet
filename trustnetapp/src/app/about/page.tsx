'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Assuming you might want images later
import { useReadContract } from "thirdweb/react";
import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";
import LoadingContent from "../components/LoadingContent"; // Import the new component
import FeedbackForm from '../components/FeedbackForm';
import CacheStatusBar from '../components/CacheStatusBar';
import FaucetIntegration from '../components/FaucetIntegration';
import { serverCache } from '../utils/serverCache';

import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Claim {
  claimAddress: string;
  owner: string;
  title: string;
  creationTime: bigint;
  category: string;
}

const AboutPage = () => {
  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(true);
  const [categoryClaimsCount, setCategoryClaimsCount] = useState<{ [key: string]: number }>({});
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [cacheStatus, setCacheStatus] = useState<'cached' | 'fresh' | 'loading'>('loading');
  const [allClaims, setAllClaims] = useState<any[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  // Add state for analytics
  const [majorityClaims, setMajorityClaims] = useState(0);
  const [activityData, setActivityData] = useState<{ [date: string]: number }>({});

  // Add state for analytics progress
  const [analyticsProgress, setAnalyticsProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const fetchAllClaims = async () => {
      setCacheStatus('loading');
      setIsLoadingClaims(true);
      const cacheKey = 'about_allClaims';
      const cacheInstance = serverCache.getCacheInstance();
      const wasCachedBefore = !!cacheInstance.get(cacheKey);
      const data = await serverCache.get(cacheKey, async () => {
        // Fetch from blockchain
        const contract = getContract({
          client: client,
          chain: sepolia,
          address: TrustNetsFactory,
        });
        const claims = await readContract({
          contract,
          method: "function getAllClaims() view returns ((address claimAddress, address owner, string title, uint256 creationTime, string category)[])",
          params: [],
        });
        return claims;
      });
      const wasCachedAfter = !!cacheInstance.get(cacheKey);
      setAllClaims(Array.isArray(data) ? [...data] : []);
      setCacheStatus(wasCachedBefore || wasCachedAfter ? 'cached' : 'fresh');
      setIsLoadingClaims(false);
    };
    fetchAllClaims();
  }, []);

  useEffect(() => {
    const fetchClaimDetails = async () => {
      if (allClaims && allClaims.length > 0) {
        let votesCount = 0;
        const currentCategoryCounts: { [key: string]: number } = {};
        setAnalyticsProgress({ current: 0, total: allClaims.length });
        let majorityCount = 0;
        const activity: { [date: string]: number } = {};
        const detailPromises = allClaims.map(async (claim: Claim, idx: number) => {
          setAnalyticsProgress({ current: idx + 1, total: allClaims.length });
          const claimContract = getContract({
            client: client,
            chain: sepolia,
            address: claim.claimAddress,
          });
          try {
            const details = await readContract({
              contract: claimContract,
              method: "function getClaimDetails(uint256) view returns (string title, string description, string image, string source, string category, address owner, uint256 validVotes, uint256 invalidVotes, uint256 unverifiableVotes, uint256 misleadingVotes)",
              params: [0n],
            });
            
            // console.log("Claim details for", claim.claimAddress, ":", details); // Keep this for debugging if needed

            // Sum all vote types for this claim
            const valid = details[6] !== undefined ? Number(details[6]) : 0;
            const invalid = details[7] !== undefined ? Number(details[7]) : 0;
            const unverifiable = details[8] !== undefined ? Number(details[8]) : 0;
            const misleading = details[9] !== undefined ? Number(details[9]) : 0;

            votesCount += valid + invalid + unverifiable + misleading;

            // Majority logic
            const totalVotes = valid + invalid + unverifiable + misleading;
            if (
              valid > totalVotes / 2 ||
              invalid > totalVotes / 2 ||
              unverifiable > totalVotes / 2 ||
              misleading > totalVotes / 2
            ) {
              majorityCount++;
            }

            // Activity by date
            const creationTime = claim.creationTime ? new Date(Number(claim.creationTime) * 1000) : null;
            if (creationTime) {
              const dateStr = creationTime.toISOString().split('T')[0];
              activity[dateStr] = (activity[dateStr] || 0) + 1;
            }

            // Safely access category, assuming it's at index 4 and details is an array
            if (details && typeof details[4] === 'string') {
              currentCategoryCounts[details[4]] = (currentCategoryCounts[details[4]] || 0) + 1;
            }

          } catch (error) {
            console.error("Error fetching claim details for claim:", claim.claimAddress, ":", (error as any).message || error);
          }
        });

        await Promise.all(detailPromises);
        setTotalVotes(votesCount);
        setCategoryClaimsCount(currentCategoryCounts);
        setMajorityClaims(majorityCount);
        setActivityData(activity);
        setIsLoadingAnalytics(false);
        setAnalyticsProgress({ current: 0, total: 0 });
      } else if (allClaims && allClaims.length === 0) {
        setTotalVotes(0);
        setCategoryClaimsCount({});
        setIsLoadingAnalytics(false);
        setAnalyticsProgress({ current: 0, total: 0 });
      }
    };

    if (!isLoadingClaims) {
      fetchClaimDetails();
    }
  }, [allClaims, isLoadingClaims]);

  const totalClaims = allClaims?.length || 0;
  
  const chartLabels = Object.keys(categoryClaimsCount);
  const chartData = Object.values(categoryClaimsCount);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Number of Claims',
        data: chartData,
        backgroundColor: 'rgba(198, 255, 32, 0.2)',
        borderColor: 'rgba(198, 255, 32, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        pointLabels: {
          color: '#c6ff20',
          font: {
            size: 14,
          },
        },
        suggestedMin: 0,
        ticks: {
          display: false,
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#808191',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw !== null) {
              label += context.raw;
            }
            return label;
          }
        }
      }
    }
  };

  if (isLoadingClaims || isLoadingAnalytics) {
    return <LoadingContent />;
  }

  return (
    <div className="container mx-auto px-4 py-20 text-white min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1c1c24]">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#c6ff20] to-[#00ff88] text-transparent bg-clip-text">
            About TrustNet
          </h1>
          <p className="text-xl text-[#808191] max-w-2xl mx-auto">
            Empowering truth through decentralized verification and community-driven validation
          </p>
        </div>

        {/* Platform Statistics Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-[#c6ff20] text-center">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#1c1c24] rounded-2xl p-8 flex flex-col items-start justify-center min-w-[250px]">
              <span className="text-2xl font-bold text-white mb-2">Total Claims</span>
              <span className="text-4xl font-extrabold text-[#c6ff20]">{totalClaims}</span>
            </div>
            <div className="bg-[#1c1c24] rounded-2xl p-8 flex flex-col items-start justify-center min-w-[250px]">
              <span className="text-2xl font-bold text-white mb-2">Total Votes Cast</span>
              <span className="text-4xl font-extrabold text-[#c6ff20]">{isLoadingAnalytics && analyticsProgress.total > 0 ? `${analyticsProgress.current}/${analyticsProgress.total}` : totalVotes}</span>
            </div>
            <div className="bg-[#1c1c24] p-6 rounded-xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#c6ff20]/10 col-span-2">
              <h3 className="text-xl font-semibold text-white mb-2">Category Performance</h3>
              <div style={{ height: '300px' }}> {/* Added height for the chart */} 
                <Radar data={data} options={options} />
              </div>
            </div>
          </div>
        </section>
        {/* New cards and bar chart for analytics */}
        <section className="mb-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Majority Claims Card */}
            <div className="bg-[#1c1c24] rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c6ff20] opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#c6ff20] opacity-10 rounded-full -ml-16 -mb-16"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-4">Claims with Majority Consensus</h3>
                <div className="flex items-center justify-between">
                  <div className="text-5xl font-extrabold text-[#c6ff20]">{majorityClaims}</div>
                  <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 border-4 border-[#c6ff20] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-[#c6ff20] rounded-full" 
                         style={{ transform: `rotate(${(majorityClaims / allClaims.length) * 360}deg)` }}></div>
                  </div>
                </div>
                <p className="text-gray-400 mt-4">Claims that have reached a clear majority decision</p>
              </div>
            </div>

            {/* Activity Chart Card */}
            <div className="bg-[#1c1c24] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Daily Activity</h3>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: Object.keys(activityData),
                    datasets: [
                      {
                        label: 'Posts',
                        data: Object.values(activityData),
                        backgroundColor: 'rgba(198, 255, 32, 0.7)',
                        borderRadius: 8,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(28, 28, 36, 0.9)',
                        titleColor: '#c6ff20',
                        bodyColor: '#fff',
                        borderColor: '#c6ff20',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          color: '#c6ff20',
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          color: '#c6ff20',
                          stepSize: 1,
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="mb-16 transform hover:scale-[1.02] transition-transform duration-300">
          <div className="bg-[#1c1c24] p-8 rounded-2xl border border-[#2c2c34] hover:border-[#c6ff20] transition-colors duration-300">
            <h2 className="text-3xl font-semibold mb-6 text-[#c6ff20]">Introduction</h2>
            <p className="text-[#808191] leading-relaxed text-lg">
              Welcome to TrustNet, your go-to platform for verifying and validating claims in a decentralized manner. Our mission is to empower users to contribute to a trustworthy information ecosystem by validating claims and earning rewards.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-[#c6ff20] text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Decentralized Verification",
                description: "Leverage blockchain technology to ensure transparency and trust.",
                icon: "🔗"
              },
              {
                title: "Reward System",
                description: "Earn rewards by participating in the validation process.",
                icon: "💰"
              },
              {
                title: "Community Engagement",
                description: "Join a community of like-minded individuals working towards a common goal of information integrity.",
                icon: "👥"
              },
              {
                title: "User Leveling System",
                description: "Progress through levels (Novice, Apprentice, Expert, Master, Grandmaster) based on your contributions and activity on the platform.",
                icon: "📈"
              },
              {
                title: "Creator Profile Pages",
                description: "View detailed profiles of claim creators, including their contribution level and earned badges.",
                icon: "👤"
              },
              {
                title: "Personalized Recommendations",
                description: "Discover claims tailored to your interests based on the categories you interact with the most.",
                icon: "🎯"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-[#1c1c24] p-6 rounded-xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#c6ff20]/10"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#808191]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-[#c6ff20] text-center">How It Works</h2>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Create or Browse Claims",
                description: "Users can create new claims or browse existing ones. Each claim is categorized and includes details such as title, description, and source."
              },
              {
                step: "02",
                title: "Vote on Claims",
                description: "Participate in the validation process by voting on claims. Users can vote on the validity, accuracy, or misleading nature of a claim."
              },
              {
                step: "03",
                title: "Earn Rewards",
                description: "Earn rewards based on your contributions and the accuracy of your votes. The more you participate, the more you earn."
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="flex items-start gap-6 bg-[#1c1c24] p-8 rounded-2xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="text-4xl font-bold text-[#c6ff20]">{step.step}</div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-[#808191] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started with Sepolia Testnet */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-[#c6ff20] text-center">Getting Started with Sepolia Testnet</h2>
          <FaucetIntegration />
        </section>

        {/* Team Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-[#c6ff20] text-center">Our Team</h2>
          <div className="flex justify-center">
            <div className="bg-[#1c1c24] p-8 rounded-2xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300 transform hover:scale-[1.02] max-w-md w-full">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#c6ff20] to-[#00ff88] rounded-full mb-6 flex items-center justify-center text-4xl">
                👨‍💻
              </div>
              <h3 className="text-2xl font-semibold text-white text-center mb-2">Damith Pathirana</h3>
              <p className="text-[#c6ff20] text-center mb-4">Founder & CEO</p>
              <p className="text-[#808191] text-center">
                Background in blockchain technology and a passion for information integrity.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-3xl font-semibold mb-6 text-[#c6ff20]">Get in Touch</h2>
          <p className="text-[#808191] mb-8 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Reach out to us and let's build a more trustworthy information ecosystem together.
          </p>
          <a 
            href="mailto:contact@trustnet.com" 
            className="inline-block bg-gradient-to-r from-[#c6ff20] to-[#00ff88] text-black font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-opacity duration-300"
          >
            Contact Us
          </a>
        </section>

        {/* Feedback Section */}
        <section className="mb-16">
          <div className="bg-[#1c1c24] p-8 rounded-2xl border border-[#2c2c34] hover:border-[#c6ff20] transition-all duration-300">
            <h2 className="text-3xl font-semibold mb-6 text-[#c6ff20] text-center">Help Us Improve</h2>
            <p className="text-[#808191] text-center mb-8">
              Your feedback is invaluable in helping us make TrustNet better. Share your thoughts and suggestions with us.
            </p>
            <div className="text-center">
              <button
                onClick={() => setShowFeedbackForm(true)}
                className="px-6 py-3 rounded-lg bg-[#c6ff20] text-black font-medium hover:bg-[#a8e01d] transition-all duration-300 transform hover:scale-105"
              >
                Share Your Feedback
              </button>
            </div>
          </div>
        </section>

        
      </div>

      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
      <CacheStatusBar status={cacheStatus} />
    </div>
  );
};

export default AboutPage; 