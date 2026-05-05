import { client } from "../client";
import { sepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { TrustNetsFactory } from "../constants/contracts";

// Cache for contract instances
const contractCache = new Map();

// Get contract instance with caching
export const getContractInstance = () => {
  if (contractCache.has('factory')) {
    return contractCache.get('factory');
  }

  const contract = getContract({
    client: client,
    chain: sepolia,
    address: TrustNetsFactory,
  });

  contractCache.set('factory', contract);
  return contract;
};

// Cache for claim data
const claimCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached data or fetch new data
export const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  const cached = claimCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  claimCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  return data;
};

// Clear cache for a specific key
export const clearCache = (key: string) => {
  claimCache.delete(key);
};

// Clear all cache
export const clearAllCache = () => {
  claimCache.clear();
}; 