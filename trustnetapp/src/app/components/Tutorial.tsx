"use client";

import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Props as JoyridePropsType, Placement } from 'react-joyride';
import { useActiveAccount } from "thirdweb/react";
import Image from 'next/image';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: 'Welcome to TrustNet! Let\'s take a quick tour to help you get started.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#demo-create-claim',
      content: 'Create your first claim by clicking this button. You can share facts or information that you want the community to verify.',
      placement: 'bottom',
    },
    {
      target: '#demo-claim-card',
      content: 'This is a claim card. You can vote on claims by selecting one of the four options: Valid, Invalid, Unverifiable, or Misleading.',
      placement: 'top',
    },
    {
      target: '#demo-profile',
      content: 'Your profile shows your activity, level, and achievements. The more you contribute, the higher your level becomes!',
      placement: 'left',
    },
    {
      target: '#demo-leaderboard',
      content: 'Check the leaderboard to see top contributors and most active fact-checkers in the community.',
      placement: 'left',
    },
    {
      target: 'body',
      content: 'That\'s it! You\'re ready to start contributing to TrustNet. Remember, you can always access this tutorial again from the sidebar.',
      placement: 'center',
    },
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Demo Elements */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <div id="demo-create-claim" className="absolute top-24 right-8">
          <button className="bg-gradient-to-r from-[#c6ff20] to-[#a8e01d] text-black px-6 py-2 rounded-xl font-medium shadow-lg">
            Create Claim
          </button>
        </div>

        <div id="demo-claim-card" className="absolute bottom-[50px] left-[200px] z-[10000]">
          <Image
            src="/claimcard.png"
            alt="Sample Claim Card"
            width={320}
            height={180}
            className="rounded-xl shadow-lg border border-white/10 opacity-70"
          />
        </div>

        <div id="demo-profile" className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 w-64">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Image src="/Novice.png" alt="Level" width={32} height={32} />
              </div>
              <div>
                <h3 className="text-white font-medium">Your Level</h3>
                <p className="text-[#c6ff20] text-sm">Novice</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-sm text-gray-400">Claims Created</p>
                <p className="text-white font-medium">0</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-sm text-gray-400">Votes Cast</p>
                <p className="text-white font-medium">0</p>
              </div>
            </div>
          </div>
        </div>

        <div id="demo-leaderboard" className="absolute right-8 bottom-8">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 w-64">
            <h3 className="text-white font-medium mb-4">Top Contributors</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#c6ff20] flex items-center justify-center text-black font-bold">1</div>
                <p className="text-white text-sm">User 1</p>
                <p className="text-[#c6ff20] text-sm ml-auto">100 pts</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#c6ff20] flex items-center justify-center text-black font-bold">2</div>
                <p className="text-white text-sm">User 2</p>
                <p className="text-[#c6ff20] text-sm ml-auto">85 pts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Joyride
        steps={steps}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#c6ff20',
            backgroundColor: '#1c1c24',
            textColor: '#ffffff',
            arrowColor: '#1c1c24',
            zIndex: 1000,
          },
          tooltip: {
            backgroundColor: '#1c1c24',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          buttonNext: {
            backgroundColor: '#c6ff20',
            color: '#000000',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
          },
          buttonBack: {
            color: '#ffffff',
            marginRight: '8px',
          },
          buttonSkip: {
            color: '#808191',
          },
        }}
      />
    </>
  );
};

export default Tutorial; 