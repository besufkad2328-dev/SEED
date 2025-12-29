
import React from 'react';

interface Props {
  isEvening?: boolean;
  accentProp?: string;
  progress?: number; // 0 to 1
}

const WaveFooter: React.FC<Props> = ({ isEvening, accentProp, progress = 0 }) => {
  const accentColor = accentProp || (isEvening ? '#6B4E3D' : '#8CE000');
  
  // Calculate tidal rise based on progress (max 60px elevation)
  const tideRise = progress * 60;

  return (
    <div 
      className="fixed bottom-0 left-0 w-full h-[250px] overflow-hidden leading-[0] z-[-5] pointer-events-none select-none transition-transform duration-[2s] cubic-bezier(0.16, 1, 0.3, 1)"
      style={{ transform: `translateY(${60 - tideRise}px)` }}
    >
      <div className="relative w-full h-full">
        <svg className="absolute w-0 h-0">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
            </linearGradient>
            
            <filter id="organicNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
            </filter>
          </defs>
        </svg>

        {/* Layer 1: The Deep Anabolic Tide */}
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-slow opacity-25 transition-colors duration-[2s]"
          style={{ fill: 'url(#waveGradient)', filter: 'url(#organicNoise)' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,20 C300,80 400,0 600,40 C800,80 900,10 1200,30 V120 H0 Z" />
          <path d="M1200,20 C1500,80 1600,0 1800,40 C2000,80 2100,10 2400,30 V120 H1200 Z" transform="translate(1200, 0)" />
        </svg>

        {/* Layer 2: The Satiety Current */}
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-[200%] h-[80%] animate-wave-mid opacity-20 transition-colors duration-[2s]"
          style={{ fill: accentColor, animationDirection: 'reverse' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,40 C200,10 400,60 600,30 C800,0 1000,50 1200,20 V120 H0 Z" />
          <path d="M1200,40 C1400,10 1600,60 1800,30 C2000,0 2200,50 2400,20 V120 H1200 Z" transform="translate(1200, 0)" />
        </svg>

        {/* Layer 3: The Cellular Surface */}
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-[200%] h-[60%] animate-wave-fast opacity-15 transition-colors duration-[2s]"
          style={{ fill: accentColor }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,60 Q300,110 600,60 T1200,70 V120 H0 Z" />
          <path d="M1200,60 Q1500,110 1800,60 T2400,70 V120 H1200 Z" transform="translate(1200, 0)" />
        </svg>
      </div>

      <style>{`
        @keyframes waveMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-wave-slow {
          animation: waveMove 50s linear infinite;
          will-change: transform;
        }
        
        .animate-wave-mid {
          animation: waveMove 35s linear infinite;
          will-change: transform;
        }
        
        .animate-wave-fast {
          animation: waveMove 22s linear infinite;
          will-change: transform;
        }

        body.evening .animate-wave-slow { animation-duration: 75s; opacity: 0.15; }
        body.evening .animate-wave-mid { animation-duration: 55s; opacity: 0.1; }
        body.evening .animate-wave-fast { animation-duration: 45s; opacity: 0.05; }
      `}</style>
    </div>
  );
};

export default WaveFooter;
