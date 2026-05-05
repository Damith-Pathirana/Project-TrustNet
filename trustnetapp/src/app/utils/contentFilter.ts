// List of known sensitive/explicit domains
const SENSITIVE_DOMAINS = [
  'pornhub.com',
  'xvideos.com',
  'xhamster.com',
  'redtube.com',
  'youporn.com',
  'xnxx.com',
  'brazzers.com',
  'onlyfans.com',
  'adultfriendfinder.com',
  'ashleymadison.com',
  'bongacams.com',
  'chaturbate.com',
  'myfreecams.com',
  'stripchat.com',
  'livejasmin.com',
  'streamate.com',
  'adultempire.com',
  'adultdvdempire.com',
  'adultfilmdatabase.com',
  'adultfilmdatabase.net',
  'aljazeera.com',
  
];

// List of sensitive keywords that might indicate inappropriate content
const SENSITIVE_KEYWORDS = [
  'porn',
  'xxx',
  'sex',
  'nude',
  'naked',
  'adult',
  'explicit',
  'nsfw',
  '18+',
  'mature',
  // Add more keywords as needed
];

export const isSensitiveContent = (url: string, title?: string, description?: string): boolean => {
  try {
    // Check if URL is from a sensitive domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    if (SENSITIVE_DOMAINS.some(sensitiveDomain => domain.includes(sensitiveDomain))) {
      return true;
    }

    // Check URL for sensitive keywords
    if (SENSITIVE_KEYWORDS.some(keyword => url.toLowerCase().includes(keyword))) {
      return true;
    }

    // Check title and description for sensitive keywords
    const contentToCheck = [title, description].filter(Boolean).join(' ').toLowerCase();
    if (SENSITIVE_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) {
      return true;
    }

    return false;
  } catch (error) {
    // If URL parsing fails, check the raw string
    return SENSITIVE_KEYWORDS.some(keyword => url.toLowerCase().includes(keyword));
  }
};

// Function to sanitize image URL
export const getSanitizedImageUrl = (url: string, title?: string, description?: string): string => {
  return isSensitiveContent(url, title, description) ? 'N/A' : url;
};

// Function to sanitize source URL
export const getSanitizedSourceUrl = (url: string, title?: string, description?: string): string => {
  return isSensitiveContent(url, title, description) ? 'N/A' : url;
};

// Function to check if content needs to be protected
export const needsContentProtection = (url: string, title?: string, description?: string): boolean => {
  return isSensitiveContent(url, title, description);
}; 