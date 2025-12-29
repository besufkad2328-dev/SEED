
import React from 'react';
import { AuraAnalysis } from '../types';

interface Props {
  analysis: AuraAnalysis;
}

const SustenanceBloom = ({ score, color }: { score: number; color: string }) => {
  const clampedScore = Math.min(Math.max(score, 0), 100) / 100;
  const stemHeight = clampedScore * 40;
  const leafProgress = clampedScore > 0.3 ? (clampedScore - 0.3) / 0.7 : 0;
  
  return (
    <div className="flex flex-col items-center">
      <svg width="60" height="60" viewBox="0 0 60 60" className="overflow-visible">
        <defs>
          <filter id="bloomGlowSmall" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Soil / Base line */}
        <path d="M10 55 Q30 53 50 55" stroke={color} strokeWidth="1" strokeOpacity="0.2" fill="none" />
        
        {/* Main Stem */}
        <path 
          d={`M30 55 Q${30 + Math.sin(clampedScore * 4) * 5} ${55 - stemHeight/2} 30 ${55 - stemHeight}`} 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Leaves */}
        {leafProgress > 0.1 && (
          <g transform={`translate(30, ${55 - stemHeight * 0.4}) scale(${leafProgress}) rotate(-35)`}>
            <path d="M0 0 Q-12 -6 -18 0 Q-12 6 0 0" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.5" />
          </g>
        )}
        {leafProgress > 0.5 && (
          <g transform={`translate(30, ${55 - stemHeight * 0.7}) scale(${leafProgress * 0.8}) rotate(35)`}>
            <path d="M0 0 Q12 -6 18 0 Q12 6 0 0" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.5" />
          </g>
        )}
        
        {/* Bloom at the top */}
        {clampedScore > 0.85 && (
          <g transform={`translate(30, ${55 - stemHeight}) scale(${(clampedScore - 0.85) * 6})`} filter="url(#bloomGlowSmall)">
            <circle cx="0" cy="0" r="3" fill="#FFF" fillOpacity="0.8" />
            <circle cx="0" cy="0" r="1.5" fill={color} />
            {[0, 72, 144, 216, 288].map(angle => (
              <path 
                key={angle}
                d="M0 0 Q-3 -6 0 -8 Q3 -6 0 0" 
                fill={color} 
                fillOpacity="0.4"
                transform={`rotate(${angle})`}
              />
            ))}
          </g>
        )}
      </svg>
      <span className="text-[14px] font-serif mt-1" style={{ color }}>{score}%</span>
    </div>
  );
};

