import React from 'react';
import EyeIcon from './EyeIcon';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-center gap-3 max-w-2xl animate-pulse">
        {/* Animated Logo */}
        <style>{`
          @keyframes rotateStar {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .essence-logo-spinner {
            animation: rotateStar 8s linear infinite;
          }
        `}</style>
        <img src="/silver.png" alt="Loading" className="essence-logo-spinner w-8 h-8" />
      </div>
    </div>
  );
};

export default LoadingSpinner;