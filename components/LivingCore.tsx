
import React from 'react';

const LivingCore: React.FC = () => {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
      {/* Background Organic Blobs */}
      <div className="absolute inset-0 bg-[#86A789]/20 blob animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute inset-0 bg-[#D2B48C]/10 blob rotate-90 scale-110" style={{ animationDuration: '12s' }}></div>
      
      {/* Central Glass Orb */}
      <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full glass flex items-center justify-center border border-[#86A789]/30 shadow-[0_0_50px_rgba(134,167,137,0.15)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#86A789]/10 to-transparent"></div>
        <div className="relative z-20 flex flex-col items-center">
           <div className="w-1.5 h-1.5 rounded-full bg-[#86A789] animate-ping mb-2"></div>
           <span className="text-[10px] uppercase tracking-[0.4em] text-[#86A789] font-bold">Awake</span>
        </div>
      </div>
    </div>
  );
};

export default LivingCore;