const AnalysisCard: React.FC<Props> = ({ analysis }) => {
  const { 
    insight, 
    stats, 
    eliteAdjustment, 
    metabolicPrescription, 
    metabolicFlexibility, 
    resourceRecipe, 
    mealName, 
    sustenanceScore,
    visualizationUrl,
    correlationAnalysis
  } = analysis;

  return (
    <div 
      className="glass rounded-[3rem] overflow-hidden border-l-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 mb-16 shadow-2xl"
      style={{ borderLeftColor: insight.theme }}
    >
      {/* Visual Asset Header */}
      {visualizationUrl && (
        <div className="relative w-full h-[300px] overflow-hidden group">
          <img 
            src={visualizationUrl} 
            alt={mealName} 
            className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-8 left-10">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-black mb-2 block">Elite Asset Visualization</span>
            <h2 className="text-4xl font-serif text-white">{mealName}</h2>
          </div>
        </div>
      )}

      <div className="p-10">
        {!visualizationUrl && (
           <div className="flex justify-between items-start mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#86A789] font-bold mb-1 block italic">Metabolic Entry</span>
              <h2 className="text-3xl font-serif text-[#2D362E]">{mealName}</h2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif text-[#2D362E]">{stats.kcal}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 ml-1 font-bold">kcal</span>
            </div>
          </div>
        )}

        {visualizationUrl && (
          <div className="flex justify-end mb-10">
            <div className="text-right">
              <span className="text-4xl font-serif text-[#2D362E]">{stats.kcal}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 ml-1 font-bold">kcal</span>
            </div>
          </div>
        )}

        {/* Bio-Feedback Correlation Alert */}
        {correlationAnalysis && (
          <div className="mb-10 p-6 bg-[#E2725B]/5 border border-[#E2725B]/20 rounded-3xl flex items-start gap-4">
             <div className="w-8 h-8 rounded-full bg-[#E2725B]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧬</span>
             </div>
             <div>
                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-[#E2725B] mb-1">Bio-Feedback Resonance Detection</p>
                <p className="text-sm font-medium text-[#2D362E] leading-relaxed italic">"{correlationAnalysis}"</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 mb-8 pb-10 border-b border-[#E5E1D8]/50">
          <StatBox label="P" val={stats.protein} />
          <StatBox label="C" val={stats.carbs} />
          <StatBox label="F" val={stats.fat} />
        </div>

        {/* Sustenance & Flexibility Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 items-center">
          <div className="flex items-center gap-6 glass p-6 rounded-[2rem] border border-[#86A789]/10">
            <SustenanceBloom score={sustenanceScore} color={insight.theme === '#86A789' ? '#86A789' : insight.theme} />
            <div>
               <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#86A789] block mb-1">Sustenance Index</span>
               <p className="text-[11px] text-zinc-500 font-medium leading-tight">This indicates the biological density and organic purity of your intake.</p>
            </div>
          </div>

          <div className="px-2">
            <div className="flex justify-between items-end mb-2">
               <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#D2B48C]">Flexibility Forecast</span>
               <span className="text-[10px] font-bold opacity-40">Stability: {metabolicFlexibility.stabilityRating}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E5E1D8]/30 rounded-full overflow-hidden">
               <div className="h-full bg-[#D2B48C] transition-all duration-1000" style={{ width: `${metabolicFlexibility.stabilityRating}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mb-12 p-8 bg-[#FDFCF8]/80 rounded-[2.5rem] border border-[#D2B48C]/30 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#D2B48C] font-black">Flexibility Insight</span>
            </div>
            <p className="text-xl font-serif text-[#2D362E] mb-6 leading-relaxed italic">
              "{metabolicFlexibility.forecast}"
            </p>
            <div className="pt-6 border-t border-[#D2B48C]/20">
              <p className="text-[9px] uppercase tracking-widest text-[#D2B48C] font-black mb-2">Proactive Protocol</p>
              <p className="text-sm text-[#2D362E] leading-relaxed font-medium">{metabolicFlexibility.proactiveProtocol}</p>
            </div>
        </div>

        <div className="mb-12 p-8 bg-white/40 rounded-[2.5rem] border border-[#86A789]/20 shadow-inner">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#86A789] animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#86A789] font-black">Metabolic Prescription</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1">Target Intake</p>
                <p className="text-2xl font-serif text-[#2D362E]">{metabolicPrescription.dailyKcalTarget} kcal</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1">Optimal Frequency</p>
                <p className="text-2xl font-serif text-[#2D362E]">{metabolicPrescription.mealFrequency}</p>
              </div>
           </div>

           <p className="text-sm text-[#2D362E] leading-relaxed italic border-l-2 border-[#86A789] pl-4 mb-4">
            {metabolicPrescription.bmiDirective}
           </p>
           <div className="flex flex-wrap gap-2">
            {metabolicPrescription.focusAreas.map((area, i) => (
              <span key={i} className="text-[8px] uppercase tracking-widest bg-[#86A789]/10 text-[#86A789] px-3 py-1 rounded-full font-black">
                {area}
              </span>
            ))}
           </div>
        </div>

        <div className="space-y-10 mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-4 block font-bold">The Elite Adjustment</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#86A789]/5 p-6 rounded-3xl border border-[#86A789]/10">
                <p className="text-[9px] text-[#86A789] font-black uppercase tracking-widest mb-2">Enhance with</p>
                <p className="text-sm text-[#2D362E] leading-relaxed font-medium">{eliteAdjustment.add}</p>
              </div>
              <div className="bg-[#E2725B]/5 p-6 rounded-3xl border border-[#E2725B]/10">
                <p className="text-[9px] text-[#E2725B] font-black uppercase tracking-widest mb-2">Refine by</p>
                <p className="text-sm text-[#2D362E] leading-relaxed font-medium">{eliteAdjustment.reduce}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#FDFCF8] p-8 rounded-[2.5rem] border border-[#E5E1D8]">
            <h4 className="font-serif text-2xl text-[#2D362E] mb-2">The {resourceRecipe.name} Dish</h4>
            <p className="text-sm text-zinc-500 italic leading-relaxed font-light mb-6">{resourceRecipe.description}</p>
            <div className="pt-4 border-t border-[#E5E1D8] text-[10px] text-[#86A789] font-medium tracking-wide">
              <span className="font-bold mr-1 uppercase">Biological Basis:</span> {resourceRecipe.reasoning}
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-[#E5E1D8]/50 flex items-center justify-between">
          <p className="text-xs font-serif italic text-zinc-400 max-w-[70%]">"{insight.quote}"</p>
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-zinc-200">
             <span className="text-[9px] uppercase tracking-[0.2em] text-[#86A789] font-black">Verified Analysis</span>
             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: insight.theme }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, val }: { label: string, val: number }) => (
  <div>
    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1 font-black">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-serif text-[#2D362E]">{val}</span>
      <span className="text-[9px] text-zinc-400 font-bold">g</span>
    </div>
  </div>
);

export default AnalysisCard;
