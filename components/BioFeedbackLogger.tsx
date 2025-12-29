
import React, { useState } from 'react';
import { BioFeedbackEntry } from '../types';

interface Props {
  onLog: (entry: Omit<BioFeedbackEntry, 'id' | 'timestamp'>) => void;
  isEvening?: boolean;
}

const BioFeedbackLogger: React.FC<Props> = ({ onLog, isEvening }) => {
  const [energy, setEnergy] = useState(7);
  const [bloating, setBloating] = useState(2);
  const [skin, setSkin] = useState(8);
  const [mood, setMood] = useState(7);
  const [notes, setNotes] = useState('');

  const accentColor = isEvening ? '#4A6741' : '#86A789';

  const handleLog = () => {
    onLog({ energy, bloating, skinClarity: skin, mood, notes });
    setNotes('');
  };

  return (
    <div className="glass rounded-[3rem] p-10 mb-16 shadow-2xl animate-in fade-in slide-in-from-left-8 duration-700">
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40 mb-1 block">Bio-Feedback Sync</span>
          <h2 className="text-4xl font-serif">Symptom Resonance</h2>
        </div>
        <div className="w-12 h-12 rounded-full border border-current/10 flex items-center justify-center animate-pulse">
           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></div>
        </div>
      </div>

      <div className="space-y-10 mb-10">
        <SliderInput label="Vitality Energy" value={energy} onChange={setEnergy} min={1} max={10} color={accentColor} />
        <SliderInput label="Digestive Load (Bloating)" value={bloating} onChange={setBloating} min={1} max={10} color="#D2B48C" invert />
        <SliderInput label="Dermal Clarity (Skin)" value={skin} onChange={setSkin} min={1} max={10} color="#E5E1D8" />
        <SliderInput label="Neural Balance (Mood)" value={mood} onChange={setMood} min={1} max={10} color="#86A789" />
      </div>

      <div className="mb-10">
        <label className="text-[9px] uppercase tracking-[0.4em] font-black opacity-40 mb-3 block">Subjective Notes</label>
        <input 
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe specific sensations..."
          className="w-full bg-transparent border-b border-current/20 py-3 outline-none font-serif text-lg focus:border-current transition-colors"
        />
      </div>

      <button 
        onClick={handleLog}
        className="w-full py-5 rounded-2xl bg-[#2D362E] text-white text-[10px] uppercase tracking-[0.4em] font-black hover:bg-opacity-90 transition-all shadow-xl"
        style={{ backgroundColor: isEvening ? '#4A6741' : '#2D362E' }}
      >
        Record Bio-Feedback State
      </button>
    </div>
  );
};

const SliderInput = ({ label, value, onChange, min, max, color, invert }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <label className="text-[9px] uppercase tracking-[0.3em] font-black opacity-40">{label}</label>
      <span className="text-2xl font-serif" style={{ color: value > 7 ? (invert ? '#E2725B' : '#86A789') : 'inherit' }}>{value}</span>
    </div>
    <input 
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-current/10 transition-all hover:bg-current/20"
      style={{ accentColor: color }}
    />
  </div>
);

export default BioFeedbackLogger;
