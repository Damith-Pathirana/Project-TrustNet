"use client";

import React, { useState, useEffect } from 'react';

const misinformationFacts = [
  "Misinformation spreads faster than truth on social media, often due to its novelty and emotional appeal.",
  "People are more likely to believe misinformation if it aligns with their existing beliefs, a phenomenon known as confirmation bias.",
  "Fact-checking can reduce the impact of misinformation, but repeated exposure can still create a \"truth effect.\"",
  "Even a small amount of exposure to misinformation can influence people's perceptions and memories.",
  "Visuals (images, videos) make misinformation more convincing and harder to fact-check, as our brains process them quickly.",
  "A lack of critical thinking skills makes individuals more susceptible to misinformation; always question the source!",
  "Misinformation can have serious real-world consequences, affecting public health, democratic processes, and social cohesion.",
  "Understanding the source and context of information is crucial to identify potential misinformation.",
  "Emotional content, especially that which evokes strong feelings like anger or fear, often triggers faster sharing of misinformation.",
  "Pre-bunking (forewarning people about common misinformation tactics) can be more effective than debunking after the fact.",
  "The spread of misinformation is often amplified by echo chambers and filter bubbles on social media platforms.",
  "Be wary of headlines that seem too sensational or emotionally charged; they are often designed to mislead.",
  "Always cross-reference information with multiple, reputable sources before accepting it as true.",
  "Even well-meaning individuals can unknowingly spread misinformation; critical evaluation is key for everyone.",
  "Misinformation thrives on ambiguity and uncertainty, filling knowledge gaps with false narratives.",
  "Consider the motive behind the information you're consuming. Is it to inform, or to persuade and provoke?"
];

const LoadingContent: React.FC = () => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Start fade-out
      setTimeout(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % misinformationFacts.length);
        setIsVisible(true); // Start fade-in for new fact
      }, 500); // Wait for fade-out to complete before changing text
    }, 7000); // Change fact every 7 seconds (5s display + 2s transition)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-gradient-to-br from-[#1c1c24] to-[#0a0a0a] z-50">
      {/* Subtle background animation */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute w-40 h-40 bg-[#c6ff20] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob top-0 left-0"></div>
        <div className="absolute w-40 h-40 bg-[#a8e01d] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob top-0 right-0 delay-2000"></div>
        <div className="absolute w-40 h-40 bg-[#c6ff20] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob bottom-0 left-0 delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#c6ff20] mb-8"></div>
        <h2 className="text-4xl font-extrabold mb-4 text-[#c6ff20] drop-shadow-lg">Did You Know?</h2>
        <p className={`text-[#e0e0e0] text-xl max-w-2xl italic transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          "{misinformationFacts[currentFactIndex]}"
        </p>
        <p className="text-[#808191] text-md mt-6 animate-pulse">Preparing your content for a more informed experience...</p>
      </div>
    </div>
  );
};

export default LoadingContent; 