import React from 'react';

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg className="absolute w-full h-full" viewBox="0 0 100 100">
        <circle className="text-blue-500/30" stroke="currentColor" strokeWidth="4" cx="50" cy="50" r="45" fill="transparent" />
        <circle 
          className="text-blue-500" 
          stroke="currentColor" 
          strokeWidth="4" 
          cx="50" 
          cy="50" 
          r="45" 
          fill="transparent" 
          strokeDasharray="283" 
          strokeDashoffset="212" // 283 * (1 - 0.75)
          transform="rotate(-90 50 50)"
        >
           <animateTransform 
             attributeName="transform"
             type="rotate"
             from="0 50 50"
             to="360 50 50"
             dur="1s"
             repeatCount="indefinite"
            />
        </circle>
      </svg>
      <i className="fas fa-satellite-dish text-blue-400 text-sm animate-pulse"></i>
    </div>
  );
};

export default LoadingSpinner;