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
  const [error, setError] = useState<string | null>(null);
  const [isEvening, setIsEvening] = useState(false);
  const [timeTravelMonths, setTimeTravelMonths] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

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

  const handleLogMeal = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    
    const trimmedInput = mealInput.trim();
    if (!trimmedInput || isAnalyzing) return;
    
    if (trimmedInput.length < 5) {
      setError("Provide deeper biological details for metabolic precision.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeMealWithAura(
        trimmedInput,
        state.goal,
        state.targetMacros,
        state.pantry,
        state.userProfile,
        state.history,
        state.bioFeedbackHistory
      );
      
      if (!analysis || !analysis.mealName) {
        throw new Error("Neural resolution failure.");
      }

      setState(prev => ({
        ...prev,
        history: [analysis, ...prev.history],
        performancePulse: [...prev.performancePulse.slice(1), analysis.goalAlignment]
      }));
      setMealInput('');
    } catch (err) {
      setError("Metabolic sync interrupted. SEED is recalibrating. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleLogMeal(e);
    }
  };

  const LandingPage = () => {
    const futureProphecy = useMemo(() => {
      if (timeTravelMonths === 0) return null;
      const targetDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(Date.now() + timeTravelMonths * 30 * 24 * 60 * 60 * 1000));
      if (state.goal === GoalType.WEIGHT_LOSS) return `Expect a net biological reduction of ${(timeTravelMonths * 1.8).toFixed(1)}kg by ${targetDate}.`;
      if (state.goal === GoalType.WEIGHT_GAIN) return `Structural mass projection: +${(timeTravelMonths * 1.2).toFixed(1)}kg by ${targetDate}.`;
      return `Projected cognitive focus uplift of ${timeTravelMonths * 5}% by ${targetDate}.`;
    }, [timeTravelMonths]);

    return (
      <div className="w-full">
        {/* High-Conversion Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center p-6 text-center pt-32">
          <DailyBloom progress={timeTravelMonths > 0 ? 1 : 0.72} isEvening={isEvening} forestDensity={timeTravelMonths / 6} accentProp={dynamicAccent} />
          
          <div className="max-w-5xl mt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 glass px-5 py-2 rounded-full border border-zinc-200/50">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Nutritionist-Approved Intelligence</span>
              </div>
              <div className="flex items-center gap-2 glass px-5 py-2 rounded-full border border-zinc-200/50">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Science-Backed Databases</span>
              </div>
            </div>

            <h1 className="text-6xl md:text-9xl font-serif mb-10 leading-tight">
              Track <span className="italic" style={{ color: dynamicAccent }}>Nutrition</span>,<br/>Not Just Calories.
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-500 mb-16 max-w-3xl mx-auto leading-relaxed font-serif italic">
              "The synthesis of high-end organic science and culinary strategy. SEED deciphers the biological impact of every ingredient on your cognitive performance."
            </p>

            {/* Social Proof & Trust Badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-16 mb-20">
               <div className="flex flex-col items-center group">
                  <div className="flex -space-x-3 mb-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-black text-white text-[8px] flex items-center justify-center font-black uppercase">+500k</div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-center leading-relaxed">
                    Joined by 500k+ <br/>health-conscious eaters
                  </span>
               </div>
               
               <div className="w-[1px] h-12 bg-current opacity-10 hidden md:block"></div>
               
               <div className="flex flex-col items-center">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <span className="text-[10px] font-serif italic opacity-60 max-w-[180px] leading-relaxed text-center">
                    "Finally, an app that understands ingredient synergy, not just math."
                  </span>
               </div>
            </div>
            
            <div className="flex flex-col items-center gap-12">
               <div className="w-full max-w-lg glass p-10 rounded-[3rem] border border-zinc-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 opacity-10 bg-gradient-to-r from-transparent via-current to-transparent"></div>
                  <p className="text-[10px] uppercase tracking-[0.5em] font-black mb-8 opacity-40">Predictive Temporal Bio-Shift</p>
                  
                  <div className="relative mb-10 px-4">
                    <input 
                      type="range" 
                      min="0" max="6" 
                      value={timeTravelMonths} 
                      onChange={(e) => setTimeTravelMonths(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: dynamicAccent }}
                    />
                    <div className="flex justify-between mt-6">
                       <span className="text-[9px] font-black opacity-30 tracking-tighter">METABOLIC ORIGIN</span>
                       <span className="text-[9px] font-black opacity-30 tracking-tighter uppercase">T + {timeTravelMonths} MONTHS PROTOCOL</span>
                    </div>
                  </div>

                  {futureProphecy && (
                    <div className="p-8 bg-white/40 rounded-[2.5rem] border border-zinc-100 shadow-inner animate-in zoom-in duration-500">
                        <p className="text-2xl font-serif italic" style={{ color: dynamicAccent }}>"{futureProphecy}"</p>
                    </div>
                  )}
               </div>

               <button 
                onClick={() => setView('active')}
                className="group relative px-20 py-8 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
               >
                  <div className="absolute inset-0 bg-black group-hover:bg-zinc-800 transition-colors"></div>
                  <span className="relative z-10 text-white text-[11px] uppercase tracking-[0.7em] font-black">Initialize Experience</span>
               </button>
               
               <p className="text-[9px] uppercase tracking-[0.4em] font-black opacity-30">No subscription required for initial sync</p>
            </div>
          </div>
        </section>

        {/* Features & Integrations Section */}
        <section className="py-40 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Built for Biological Excellence.</h2>
            <div className="h-1 w-24 bg-current opacity-10 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-32">
            {[
              { title: "Cellular Transparency", desc: "Most apps stop at macros. SEED analyzes anti-nutrients, inflammation vectors, and neural precursors." },
              { title: "Dynamic Logistics", desc: "Your shopping list is a living document, evolving with your goals and available biological assets." },
              { title: "Bio-Feedback Loops", desc: "We correlate what you eat with how you feel, identifying hidden sensitivities before they become chronic." }
            ].map((f, i) => (
              <div key={i} className="flex flex-col">
                 <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center mb-8 font-serif italic text-xl opacity-30">{i+1}</div>
                 <h3 className="text-2xl font-serif mb-6">{f.title}</h3>
                 <p className="text-sm opacity-50 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass p-12 rounded-[4rem] border border-current/5 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h3 className="text-2xl font-serif mb-4">Elite Integrations</h3>
              <p className="text-sm opacity-40 leading-relaxed font-light mb-8">Seamlessly sync with your existing biological measurement ecosystem.</p>
              <div className="flex flex-wrap gap-4 opacity-30 grayscale">
                 <div className="px-5 py-2 border border-current rounded-full text-[9px] font-black uppercase tracking-widest">Apple Health</div>
                 <div className="px-5 py-2 border border-current rounded-full text-[9px] font-black uppercase tracking-widest">Oura</div>
                 <div className="px-5 py-2 border border-current rounded-full text-[9px] font-black uppercase tracking-widest">Whoop</div>
              </div>
            </div>
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border border-current/10 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-current opacity-5 group-hover:opacity-10 transition-opacity"></div>
               <span className="text-6xl group-hover:scale-125 transition-transform">🧬</span>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isEvening ? 'bg-[#0F0D0C] text-[#FDFCF8]' : 'bg-[#F9F8F4] text-[#2D362E]'}`}>
      <AmbientSoundController isEvening={isEvening} isMuted={isAudioMuted} accentColor={dynamicAccent} />
      <FloatingAssets isEvening={isEvening} isHome={view === 'home'} />
      
      {/* Platform Header */}
      <header className="fixed top-0 left-0 w-full z-50 h-24 flex items-center px-10 transition-all">
        <div className="max-w-[1600px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
             <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center transition-transform group-hover:rotate-180">
               <span className="w-1 h-1 bg-current rounded-full"></span>
             </div>
             <h1 className="text-2xl font-black tracking-tighter uppercase">SEED</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setView(view === 'home' ? 'active' : 'home')}
              className="w-12 h-12 rounded-full glass border border-zinc-200/50 flex items-center justify-center hover:scale-110 transition-all shadow-xl backdrop-blur-md"
            >
              {view === 'home' ? '⚡' : '🏠'}
            </button>
            <button 
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="w-12 h-12 rounded-full glass border border-zinc-200/50 flex items-center justify-center hover:scale-110 transition-all shadow-xl backdrop-blur-md"
            >
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 relative z-10">
        {view === 'home' ? (
          <LandingPage />
        ) : (
          <div className="pt-32 animate-in fade-in duration-1000">
            <StatsHeader state={state} isEvening={isEvening} accentProp={dynamicAccent} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
              <div className="lg:col-span-2 space-y-12">
                {/* Refined Intake Section: Multi-line Support & Character Density */}
                <div className="glass rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group border border-current/5">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-focus-within:opacity-20 transition-opacity">
                    <span className="text-[100px] pointer-events-none">🧬</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-12">
                    <div className="flex flex-col">
                      <h3 className="text-[11px] uppercase tracking-[0.6em] font-black opacity-40 mb-1">Metabolic Feed</h3>
                      <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">Neural v3.2.1-Active</span>
                    </div>
                    <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-current/10">
                       <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">Real-time Correlation</span>
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={mealInput}
                      onChange={(e) => setMealInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isEvening ? "Describe recovery assets (e.g., Tart cherry juice, magnesium-rich spinach, amino dinner)..." : "Describe performance fuel (e.g., 200g Wild Salmon, avocado, complex greens, fermented assets)..."}
                      className={`w-full h-64 bg-transparent border-none outline-none resize-none font-serif text-4xl md:text-5xl placeholder:opacity-20 transition-all focus:placeholder:opacity-10 leading-[1.2] custom-scrollbar overflow-y-auto ${isAnalyzing ? 'animate-pulse pointer-events-none opacity-50' : ''}`}
                    />
                    
                    {/* Character Density Tracker */}
                    <div className="absolute bottom-[-30px] left-0 flex items-center gap-6 select-none">
                      <div className="flex items-baseline gap-2 opacity-30">
                        <span className="text-[10px] font-black tracking-widest uppercase">Input Density</span>
                        <span className="text-xl font-serif">{mealInput.length}</span>
                      </div>
                      <div className="h-1.5 w-32 bg-current/5 rounded-full overflow-hidden opacity-30">
                         <div className="h-full bg-current transition-all duration-300" style={{ width: `${Math.min((mealInput.length / 400) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {error && <div className="mt-16 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
                    <span className="text-rose-500 text-xl">⚠️</span>
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">{error}</p>
                  </div>}

                  <div className="mt-20 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="order-2 md:order-1 flex flex-col items-center md:items-start opacity-30">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 italic">Protocol Execution</span>
                       <span className="text-[9px] font-black tracking-widest uppercase">⌘ + ENTER TO COMMENCE SYNC</span>
                    </div>
                    
                    <button 
                      onClick={handleLogMeal}
                      disabled={isAnalyzing || mealInput.trim().length === 0}
                      className={`order-1 md:order-2 px-16 py-7 rounded-full text-white text-[11px] uppercase tracking-[0.5em] font-black transition-all shadow-2xl flex items-center gap-5 ${isAnalyzing || mealInput.trim().length === 0 ? 'bg-zinc-400 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}`}
                      style={!isAnalyzing && mealInput.trim().length > 0 ? { backgroundColor: dynamicAccent, color: isEvening ? '#0F0D0C' : '#FDFCF8' } : {}}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
                          <span>Syncing Neural Pathways...</span>
                        </>
                      ) : (
                        <>
                          <span>Execute Metabolic Sync</span>
                          <span className="opacity-40 text-sm">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {state.history.length > 0 ? (
                  <div className="space-y-12">
                    {state.history.map((analysis, idx) => (
                      <AnalysisCard key={idx} analysis={analysis} />
                    ))}
                  </div>
                ) : (
                  <div className="py-40 text-center glass rounded-[4rem] opacity-20 border-2 border-dashed border-current/10">
                    <p className="text-[12px] uppercase tracking-[0.8em] font-black">Metabolic History Empty</p>
                  </div>
                )}
              </div>

              <div className="space-y-12">
                <div className="sticky top-32 space-y-12">
                  <HydrationTracker 
                    current={state.hydrationOunces} 
                    log={state.hydrationLog}
                    onAdd={(oz) => setState(prev => ({
                      ...prev,
                      hydrationOunces: prev.hydrationOunces + oz,
                      hydrationLog: [{ id: Math.random().toString(), timestamp: new Date().toISOString(), amount: oz }, ...prev.hydrationLog]
                    }))}
                    isEvening={isEvening}
                    accentProp={dynamicAccent}
                  />
                  <PerformancePulse scores={state.performancePulse} isEvening={isEvening} accentProp={dynamicAccent} />
                  <PantryList 
                    pantry={state.pantry} 
                    onAdd={(name) => setState(prev => ({ ...prev, pantry: [...prev.pantry, { id: Math.random().toString(), name }] }))}
                    onRemove={(id) => setState(prev => ({ ...prev, pantry: prev.pantry.filter(p => p.id !== id) }))}
                  />
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowVault(!showVault)}
                      className="w-full py-7 glass rounded-[3rem] text-[10px] uppercase tracking-[0.5em] font-black hover:bg-white/40 transition-all border border-zinc-200/50 backdrop-blur-md shadow-lg"
                    >
                      {showVault ? 'Deactivate Vault' : 'Metabolic Identity'}
                    </button>
                    <button 
                      onClick={() => setShowLogger(!showLogger)}
                      className="w-full py-7 glass rounded-[3rem] text-[10px] uppercase tracking-[0.5em] font-black hover:bg-white/40 transition-all border border-zinc-200/50 backdrop-blur-md shadow-lg"
                    >
                      {showLogger ? 'Deactivate Feedback' : 'Bio-Feedback Log'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showVault && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
                 <div className="w-full max-w-4xl relative animate-in zoom-in duration-500">
                    <HealthVault profile={state.userProfile} onUpdate={(field, value) => setState(prev => ({ ...prev, userProfile: { ...prev.userProfile, [field]: value } }))} isEvening={isEvening} />
                    <button onClick={() => setShowVault(false)} className="absolute top-8 right-12 text-2xl font-black opacity-30 hover:opacity-100 transition-opacity">×</button>
                 </div>
              </div>
            )}
            
            {showLogger && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
                 <div className="w-full max-w-xl relative animate-in zoom-in duration-500">
                    <BioFeedbackLogger 
                      onLog={(entry) => {
                        setState(prev => ({
                          ...prev,
                          bioFeedbackHistory: [{ ...entry, id: Math.random().toString(), timestamp: new Date().toISOString() }, ...prev.bioFeedbackHistory]
                        }));
                        setShowLogger(false);
                      }}
                      isEvening={isEvening} 
                    />
                    <button onClick={() => setShowLogger(false)} className="absolute top-8 right-12 text-2xl font-black opacity-30 hover:opacity-100 transition-opacity">×</button>
                 </div>
              </div>
            )}

            <MealPlanner 
              mealPlan={state.mealPlan} 
              onUpdate={(plan) => setState(prev => ({ ...prev, mealPlan: plan }))}
              onGenerateShoppingList={async () => {
                try {
                   const list = await generateShoppingListFromPlan(state.mealPlan, state.pantry);
                   setState(prev => ({ ...prev, shoppingList: list }));
                } catch (e) { console.error(e); }
              }}
              isEvening={isEvening}
              accentProp={dynamicAccent}
            />

            {state.shoppingList.length > 0 && (
              <ShoppingList 
                items={state.shoppingList} 
                onToggle={(id) => setState(prev => ({
                  ...prev,
                  shoppingList: prev.shoppingList.map(item => item.id === id ? { ...item, isPurchased: !item.isPurchased } : item)
                }))}
                onClear={() => setState(prev => ({ ...prev, shoppingList: [] }))}
                isEvening={isEvening}
                accentProp={dynamicAccent}
              />
            )}
          </div>
        )}
      </main>

      <WaveFooter isEvening={isEvening} accentProp={dynamicAccent} progress={progress} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        body.evening .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default App;