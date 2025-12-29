
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  progress: number;
  isEvening?: boolean;
  forestDensity?: number; // 0 (single plant) to 1 (full forest)
  accentProp?: string;
}

const DailyBloom: React.FC<Props> = ({ progress, isEvening, forestDensity = 0, accentProp }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const accentColor = accentProp || (isEvening ? '#4A6741' : '#86A789');

  // State for smooth density interpolation
  const [smoothDensity, setSmoothDensity] = useState(forestDensity);
  const densityRef = useRef(forestDensity);
  
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      const diff = forestDensity - densityRef.current;
      if (Math.abs(diff) > 0.001) {
        densityRef.current += diff * 0.08; // Slower, more organic interpolation
        setSmoothDensity(densityRef.current);
        animationFrame = requestAnimationFrame(animate);
      } else {
        densityRef.current = forestDensity;
        setSmoothDensity(forestDensity);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [forestDensity]);

  const renderStem = (
    index: number, 
    offset: { x: number; y: number }, 
    scale: number, 
    localProgress: number,
    delay: string
  ) => {
    const stemLength = localProgress * 120 * scale;
    const leafScale = localProgress > 0.3 ? Math.min((localProgress - 0.3) * 2, 1) : 0;
    const flowerScale = localProgress > 0.7 ? Math.min((localProgress - 0.7) * 3.3, 1) : 0;

    return (
      <g key={index} transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
        <path 
          d={`M0 0 Q${Math.sin(localProgress * 5 + index) * 10} ${-stemLength/2} 0 ${-stemLength}`} 
          stroke={accentColor} 
          strokeWidth={3 / scale} 
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          fill="none"
          style={{ transitionDelay: delay }}
        />

        {leafScale > 0 && (
          <>
            <g transform={`translate(0, ${-stemLength * 0.4}) scale(${leafScale}) rotate(-45)`}>
              <path 
                d="M0 0 Q-20 -10 -30 0 Q-20 10 0 0" 
                fill={accentColor} 
                fillOpacity="0.4" 
                stroke={accentColor} 
                strokeWidth="1"
                className="animate-float"
              />
            </g>
            <g transform={`translate(0, ${-stemLength * 0.6}) scale(${leafScale}) rotate(45)`}>
              <path 
                d="M0 0 Q20 -10 30 0 Q20 10 0 0" 
                fill={accentColor} 
                fillOpacity="0.4" 
                stroke={accentColor} 
                strokeWidth="1"
                style={{ animationDelay: '-2s' }}
                className="animate-float"
              />
            </g>
          </>
        )}

        {flowerScale > 0 && (
          <g transform={`translate(0, ${-stemLength}) scale(${flowerScale})`} filter="url(#bloomGlow)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path 
                key={angle}
                d="M0 0 Q-10 -25 0 -35 Q10 -25 0 0" 
                fill={accentColor} 
                fillOpacity="0.6" 
                stroke={accentColor} 
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                className="transition-transform duration-1000"
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#FDFCF8" stroke={accentColor} strokeWidth="0.5" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="relative flex items-center justify-center w-[450px] h-[500px] group cursor-default scale-75 md:scale-100">
      <div 
        className="absolute w-80 h-80 rounded-full blur-[120px] transition-all duration-[2s]"
        style={{ 
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          opacity: (clampedProgress * 0.2) + (smoothDensity * 0.5)
        }}
      />

      <svg width="450" height="500" viewBox="0 0 450 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <filter id="bloomGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path 
          d="M50 400 Q225 390 400 400" 
          stroke="currentColor" 
          strokeOpacity="0.1"
          strokeWidth="2" 
          strokeLinecap="round" 
        />

        {smoothDensity > 0.05 && renderStem(1, { x: 140, y: 400 }, 0.6, Math.min(smoothDensity * 2, 1) * progress, "0.1s")}
        {smoothDensity > 0.2 && renderStem(2, { x: 310, y: 400 }, 0.5, Math.min(smoothDensity * 1.5, 1) * progress, "0.2s")}
        {smoothDensity > 0.4 && renderStem(3, { x: 100, y: 405 }, 0.4, Math.min(smoothDensity * 1.2, 1) * progress, "0.3s")}
        {smoothDensity > 0.6 && renderStem(4, { x: 350, y: 405 }, 0.45, smoothDensity * progress, "0.4s")}

        {renderStem(0, { x: 225, y: 400 }, 1, clampedProgress, "0s")}

        {/* Dynamic Kinetic Particles */}
        {(clampedProgress > 0.5 || smoothDensity > 0.1) && Array.from({ length: Math.floor(8 + smoothDensity * 12) }).map((_, i) => (
          <circle 
            key={i}
            cx={225 + Math.sin(i * 2 + smoothDensity * 10) * (100 + smoothDensity * 80)} 
            cy={400 - (clampedProgress * 120) - 20 - (i * 15)} 
            r={isEvening ? "1" : "1.5"} 
            fill={accentColor} 
            className={isEvening ? "animate-pulse" : "animate-ping"}
            style={{ 
              animationDelay: `${i * 0.3}s`, 
              animationDuration: `${3 + smoothDensity * 2}s`,
              opacity: (isEvening ? 0.3 : 0.7) * (0.4 + smoothDensity * 0.6)
            }}
          />
        ))}
      </svg>

      <div className="absolute bottom-4 flex flex-col items-center">
        <div className="glass px-8 py-3 rounded-full flex flex-col items-center shadow-xl">
          <span className="text-[9px] uppercase tracking-[0.4em] font-black leading-none mb-1 opacity-60 transition-colors duration-1000" style={{ color: accentColor }}>
            {smoothDensity > 0 ? 'Projected Metabolic Density' : 'Sync Status'}
          </span>
          <span className="text-3xl font-serif leading-none">
            {Math.round((clampedProgress * (1 - smoothDensity) + smoothDensity) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyBloom;
