
import React, { useState } from 'react';
import { MealPlanEntry } from '../types';

interface Props {
  mealPlan: MealPlanEntry[];
  onUpdate: (plan: MealPlanEntry[]) => void;
  onGenerateShoppingList: () => void;
  isEvening?: boolean;
  accentProp?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const MealPlanner: React.FC<Props> = ({ mealPlan, onUpdate, onGenerateShoppingList, isEvening, accentProp }) => {
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMeal, setNewMeal] = useState<Partial<MealPlanEntry>>({ day: activeDay, mealType: 'Lunch', ingredients: [] });
  const [ingInput, setIngInput] = useState('');

  const currentDayMeals = mealPlan.filter(m => m.day === activeDay);

  const handleAddMeal = () => {
    if (newMeal.mealName) {
      onUpdate([...mealPlan, newMeal as MealPlanEntry]);
      setIsAdding(false);
      setNewMeal({ day: activeDay, mealType: 'Lunch', ingredients: [] });
    }
  };

  const removeMeal = (index: number) => {
    onUpdate(mealPlan.filter((_, i) => i !== index));
  };

  const accentColor = accentProp || (isEvening ? '#4A6741' : '#86A789');

  return (
    <div className="glass rounded-[3rem] p-10 mb-16 shadow-2xl overflow-hidden border border-current/5">
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40 mb-1 block">Logistics Engine</span>
          <h2 className="text-4xl font-serif">Meal Planning</h2>
        </div>
        <button 
          onClick={onGenerateShoppingList}
          className="px-8 py-3 rounded-full bg-[#2D362E] text-white text-[9px] uppercase tracking-[0.3em] font-black hover:opacity-80 transition-all"
          style={{ backgroundColor: accentColor }}
        >
          Generate Shopping List
        </button>
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-6 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-black transition-all whitespace-nowrap ${
              activeDay === day ? 'bg-current text-white scale-110' : 'opacity-40 hover:opacity-100'
            }`}
            style={activeDay === day ? { backgroundColor: accentColor } : { color: accentColor }}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-6 min-h-[300px]">
        {currentDayMeals.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-current/10 rounded-[2rem] opacity-30">
            <span className="text-4xl mb-4">🍽️</span>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black">No structural plans for {activeDay}</p>
          </div>
        )}

        {currentDayMeals.map((meal, idx) => (
          <div key={idx} className="bg-white/40 p-8 rounded-[2rem] border border-current/5 flex justify-between items-start group">
            <div>
              <span className="text-[9px] uppercase tracking-[0.3em] font-black opacity-40 mb-2 block" style={{ color: accentColor }}>{meal.mealType}</span>
              <h4 className="text-2xl font-serif mb-3">{meal.mealName}</h4>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ing, i) => (
                  <span key={i} className="text-[8px] bg-white/60 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-current/5 opacity-60">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
            <button 
              onClick={() => removeMeal(mealPlan.indexOf(meal))}
              className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:scale-125 transition-all"
            >
              ×
            </button>
          </div>
        ))}

        {isAdding ? (
          <div className="bg-white/60 p-10 rounded-[2.5rem] border border-current/10 animate-in slide-in-from-top-4">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2">Meal Type</label>
                <select 
                  className="bg-transparent border-b border-current/20 py-2 outline-none font-serif"
                  value={newMeal.mealType}
                  onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value as any })}
                >
                  {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2">Meal Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Quinoa Salmon Bowl"
                  className="bg-transparent border-b border-current/20 py-2 outline-none font-serif text-xl"
                  value={newMeal.mealName || ''}
                  onChange={(e) => setNewMeal({ ...newMeal, mealName: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-8">
               <label className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-black mb-2 block">Ingredients</label>
               <div className="flex gap-4">
                  <input 
                    type="text"
                    placeholder="Add ingredient..."
                    className="flex-1 bg-transparent border-b border-current/20 py-2 outline-none text-sm"
                    value={ingInput}
                    onChange={(e) => setIngInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && ingInput.trim()) {
                        setNewMeal({ ...newMeal, ingredients: [...(newMeal.ingredients || []), ingInput.trim()] });
                        setIngInput('');
                      }
                    }}
                  />
                  <button onClick={() => {
                    if (ingInput.trim()) {
                      setNewMeal({ ...newMeal, ingredients: [...(newMeal.ingredients || []), ingInput.trim()] });
                      setIngInput('');
                    }
                  }} className="text-[10px] uppercase font-black opacity-40 hover:opacity-100">Add</button>
               </div>
               <div className="flex flex-wrap gap-2 mt-4">
                  {newMeal.ingredients?.map((ing, i) => (
                    <span key={i} className="text-[8px] bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                      {ing}
                    </span>
                  ))}
               </div>
            </div>
            <div className="flex gap-4">
               <button onClick={handleAddMeal} className="flex-1 py-4 rounded-2xl text-white text-[9px] uppercase tracking-[0.3em] font-black transition-colors" style={{ backgroundColor: accentColor }}>Confirm Schedule</button>
               <button onClick={() => setIsAdding(false)} className="px-8 py-4 rounded-2xl border border-current/20 text-[9px] uppercase tracking-[0.3em] font-black">Cancel</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-6 border-2 border-dashed border-current/10 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black opacity-40 hover:opacity-100 transition-all hover:bg-white/20"
          >
            + Add Structural Meal
          </button>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
