import React from 'react';

export const WireframeBusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 80" className={className} stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Main body */}
    <path d="M10 20 H170 L190 40 V70 H10 V20 Z" />
    {/* Roof */}
    <path d="M15 15 H165 L185 35 H25 L15 15 Z" />
    <path d="M170 20 L165 15" />
    <path d="M190 40 L185 35" />
    {/* Windows */}
    <path d="M20 25 H160 V45 H20 Z" />
    <path d="M50 25 V45" />
    <path d="M80 25 V45" />
    <path d="M110 25 V45" />
    <path d="M140 25 V45" />
    {/* Windshield */}
    <path d="M170 20 L160 45 L175 45 L190 40" />
    {/* Wheels */}
    <ellipse cx="40" cy="70" rx="12" ry="5" />
    <ellipse cx="40" cy="70" rx="12" ry="12" strokeDasharray="3 2" />
    <ellipse cx="140" cy="70" rx="12" ry="5" />
    <ellipse cx="140" cy="70" rx="12" ry="12" strokeDasharray="3 2"/>
    {/* Door */}
    <path d="M162 45 V68 H172 V45" />
    <path d="M167 45 V68" />
    {/* Headlights */}
    <path d="M10 20 L5 22 V28 L10 30" />
    {/* Back Lines */}
    <path d="M10 70 L10 20" />
    {/* Perspective Lines */}
    <path d="M15 15 L10 20" />
    <path d="M25 35 L10 70" />
  </svg>
);


export const WireframeMotoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 120" className={className} stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Frame and body */}
    <path d="M80 50 L120 50 L150 80 L130 100 L70 100 Z" />
    <path d="M80 50 L70 70 L70 100" />
    <path d="M120 50 L130 40 L160 40" />
    {/* Handlebars */}
    <path d="M160 40 L170 20" />
    <path d="M160 40 L170 60" />
    {/* Seat */}
    <path d="M70 50 H125 L130 60 H70 Z" />
    {/* Front Wheel */}
    <circle cx="160" cy="90" r="25" />
    <path d="M160 90 L130 80" />
    <path d="M130 80 L130 40" />
    {/* Rear Wheel */}
    <circle cx="50" cy="90" r="25" />
    <path d="M70 70 L50 90" />
    {/* Engine */}
    <rect x="85" y="65" width="30" height="25" />
    <circle cx="100" cy="78" r="10" />
  </svg>
);

export const WireframeCarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 80" className={className} stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Main Body */}
    <path d="M10 40 L40 40 L50 20 H150 L160 40 H190 L180 65 H20 Z" />
    {/* Roof/Cabin */}
    <path d="M55 20 L70 5 H130 L145 20" />
    <path d="M50 20 L55 20" />
    <path d="M150 20 L145 20" />
    {/* Windows */}
    <path d="M75 25 H125" />
    <path d="M70 25 L55 40" />
    <path d="M130 25 L145 40" />
    <path d="M100 20 V 40" />
    {/* Wheels */}
    <ellipse cx="45" cy="65" rx="15" ry="5" />
    <ellipse cx="45" cy="65" rx="15" ry="15" strokeDasharray="3 2" />
    <ellipse cx="155" cy="65" rx="15" ry="5" />
    <ellipse cx="155" cy="65" rx="15" ry="15" strokeDasharray="3 2" />
    {/* Headlight */}
    <path d="M10 40 L5 42 V 48 L10 50" />
    {/* Taillight */}
    <path d="M190 40 L195 45 L190 50" />
  </svg>
);

export const BusIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"} style={style}>
    <path d="M18.928 4.072a.75.75 0 00-.928-.5H6a.75.75 0 00-.728.5L4.018 9.197A4.502 4.502 0 003.75 10.5V17a3 3 0 003 3h1.5V17a.75.75 0 011.5 0v3H15V17a.75.75 0 011.5 0v3h1.5a3 3 0 003-3v-6.5a4.502 4.502 0 00-.268-1.303L18.928 4.072zM7.5 14.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zm9 0a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zM7.383 6h9.234l.732 2.5H6.65L7.383 6z" />
  </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041A18.063 18.063 0 0012 22.5c5.368 0 9.75-4.043 9.75-9S17.368 4.5 12 4.5 2.25 8.543 2.25 13.5c0 1.54.364 2.99.996 4.309l.053.111.02.042a.752.752 0 00.724 0l.02-.042.052-.112A18.063 18.063 0 0011.54 22.351zM12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
    </svg>
);