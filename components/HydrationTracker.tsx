
import React, { useState, useMemo } from 'react';
import { HydrationEntry } from '../types';

interface Props {
  current: number;
  log: HydrationEntry[];
  onAdd: (oz: number) => void;
  isEvening?: boolean;
  accentProp?: string;
}

const HydrationTracker: React.FC<Props> = ({ current, log, onAdd, isEvening, accentProp }) => {
  const [target, setTarget] = useState(128);
  const percent = Math.min((current / target) * 100, 100);
  const accentColor = accentProp || (isEvening ? '#6B4E3D' : '#8CE000');

  const targets = [64, 100, 128];

  // Calculate Velocity (last 3 hours)
  const velocity = useMemo(() => {
    if (log.length === 0) return 0;
    const now = new Date().getTime();
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);
    const recentOz = log
      .filter(e => new Date(e.timestamp).getTime() > threeHoursAgo)
      .reduce((acc, e) => acc + e.amount, 0);
    return Math.round((recentOz / 3) * 10) / 10;
  }, [log]);

  const lastEntryTime = useMemo(() => {
    if (log.length === 0) return null;
    return new Date(log[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [log]);

  return (
    <div className="glass rounded-[3rem] p-10 flex flex-col items-center shadow-xl relative overflow-hidden group border border-current/5">
      {/* Velocity / Status Header */}
      <div className="w-full flex justify-between items-start mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-athletic font-black transition-colors duration-1000" style={{ color: accentColor }}>Cellular Saturation</span>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[8px] uppercase tracking-widest font-black opacity-30">Current Velocity:</span>
             <span className="text-[10px] font-serif italic" style={{ color: accentColor }}>{velocity} oz/hr</span>
          </div>
        </div>
        <div className="flex gap-2">
          {targets.map(t => (
            <button 
              key={t}
              onClick={() => setTarget(t)}
              className={`text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${target === t ? 'text-white border-transparent' : 'border-current/10 opacity-30'}`}
              style={target === t ? { backgroundColor: accentColor } : { color: accentColor }}
            >
              {t}oz
            </button>
          ))}
        </div>
      </div>
      
      <div 
        className="relative w-32 h-64 bg-white/5 rounded-[2.5rem] border border-current/10 overflow-hidden shadow-inner cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-500" 
        onClick={() => onAdd(8)}
      >
        {/* Circadian Ceiling Indicator (Evening only) */}
        {isEvening && (
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-[#E2725B] opacity-40 z-30 flex items-center justify-center">
             <span className="text-[6px] uppercase tracking-[0.3em] font-black bg-[#0F0D0C] px-2 text-[#E2725B]">Melatonin Ceiling</span>
          </div>
        )}

        <div 
          className="absolute bottom-0 w-full transition-all duration-[1.5s] ease-in-out"
          style={{ 
            height: `${percent}%`,
            background: `linear-gradient(to top, ${accentColor}CC, ${accentColor}44)`
          }}
        >
          <div className="absolute top-0 w-full h-2 bg-white/30 blur-sm animate-pulse"></div>
          
          {percent > 5 && Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white/40 rounded-full animate-float"
              style={{ 
                width: `${Math.random() * 6 + 2}px`, 
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 80 + 10}%`,
                bottom: `${Math.random() * 90}%`,
                animationDuration: `${Math.random() * 4 + 4}s`,
                animationDelay: `${i * 0.7}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span className="text-4xl font-black tracking-tighter">{current}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-black">fluid oz</span>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {[8, 16, 24].map(oz => (
          <button
            key={oz}
            onClick={(e) => { e.stopPropagation(); onAdd(oz); }}
            className="w-12 h-12 rounded-full border border-current/20 text-[9px] font-black hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-90 shadow-lg"
            style={{ color: accentColor } as any}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            +{oz}
          </button>
        ))}
      </div>
      
      {/* Recent History Bar */}
      <div className="w-full mt-10 pt-6 border-t border-current/5">
         <div className="flex justify-between items-center mb-4">
            <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-30">Recent Saturation Events</p>
            {lastEntryTime && <span className="text-[7px] font-black opacity-20 italic">Last Log: {lastEntryTime}</span>}
         </div>
         <div className="flex gap-1 h-3 items-end">
            {log.slice(0, 14).reverse().map((e, i) => (
              <div 
                key={e.id} 
                className="flex-1 rounded-t-sm transition-all duration-700 hover:opacity-100 opacity-60"
                style={{ 
                  height: `${(e.amount / 32) * 100}%`, 
                  backgroundColor: accentColor,
                  animationDelay: `${i * 0.1}s`
                }}
                title={`${e.amount}oz at ${new Date(e.timestamp).toLocaleTimeString()}`}
              ></div>
            ))}
            {log.length < 14 && Array.from({ length: 14 - log.length }).map((_, i) => (
              <div key={i} className="flex-1 h-[1px] bg-current/5 rounded-t-sm"></div>
            ))}
         </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
         <div className="h-1 w-16 bg-current/5 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: accentColor }}></div>
         </div>
         <p className="text-[8px] uppercase tracking-widest opacity-40 font-black">
           {isEvening ? 'Tapering Protocol Active' : `Optimal Sync: ${Math.round(percent)}%`}
         </p>
      </div>
    </div>
  );
};

export default HydrationTracker;
