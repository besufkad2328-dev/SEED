
import React from 'react';

interface Props {
  scores: number[];
  isEvening?: boolean;
  accentProp?: string;
}

const PerformancePulse: React.FC<Props> = ({ scores, isEvening, accentProp }) => {
  const width = 300;
  const height = 120;
  const padding = 15;
  
  const accentColor = accentProp || (isEvening ? '#4A6741' : '#6B8E23');

  const points = scores.map((score, i) => {
    const x = (i / (scores.length - 1)) * (width - padding * 2) + padding;
    const y = height - (score / 100) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="glass rounded-[3rem] p-10 flex flex-col items-center group">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-60 transition-colors duration-1000" style={{ color: accentColor }}>Kinetic Output</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] uppercase font-black opacity-30">Real-time Feed</span>
        </div>
      </div>
      
      <div className="relative w-full h-32 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.1" />
              <stop offset="50%" stopColor={accentColor} stopOpacity="1" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />

          <polyline
            fill="none"
            stroke="url(#pulseGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            filter="url(#glow)"
            className="transition-all duration-[1s] ease-in-out"
          />
          
          {scores.map((score, i) => {
            const x = (i / (scores.length - 1)) * (width - padding * 2) + padding;
            const y = height - (score / 100) * (height - padding * 2) - padding;
            return (
              <g key={i}>
                <circle 
                  cx={x} cy={y} r="3" 
                  fill={accentColor} 
                  className={`transition-all duration-1000 ${i === scores.length - 1 ? 'animate-ping' : ''}`} 
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
                <circle 
                  cx={x} cy={y} r="1.5" 
                  fill="white" 
                  className="transition-all duration-1000"
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="w-full grid grid-cols-4 gap-2 mt-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-1 bg-current/5 rounded-full overflow-hidden">
            <div className="h-full bg-current opacity-20 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
          </div>
        ))}
      </div>
      <p className="text-[9px] opacity-40 mt-6 tracking-[0.3em] uppercase font-black">Biological Consistency Gradient</p>
    </div>
  );
};

export default PerformancePulse;
