
import React, { useMemo } from 'react';
import { UserProfile, Gender, ActivityLevel } from '../types';

interface Props {
  profile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: any) => void;
  isEvening?: boolean;
}

const HealthVault: React.FC<Props> = ({ profile, onUpdate, isEvening }) => {
  const accentColor = isEvening ? '#4A6741' : '#86A789';

  const bmi = useMemo(() => {
    const heightM = profile.heightCm / 100;
    if (heightM === 0) return 0;
    return parseFloat((profile.weightKg / (heightM * heightM)).toFixed(1));
  }, [profile.weightKg, profile.heightCm]);

  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#D2B48C' };
    if (bmi < 25) return { label: 'Optimal', color: '#86A789' };
    if (bmi < 30) return { label: 'Overweight', color: '#D2B48C' };
    return { label: 'Obese', color: '#E2725B' };
  }, [bmi]);

  const weightTrend = useMemo(() => {
    if (profile.weightHistory.length < 2) return null;
    const last = profile.weightHistory[profile.weightHistory.length - 1].weightKg;
    const prev = profile.weightHistory[profile.weightHistory.length - 2].weightKg;
    const diff = last - prev;
    return { diff: diff.toFixed(1), direction: diff > 0 ? 'Increase' : 'Decrease' };
  }, [profile.weightHistory]);

  return (
    <div className="glass rounded-[3rem] p-10 mb-16 shadow-2xl animate-in fade-in zoom-in duration-700">
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-current/10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40 mb-1 block">Metabolic Vault</span>
          <h2 className="text-4xl font-serif">Biological Identity</h2>
        </div>
        <div className="flex items-center gap-3">
           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
           <span className="text-[8px] uppercase tracking-widest font-black opacity-40">Encryption Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <VaultInput label="Current Weight (kg)" value={profile.weightKg} onChange={(v) => onUpdate('weightKg', parseFloat(v))} />
            <VaultInput label="Current Height (cm)" value={profile.heightCm} onChange={(v) => onUpdate('heightCm', parseFloat(v))} />
            <VaultInput label="Biological Age" value={profile.age} onChange={(v) => onUpdate('age', parseInt(v))} />
            <div className="flex flex-col">
              <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2">Biological Sex</label>
              <select 
                value={profile.gender}
                onChange={(e) => onUpdate('gender', e.target.value)}
                className="bg-transparent border-b border-current/20 py-2 outline-none font-serif text-xl"
              >
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2">Activity Level</label>
            <select 
              value={profile.activityLevel}
              onChange={(e) => onUpdate('activityLevel', e.target.value)}
              className="bg-transparent border-b border-current/20 py-2 outline-none font-serif text-xl"
            >
              {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/40 p-8 rounded-[2rem] border border-current/5 flex justify-between items-center">
            <div>
              <p className="text-[9px] uppercase tracking-[0.4em] font-black opacity-40 mb-2">Body Mass Index</p>
              <span className="text-5xl font-serif" style={{ color: bmiStatus.color }}>{bmi}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full bg-white/60 border border-current/10" style={{ color: bmiStatus.color }}>
                {bmiStatus.label}
              </span>
              <p className="text-[9px] mt-2 opacity-40 max-w-[120px]">Optimal range is typically between 18.5 and 24.9.</p>
            </div>
          </div>

          <div className="bg-white/40 p-8 rounded-[2rem] border border-current/5">
            <p className="text-[9px] uppercase tracking-[0.4em] font-black opacity-40 mb-4">Weight History Trend</p>
            {profile.weightHistory.length > 0 ? (
              <div className="flex items-end justify-between">
                <div className="flex gap-2 items-baseline">
                  {profile.weightHistory.slice(-5).map((entry, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                       <div 
                         className="w-8 bg-current/10 rounded-t-lg transition-all duration-1000" 
                         style={{ height: `${(entry.weightKg / profile.weightKg) * 40}px`, backgroundColor: accentColor }}
                       ></div>
                       <span className="text-[7px] font-black opacity-40">{entry.date.split('-')[2]}</span>
                    </div>
                  ))}
                </div>
                {weightTrend && (
                  <div className="text-right">
                    <p className={`text-xl font-serif ${parseFloat(weightTrend.diff) > 0 ? 'text-[#E2725B]' : 'text-[#86A789]'}`}>
                      {weightTrend.diff} kg
                    </p>
                    <p className="text-[8px] uppercase tracking-widest opacity-40 font-black">{weightTrend.direction} since last entry</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] italic opacity-40">Sequential data required for trend generation.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-10 border-t border-current/5">
         <label className="text-[9px] uppercase tracking-[0.4em] font-black opacity-40 mb-4 block">Primary Health Goals</label>
         <div className="flex flex-wrap gap-3">
            {profile.healthGoals.map((goal, i) => (
              <span key={i} className="px-5 py-2 rounded-full bg-white/60 border border-current/10 text-[9px] uppercase tracking-[0.2em] font-black opacity-60">
                {goal}
              </span>
            ))}
            <button 
              onClick={() => {
                const goal = prompt("Enter new health directive:");
                if (goal) onUpdate('healthGoals', [...profile.healthGoals, goal]);
              }}
              className="px-5 py-2 rounded-full border-2 border-dashed border-current/20 text-[9px] uppercase tracking-[0.2em] font-black opacity-30 hover:opacity-100 transition-all"
            >
              + New Directive
            </button>
         </div>
      </div>
    </div>
  );
};

const VaultInput = ({ label, value, onChange }: { label: string, value: any, onChange: (v: any) => void }) => (
  <div className="flex flex-col">
    <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2">{label}</label>
    <input 
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-b border-current/20 py-2 outline-none font-serif text-xl focus:border-current transition-colors"
    />
  </div>
);

export default HealthVault;
