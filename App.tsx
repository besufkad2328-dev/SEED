
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, GoalType, PantryItem, UserProfile, UITheme, Gender, ActivityLevel, MealPlanEntry, ShoppingItem, HealthLogEntry, BioFeedbackEntry, HydrationEntry } from './types';
import { DEFAULT_TARGETS, INITIAL_PANTRY } from './constants';
import { analyzeMealWithAura, generateShoppingListFromPlan } from './services/geminiService';
import StatsHeader from './components/StatsHeader';
import PantryList from './components/PantryList';
import AnalysisCard from './components/AnalysisCard';
import DailyBloom from './components/DailyBloom';
import HydrationTracker from './components/HydrationTracker';
import PerformancePulse from './components/PerformancePulse';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import HealthVault from './components/HealthVault';
import BioFeedbackLogger from './components/BioFeedbackLogger';
import WaveFooter from './components/WaveFooter';
import FloatingAssets from './components/FloatingAssets';
import AmbientSoundController from './components/AmbientSoundController';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('seed_state');
    const initialProfile: UserProfile = {
      age: 28,
      weightKg: 75,
      heightCm: 180,
      gender: Gender.MALE,
      activityLevel: ActivityLevel.MODERATE,
      healthGoals: ['Metabolic Stability', 'Peak Cognitive Function'],
      weightHistory: [
        { date: '2023-10-01', weightKg: 76.5, bmi: 23.6 },
        { date: '2023-10-15', weightKg: 75.8, bmi: 23.4 },
        { date: '2023-10-29', weightKg: 75.0, bmi: 23.1 }
      ],
      hydrationGoalOunces: 128
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const lastUpdate = new Date(parsed.lastUpdate || 0).toDateString();
        const today = new Date().toDateString();
        if (lastUpdate !== today) {
          parsed.hydrationOunces = 0;
          parsed.hydrationLog = [];
        }
        return { ...parsed, userProfile: { ...initialProfile, ...parsed.userProfile } };
      } catch (e) {
        console.error("State hydration failed", e);
      }
    }

    return {
      userName: 'Elite Member',
      goal: GoalType.MAINTENANCE,
      userProfile: initialProfile,
      targetKcal: DEFAULT_TARGETS[GoalType.MAINTENANCE].kcal,
      targetMacros: DEFAULT_TARGETS[GoalType.MAINTENANCE],
      pantry: INITIAL_PANTRY,
      history: [],
      bioFeedbackHistory: [],
      hydrationOunces: 0,
      hydrationLog: [],
      isPerformanceMode: false,
      performancePulse: [50, 65, 60, 85, 80, 95, 90],
      mealPlan: [],
      shoppingList: []
    };
  });

  const [view, setView] = useState<'home' | 'active'>('home');
  const [showVault, setShowVault] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [mealInput, setMealInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEvening, setIsEvening] = useState(false);
  const [timeTravelMonths, setTimeTravelMonths] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  useEffect(() => {
    localStorage.setItem('seed_state', JSON.stringify({ ...state, lastUpdate: new Date().toISOString() }));
  }, [state]);

  const dynamicAccent = useMemo(() => {
    const base = isEvening ? '#D27D56' : '#A3FF00';
    const factor = timeTravelMonths / 6;
    if (factor === 0) return base;

    if (state.goal === GoalType.WEIGHT_GAIN) {
      return isEvening ? '#F4A460' : '#A3FF00';
    } else if (state.goal === GoalType.WEIGHT_LOSS) {
      return isEvening ? '#CD5C5C' : '#4FB3B5';
    }
    return base;
  }, [timeTravelMonths, state.goal, isEvening]);

  const calculatedTargets = useMemo(() => {
    const { weightKg, heightCm, age, gender, activityLevel } = state.userProfile;
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (gender === Gender.MALE) bmr += 5;
    else if (gender === Gender.FEMALE) bmr -= 161;
    else bmr -= 78;

    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.ACTIVE]: 1.725,
      [ActivityLevel.EXTRA_ACTIVE]: 1.9
    };
    
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));
    let targetKcal = tdee;
    if (state.goal === GoalType.WEIGHT_LOSS) targetKcal -= 500;
    else if (state.goal === GoalType.WEIGHT_GAIN) targetKcal += 500;

    const p = Math.round((targetKcal * 0.3) / 4);
    const c = Math.round((targetKcal * 0.4) / 4);
    const f = Math.round((targetKcal * 0.3) / 9);

    return { kcal: targetKcal, protein: p, carbs: c, fat: f };
  }, [state.userProfile, state.goal]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      targetKcal: calculatedTargets.kcal,
      targetMacros: { ...calculatedTargets }
    }));
  }, [calculatedTargets]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', dynamicAccent);
    
    const totalKcal = state.history.reduce((acc, m) => acc + m.stats.kcal, 0);
    const baseDensity = Math.min(0.1 + (totalKcal / state.targetKcal) * 0.2, 0.4);
    const density = Math.min(baseDensity + (timeTravelMonths / 12), 0.7);
    root.style.setProperty('--wash-opacity', density.toString());
  }, [state.history, state.targetKcal, timeTravelMonths, dynamicAccent]);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      const eveningStatus = hour >= 18 || hour < 6;
      setIsEvening(eveningStatus);
      if (eveningStatus) document.body.classList.add('evening');
      else document.body.classList.remove('evening');
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalKcal = useMemo(() => 
    state.history.reduce((acc, meal) => acc + meal.stats.kcal, 0),
  [state.history]);

  const progress = Math.min(totalKcal / state.targetKcal, 1);

  const morningQuote = useMemo(() => {
    if (isEvening) return "Metabolic recovery initiated. Optimizing nocturnal cellular repair.";
    return "Precision fuel for peak performance. Your biological engine is primed.";
  }, [isEvening]);

  const futureProphecy = useMemo(() => {
    if (timeTravelMonths === 0) return null;
    const consistency = state.history.length > 0 
      ? Math.round(state.history.reduce((acc, m) => acc + m.goalAlignment, 0) / state.history.length) 
      : 85;
    
    const targetDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(Date.now() + timeTravelMonths * 30 * 24 * 60 * 60 * 1000));

    if (state.goal === GoalType.WEIGHT_LOSS) {
      return `At ${consistency}% precision, your basal metabolic efficiency will optimize by ${timeTravelMonths * 3}%. Expect a net reduction of ${(timeTravelMonths * 1.8).toFixed(1)}kg by ${targetDate}.`;
    } else if (state.goal === GoalType.WEIGHT_GAIN) {
      return `Structural mass projection: +${(timeTravelMonths * 1.2).toFixed(1)}kg by ${targetDate}. Your anabolic recovery window will shorten as mitochondrial density peaks.`;
    }
    return `Biological homeostasis verified. Projected cognitive performance increase of ${timeTravelMonths * 5}% due to sustained glucose stability by ${targetDate}.`;
  }, [timeTravelMonths, state.goal, state.history]);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealInput.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeMealWithAura(
        mealInput,
        state.goal,
        state.targetMacros,
        state.pantry,
        state.userProfile,
        state.history,
        state.bioFeedbackHistory
      );
      setState(prev => ({
        ...prev,
        history: [analysis, ...prev.history],
        performancePulse: [...prev.performancePulse.slice(1), analysis.goalAlignment]
      }));
      setMealInput('');
    } catch (err) {
      setError("Metabolic sync failed. SEED is recalibrating...");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddHydration = (amount: number) => {
    const newEntry: HydrationEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      amount
    };
    setState(prev => ({
      ...prev,
      hydrationOunces: prev.hydrationOunces + amount,
      hydrationLog: [newEntry, ...prev.hydrationLog].slice(0, 20)
    }));
  };

  const handleLogBioFeedback = (entryData: Omit<BioFeedbackEntry, 'id' | 'timestamp'>) => {
    const newEntry: BioFeedbackEntry = {
      ...entryData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      bioFeedbackHistory: [newEntry, ...prev.bioFeedbackHistory]
    }));
    setShowLogger(false);
  };

  const handleUpdateProfile = (field: keyof UserProfile, value: any) => {
    setState(prev => {
      const newProfile = { ...prev.userProfile, [field]: value };
      if (field === 'weightKg') {
        const heightM = newProfile.heightCm / 100;
        const bmi = heightM > 0 ? parseFloat((newProfile.weightKg / (heightM * heightM)).toFixed(1)) : 0;
        const newLog: HealthLogEntry = {
          date: new Date().toISOString().split('T')[0],
          weightKg: newProfile.weightKg,
          bmi
        };
        const existingIndex = newProfile.weightHistory.findIndex(h => h.date === newLog.date);
        if (existingIndex >= 0) {
          newProfile.weightHistory[existingIndex] = newLog;
        } else {
          newProfile.weightHistory = [...newProfile.weightHistory, newLog];
        }
      }
      return { ...prev, userProfile: newProfile };
    });
  };

  const handleGenerateShoppingList = async () => {
    if (state.mealPlan.length === 0 || isGeneratingList) return;
    setIsGeneratingList(true);
    try {
      const list = await generateShoppingListFromPlan(state.mealPlan, state.pantry);
      setState(prev => ({ ...prev, shoppingList: list }));
    } catch (err) {
      console.error("Failed to generate list", err);
    } finally {
      setIsGeneratingList(false);
    }
  };

  const handleTimeTravelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTimeTravelMonths(value);
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }
  };

  const toggleAudio = () => setIsAudioMuted(!isAudioMuted);

  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <WaveFooter isEvening={isEvening} accentProp={dynamicAccent} progress={progress} />
        <FloatingAssets isEvening={isEvening} />
        <AmbientSoundController isEvening={isEvening} isMuted={isAudioMuted} accentColor={dynamicAccent} />
        
        <div className="fixed top-8 right-8 z-50">
           <button 
             onClick={toggleAudio}
             className="glass w-12 h-12 rounded-full flex items-center justify-center group transition-all duration-500 hover:scale-110 active:scale-95"
           >
              <div className={`relative w-4 h-4 flex items-center justify-center ${!isAudioMuted ? 'animate-pulse' : ''}`}>
                 {isAudioMuted ? (
                   <span className="text-sm opacity-40">🔇</span>
                 ) : (
                   <div className="flex gap-[2px] items-center h-full">
                     <div className="w-[2px] bg-current h-2 animate-[wave_1s_infinite_ease-in-out]"></div>
                     <div className="w-[2px] bg-current h-4 animate-[wave_1.2s_infinite_ease-in-out_delay-100]"></div>
                     <div className="w-[2px] bg-current h-3 animate-[wave_0.8s_infinite_ease-in-out_delay-200]"></div>
                   </div>
                 )}
              </div>
           </button>
        </div>

        <div className="relative mb-8 transition-transform duration-1000">
           <DailyBloom 
             progress={timeTravelMonths > 0 ? 1 : 0.72} 
             isEvening={isEvening} 
             forestDensity={timeTravelMonths / 6}
             accentProp={dynamicAccent}
           />
        </div>
        
        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            Elite <span className="italic transition-colors duration-1000" style={{ color: dynamicAccent }}>Performance.</span>
          </h1>
          
          <div className="mb-12 glass p-8 rounded-[2rem] border border-current/5 shadow-inner">
            <div className="flex justify-between items-end mb-6">
               <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">The Future You</span>
               <span className="text-lg font-serif italic transition-colors duration-1000" style={{ color: dynamicAccent }}>
                 {timeTravelMonths === 0 ? "Present Moment" : `+${timeTravelMonths} Months`}
               </span>
            </div>
            <input 
              type="range" min="0" max="6" step="1"
              value={timeTravelMonths}
              onChange={handleTimeTravelChange}
              className="w-full h-1 bg-current/10 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: dynamicAccent }}
            />
            {futureProphecy && (
              <p className="mt-8 text-sm font-serif italic leading-relaxed text-current opacity-70 animate-in fade-in slide-in-from-top-2">
                "{futureProphecy}"
              </p>
            )}
          </div>

          <button 
            onClick={() => setView('active')}
            className="px-12 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-700 shadow-2xl group text-white hover:opacity-90"
            style={{ backgroundColor: isEvening ? '#D27D56' : '#0A0C0A' }}
          >
            Access Concierge <span className="ml-3 group-hover:translate-x-2 inline-block transition-transform">→</span>
          </button>
        </div>
        <style>{`
          @keyframes wave {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-24 selection:bg-current/10">
      <WaveFooter isEvening={isEvening} accentProp={dynamicAccent} progress={progress} />
      <AmbientSoundController isEvening={isEvening} isMuted={isAudioMuted} accentColor={dynamicAccent} />
      
      <nav className="max-w-5xl mx-auto px-6 mb-20 flex justify-between items-center">
        <button onClick={() => setView('home')} className="text-[10px] uppercase tracking-[0.3em] font-black transition-colors flex items-center gap-2" style={{ color: dynamicAccent }}>
          ← Surface
        </button>
        <div className="flex items-center gap-6">
           <button onClick={toggleAudio} className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 hover:opacity-100 transition-all flex items-center gap-2">
             {isAudioMuted ? 'Muted' : 'Resonance Sync'}
             {!isAudioMuted && <span className="w-1 h-1 rounded-full bg-current animate-ping"></span>}
           </button>
           <button onClick={() => setShowLogger(!showLogger)} className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 hover:opacity-100 transition-all">
             {showLogger ? 'Close Sync' : 'Bio-Feedback'}
           </button>
           <button onClick={() => setShowVault(!showVault)} className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 hover:opacity-100 transition-all">
             {showVault ? 'Close Vault' : 'Metabolic Vault'}
           </button>
           <div className="glass px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-black flex items-center gap-2 transition-colors duration-1000" style={{ color: dynamicAccent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dynamicAccent }}></span>
            Active Sync
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        {showVault && (
          <HealthVault profile={state.userProfile} onUpdate={handleUpdateProfile} isEvening={isEvening} />
        )}

        {showLogger && (
          <BioFeedbackLogger onLog={handleLogBioFeedback} isEvening={isEvening} />
        )}

        <div className="mb-24 flex flex-col items-center">
           <DailyBloom progress={progress} isEvening={isEvening} forestDensity={0} accentProp={dynamicAccent} />
           <p className="mt-12 text-center text-sm font-serif italic opacity-40 max-w-xs">"{morningQuote}"</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
           <PerformancePulse scores={state.performancePulse} isEvening={isEvening} accentProp={dynamicAccent} />
           <HydrationTracker 
             current={state.hydrationOunces} 
             log={state.hydrationLog}
             onAdd={handleAddHydration} 
             isEvening={isEvening} 
             accentProp={dynamicAccent} 
           />
        </div>

        <StatsHeader state={state} isEvening={isEvening} accentProp={dynamicAccent} />

        <div className="flex gap-4 mb-16">
          {Object.values(GoalType).map(g => (
            <button key={g} onClick={() => setState(p => ({...p, goal: g}))} className={`flex-1 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b-2 transition-all ${state.goal === g ? 'border-current' : 'border-transparent opacity-30'}`}>{g}</button>
          ))}
        </div>

        <MealPlanner 
          mealPlan={state.mealPlan} 
          onUpdate={(p) => setState(prev => ({...prev, mealPlan: p}))}
          onGenerateShoppingList={handleGenerateShoppingList}
          isEvening={isEvening}
          accentProp={dynamicAccent}
        />

        <ShoppingList 
          items={state.shoppingList}
          onToggle={(id) => setState(prev => ({...prev, shoppingList: prev.shoppingList.map(item => item.id === id ? {...item, isPurchased: !item.isPurchased} : item)}))}
          onClear={() => setState(prev => ({...prev, shoppingList: []}))}
          isEvening={isEvening}
          accentProp={dynamicAccent}
        />

        <PantryList pantry={state.pantry} onAdd={(name) => setState(p => ({...p, pantry: [...p.pantry, {id: Math.random().toString(), name}]}))} onRemove={(id) => setState(p => ({...p, pantry: p.pantry.filter(x => x.id !== id)}))} />

        <div className="mb-20">
          <form onSubmit={handleLogMeal} className="relative group">
            <textarea
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
              placeholder={isEvening ? "Record recovery assets..." : "Log performance fuel..."}
              className="w-full h-44 border border-current/10 rounded-[2.5rem] p-10 focus:border-current outline-none transition-all resize-none font-serif text-2xl glass"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !mealInput.trim()}
              className="absolute bottom-8 right-8 text-white px-10 py-4 rounded-3xl text-[10px] uppercase tracking-[0.3em] font-black transition-all"
              style={{ backgroundColor: isEvening ? '#D27D56' : '#0A0C0A' }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
          {error && <p className="mt-4 text-center text-[10px] text-rose-400 font-black">{error}</p>}
        </div>

        <div className="space-y-12">
          {state.history.map((analysis, idx) => (
            <AnalysisCard key={idx} analysis={analysis} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;