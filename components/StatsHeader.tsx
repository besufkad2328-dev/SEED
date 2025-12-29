
import React from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  isEvening?: boolean;
  accentProp?: string;
}

const StatsHeader: React.FC<Props> = ({ state, isEvening, accentProp }) => {
  const currentTotal = state.history.reduce((acc, meal) => ({
    kcal: acc.kcal + meal.stats.kcal,
    protein: acc.protein + meal.stats.protein,
    carbs: acc.carbs + meal.stats.carbs,
    fat: acc.fat + meal.stats.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const averageSustenance = state.history.length > 0 
    ? Math.round(state.history.reduce((acc, m) => acc + m.sustenanceScore, 0) / state.history.length)
    : 0;

  const accentColor = accentProp || (isEvening ? '#4A6741' : '#6B8E23');

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-12 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-6xl font-black tracking-tighter leading-none">SEED</h1>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Live Core</span>
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }}></span>
              </div>
              <span className="text-[10px] font-medium opacity-40">Sync Protocol 2.5.4</span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.6em] font-extrabold transition-colors duration-1000" style={{ color: accentColor }}>
            {isEvening ? 'Metabolic Recovery Active' : 'Performance Engine Primed'}
          </p>
        </div>
        
        <div className="flex gap-12 items-end">
          <div className="flex flex-col items-center md:items-end">
             <span className="text-[8px] uppercase tracking-[0.4em] font-black mb-1 opacity-60" style={{ color: accentColor }}>Metabolic Quality</span>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif text-[#1A1F1B]">{averageSustenance}</span>
                <span className="text-[10px] opacity-40 font-black">SQI</span>
             </div>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-black mb-1">{state.goal}</p>
            <div className="text-4xl font-serif text-[#1A1F1B]">
              {currentTotal.kcal} <span className="text-xl opacity-40 font-light">/ {state.targetKcal}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <MacroCard label="Protein" current={currentTotal.protein} target={state.targetMacros.protein} unit="g" accent={accentColor} />
        <MacroCard label="Carbs" current={currentTotal.carbs} target={state.targetMacros.carbs} unit="g" accent={accentColor} />
        <MacroCard label="Fat" current={currentTotal.fat} target={state.targetMacros.fat} unit="g" accent={accentColor} />
      </div>
    </div>
  );
};

const MacroCard = ({ label, current, target, unit, accent }: { label: string, current: number, target: number, unit: string, accent: string }) => (
  <div className="glass p-6 rounded-[2rem] transition-all hover:scale-[1.03] duration-500 group border border-current/5 hover:border-current/20">
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] uppercase tracking-athletic font-black transition-colors duration-1000" style={{ color: accent }}>{label}</p>
      <div className="w-2 h-2 rounded-full opacity-20 group-hover:opacity-100 transition-all duration-1000" style={{ backgroundColor: accent }}></div>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-serif">{Math.round(current)}</span>
      <span className="text-[10px] opacity-30 font-bold">{unit}</span>
    </div>
    <div className="mt-4 h-1.5 w-full bg-current/5 rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-1000 ease-out relative"
        style={{ width: `${Math.min((current / target) * 100, 100)}%`, backgroundColor: accent }}
      >
        <div className="absolute top-0 right-0 h-full w-4 bg-white/40 blur-sm"></div>
      </div>
    </div>
    <div className="flex justify-between mt-3">
       <p className="text-[8px] opacity-30 font-bold">Performance Offset</p>
       <p className="text-[8px] opacity-40 font-black">{Math.max(0, Math.round(target - current))}{unit} Remaining</p>
    </div>
  </div>
);

export default StatsHeader;
