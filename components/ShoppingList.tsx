
import React from 'react';
import { ShoppingItem } from '../types';

interface Props {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onClear: () => void;
  isEvening?: boolean;
  accentProp?: string;
}

const ShoppingList: React.FC<Props> = ({ items, onToggle, onClear, isEvening, accentProp }) => {
  const categories = Array.from(new Set(items.map(item => item.category)));
  const accentColor = accentProp || (isEvening ? '#4A6741' : '#86A789');

  if (items.length === 0) return null;

  return (
    <div className="glass rounded-[3rem] p-10 mb-16 shadow-2xl border border-current/5 animate-in slide-in-from-right-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40 mb-1 block">Inventory Acquisition</span>
          <h2 className="text-4xl font-serif">Shopping List</h2>
        </div>
        <button 
          onClick={onClear}
          className="text-[9px] uppercase tracking-[0.3em] font-black opacity-40 hover:opacity-100 transition-colors"
          style={{ color: accentColor }}
        >
          Clear All
        </button>
      </div>

      <div className="space-y-10">
        {categories.map(cat => (
          <div key={cat}>
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black mb-6 flex items-center gap-4 transition-colors duration-1000" style={{ color: accentColor }}>
              <span className="w-8 h-[1px] bg-current opacity-30"></span>
              {cat}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.filter(i => i.category === cat).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onToggle(item.id)}
                  className={`p-6 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-500 ${
                    item.isPurchased 
                      ? 'bg-zinc-100/30 border-transparent opacity-40 scale-95' 
                      : 'bg-white/40 border-current/5 hover:border-current/20 shadow-sm'
                  }`}
                >
                  <span className={`text-sm font-medium ${item.isPurchased ? 'line-through text-zinc-400' : 'text-[#2D362E]'}`}>
                    {item.name}
                  </span>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-1000" style={{ color: accentColor, borderColor: item.isPurchased ? accentColor : 'currentColor', backgroundColor: item.isPurchased ? accentColor : 'transparent' }}>
                    {item.isPurchased && <span className="text-white text-[10px]">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 pt-8 border-t border-current/5 flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-black">
          Assets missing: {items.filter(i => !i.isPurchased).length}
        </p>
        <span className="text-[10px] font-serif italic opacity-40">Verification protocol active</span>
      </div>
    </div>
  );
};

export default ShoppingList;
