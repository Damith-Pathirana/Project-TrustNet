import React from "react";

interface CacheStatusBarProps {
  status: "cached" | "fresh" | "loading";
}

const statusMap = {
  cached: { text: "Loaded from Cache", color: "bg-green-500" },
  fresh: { text: "Fresh Data", color: "bg-blue-500" },
  loading: { text: "Loading...", color: "bg-yellow-500 animate-pulse" },
};

const CacheStatusBar: React.FC<CacheStatusBarProps> = ({ status }) => {
  const { text, color } = statusMap[status];
  return (
    <div className={`fixed bottom-0 left-0 w-full z-50`}>
      <div className={`mx-auto max-w-2xl rounded-t-lg text-center py-1 text-white text-xs ${color}`}>
        {text}
      </div>
    </div>
  );
};

export default CacheStatusBar; 