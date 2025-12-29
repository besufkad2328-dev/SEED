
import React, { useState, useMemo, useEffect, useRef } from 'react';
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('seed_state', JSON.stringify({ ...state, lastUpdate: new Date().toISOString() }));
  }, [state]);

  const dynamicAccent = useMemo(() => {
    const base = isEvening ? '#D27D56' : '#A3FF00';
    if (timeTravelMonths === 0) return base;
    if (state.goal === GoalType.WEIGHT_GAIN) return isEvening ? '#F4A460' : '#A3FF00';
    if (state.goal === GoalType.WEIGHT_LOSS) return isEvening ? '#CD5C5C' : '#4FB3B5';
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

  const handleUpdateProfile = (field: keyof UserProfile, value: any) => {
    setState(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, [field]: value }
    }));
  };

  const LandingPage = () => {
    const futureProphecy = useMemo(() => {
      if (timeTravelMonths === 0) return null;
      const targetDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(Date.now() + timeTravelMonths * 30 * 24 * 60 * 60 * 1000));
      if (state.goal === GoalType.WEIGHT_LOSS) return `At current precision, expect a net reduction of ${(timeTravelMonths * 1.8).toFixed(1)}kg by ${targetDate}.`;
      if (state.goal === GoalType.WEIGHT_GAIN) return `Structural mass projection: +${(timeTravelMonths * 1.2).toFixed(1)}kg by ${targetDate}.`;
      return `Projected cognitive performance increase of ${timeTravelMonths * 5}% by ${targetDate}.`;
    }, []);

    return (
      <div className="w-full">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <DailyBloom progress={timeTravelMonths > 0 ? 1 : 0.72} isEvening={isEvening} forestDensity={timeTravelMonths / 6} accentProp={dynamicAccent} />
          <div className="max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-tight">
              Biological <span className="italic" style={{ color: dynamicAccent }}>Excellence.</span>
            </h1>
            <p className="text-lg md:text-xl font-serif italic opacity-60 max-w-2xl mx-auto mb-12">
              "The synthesis of high-end nutrition science and culinary strategy. Your metabolic potential, unlocked."
            </p>
            <button 
              onClick={() => setView('active')}
              className="px-16 py-6 rounded-full text-[11px] uppercase tracking-[0.5em] font-black transition-all duration-700 shadow-2xl group text-white hover:opacity-90"
              style={{ backgroundColor: isEvening ? '#D27D56' : '#0A0C0A' }}
            >
              Enter Dashboard <span className="ml-3 group-hover:translate-x-2 inline-block transition-transform">→</span>
            </button>
          </div>
        </section>

        {/* Intelligence Section */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="glass p-12 rounded-[3rem] relative overflow-hidden">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-4 block">Neural Module: AURA</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-8">Intelligence Beyond Tracking</h2>
              <p className="text-lg font-serif italic opacity-70 leading-relaxed">
                "AURA doesn't just log data. It analyzes mitochondrial efficiency, correlates glycemic stability with cognitive load, and prescribes culinary protocols that respect your biological finite resources."
              </p>
            </div>
            <div className="space-y-12">
               <div className="flex gap-8">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border border-current/10 font-serif italic text-2xl">01</div>
                  <div>
                    <h4 className="text-xl font-serif mb-2">Metabolic Precision</h4>
                    <p className="text-sm opacity-60 leading-relaxed">Calculating P/C/F ratios with Shadow Logic to account for hidden lipid structures and high-ROI nutrients.</p>
                  </div>
               </div>
               <div className="flex gap-8">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border border-current/10 font-serif italic text-2xl">02</div>
                  <div>
                    <h4 className="text-xl font-serif mb-2">Resource-Aware Chef</h4>
                    <p className="text-sm opacity-60 leading-relaxed">Curated prescriptions generated exclusively from your current biological assets (Pantry).</p>
                  </div>
               </div>
               <div className="flex gap-8">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border border-current/10 font-serif italic text-2xl">03</div>
                  <div>
                    <h4 className="text-xl font-serif mb-2">The Elite Adjustment</h4>
                    <p className="text-sm opacity-60 leading-relaxed">Precision Add/Reduce instructions for every meal to maintain homeostatic alignment.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Projections Section */}
        <section className="py-32 bg-current/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
             <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40 mb-6 block">Temporal Projections</span>
             <h2 className="text-5xl font-serif mb-16">See Your Future <span className="italic">Self.</span></h2>
             
             <div className="glass p-12 rounded-[3rem] shadow-inner mb-12">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-sm uppercase tracking-widest font-black opacity-30">Biological Timeline</span>
                  <span className="text-3xl font-serif italic" style={{ color: dynamicAccent }}>
                    {timeTravelMonths === 0 ? "Now" : `+${timeTravelMonths} Months`}
                  </span>
                </div>
                <input 
                  type="range" min="0" max="6" step="1"
                  value={timeTravelMonths}
                  onChange={(e) => setTimeTravelMonths(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-current/10 rounded-full appearance-none cursor-pointer mb-12"
                  style={{ accentColor: dynamicAccent }}
                />
                {futureProphecy && (
                  <div className="animate-in fade-in zoom-in duration-1000">
                    <p className="text-2xl font-serif italic opacity-80 leading-relaxed">
                      "{futureProphecy}"
                    </p>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Footer Teaser */}
        <section className="py-32 text-center">
            <h3 className="text-3xl font-serif mb-12 opacity-40 italic">"Quality is not an act, it is a habit."</h3>
            <button 
              onClick={() => setView('active')}
              className="text-[10px] uppercase tracking-[0.5em] font-black border-b-2 pb-2 hover:opacity-60 transition-all"
              style={{ borderColor: dynamicAccent }}
            >
              Initialize Metabolic Sync
            </button>
        </section>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Sidebar: Biometrics & Status */}
        <aside className="lg:col-span-3 space-y-12">
           <div className="sticky top-32 space-y-12">
              <PerformancePulse scores={state.performancePulse} isEvening={isEvening} accentProp={dynamicAccent} />
              <HydrationTracker 
                current={state.hydrationOunces} 
                log={state.hydrationLog}
                onAdd={(oz) => {
                  const newEntry: HydrationEntry = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), amount: oz };
                  setState(prev => ({ ...prev, hydrationOunces: prev.hydrationOunces + oz, hydrationLog: [newEntry, ...prev.hydrationLog].slice(0, 20) }));
                }} 
                isEvening={isEvening} 
                accentProp={dynamicAccent} 
              />
              <PantryList 
                pantry={state.pantry} 
                onAdd={(name) => setState(p => ({...p, pantry: [...p.pantry, {id: Math.random().toString(), name}]}))} 
                onRemove={(id) => setState(p => ({...p, pantry: p.pantry.filter(x => x.id !== id)}))} 
              />
           </div>
        </aside>

        {/* Center: Neural Feed & Logging */}
        <main className="lg:col-span-6 space-y-16">
          <StatsHeader state={state} isEvening={isEvening} accentProp={dynamicAccent} />
          
          <div className="relative group">
            <textarea
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
              placeholder={isEvening ? "Record recovery assets..." : "Log performance fuel..."}
              className="w-full h-44 border border-current/10 rounded-[2.5rem] p-10 focus:border-current outline-none transition-all resize-none font-serif text-3xl glass"
            />
            <button
              onClick={handleLogMeal}
              disabled={isAnalyzing || !mealInput.trim()}
              className="absolute bottom-8 right-8 text-white px-12 py-5 rounded-3xl text-[10px] uppercase tracking-[0.3em] font-black transition-all shadow-xl"
              style={{ backgroundColor: isEvening ? '#D27D56' : '#0A0C0A' }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Intake'}
            </button>
          </div>

          <div className="space-y-16">
            {state.history.length === 0 && (
              <div className="text-center py-24 border-2 border-dashed border-current/5 rounded-[4rem] opacity-20">
                <span className="text-6xl block mb-6">🧬</span>
                <p className="text-[11px] uppercase tracking-[0.5em] font-black">Waiting for metabolic data...</p>
              </div>
            )}
            {state.history.map((analysis, idx) => (
              <AnalysisCard key={idx} analysis={analysis} />
            ))}
          </div>
        </main>

        {/* Right Sidebar: Logistics & Goals */}
        <aside className="lg:col-span-3 space-y-12">
          <div className="sticky top-32 space-y-12">
            <div className="glass p-10 rounded-[3rem]">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40 mb-6 block">Health Goal Directive</span>
              <div className="flex flex-col gap-3">
                {Object.values(GoalType).map(g => (
                  <button 
                    key={g} 
                    onClick={() => setState(p => ({...p, goal: g}))} 
                    className={`text-left py-4 px-6 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black border transition-all ${
                      state.goal === g ? 'bg-current text-white scale-105 border-transparent' : 'border-current/10 opacity-30 hover:opacity-100'
                    }`}
                    style={state.goal === g ? { backgroundColor: dynamicAccent } : {}}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <MealPlanner 
              mealPlan={state.mealPlan} 
              onUpdate={(p) => setState(prev => ({...prev, mealPlan: p}))}
              onGenerateShoppingList={async () => {
                if (state.mealPlan.length === 0 || isGeneratingList) return;
                setIsGeneratingList(true);
                try {
                  const list = await generateShoppingListFromPlan(state.mealPlan, state.pantry);
                  setState(prev => ({ ...prev, shoppingList: list }));
                } catch (err) { console.error(err); } finally { setIsGeneratingList(false); }
              }}
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
          </div>
        </aside>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen selection:bg-current/10" ref={scrollContainerRef}>
      <WaveFooter isEvening={isEvening} accentProp={dynamicAccent} progress={progress} />
      <FloatingAssets isEvening={isEvening} />
      <AmbientSoundController isEvening={isEvening} isMuted={isAudioMuted} accentColor={dynamicAccent} />
      
      {/* Platform Header */}
      <header className="fixed top-0 left-0 w-full z-50 glass border-b border-current/5 transition-all duration-700">
        <div className="max-w-[1600px] mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
             <h1 className="text-3xl font-black tracking-tighter">SEED</h1>
             <div className="hidden md:flex flex-col">
               <span className="text-[8px] uppercase tracking-[0.4em] font-black opacity-40">Elite Health Systems</span>
             </div>
          </div>

          <nav className="flex items-center gap-8 lg:gap-12">
            <button 
              onClick={() => setView(view === 'home' ? 'active' : 'home')}
              className="text-[10px] uppercase tracking-[0.4em] font-black opacity-60 hover:opacity-100 transition-all"
            >
              {view === 'home' ? 'Launch Intelligence' : 'Surface View'}
            </button>
            <button 
              onClick={() => setShowVault(!showVault)}
              className="text-[10px] uppercase tracking-[0.4em] font-black opacity-60 hover:opacity-100 transition-all"
            >
              Identity
            </button>
            <button 
              onClick={() => setShowLogger(!showLogger)}
              className="text-[10px] uppercase tracking-[0.4em] font-black opacity-60 hover:opacity-100 transition-all"
            >
              Bio-Feed
            </button>
            
            <div className="h-8 w-[1px] bg-current opacity-10 mx-2 hidden md:block"></div>
            
            <button onClick={() => setIsAudioMuted(!isAudioMuted)} className="p-2 opacity-40 hover:opacity-100 transition-all">
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
            
            <div className="hidden md:flex items-center gap-3 glass px-5 py-2 rounded-full text-[9px] uppercase tracking-[0.3em] font-black border-current/10" style={{ color: dynamicAccent }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dynamicAccent }}></span>
              Metabolic Sync
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="pt-24">
        {showVault && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <HealthVault profile={state.userProfile} onUpdate={handleUpdateProfile} isEvening={isEvening} />
            <button onClick={() => setShowVault(false)} className="mt-6 text-white text-[10px] uppercase tracking-[0.5em] font-black w-full text-center">Close Vault</button>
          </div>
        </div>}

        {showLogger && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="max-w-xl w-full">
            <BioFeedbackLogger onLog={(d) => { setState(p => ({...p, bioFeedbackHistory: [{...d, id: Math.random().toString(), timestamp: new Date().toISOString()}, ...p.bioFeedbackHistory]})); setShowLogger(false); }} isEvening={isEvening} />
            <button onClick={() => setShowLogger(false)} className="mt-6 text-white text-[10px] uppercase tracking-[0.5em] font-black w-full text-center">Disconnect Link</button>
          </div>
        </div>}

        {view === 'home' ? <LandingPage /> : <Dashboard />}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        body.evening ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default App;
