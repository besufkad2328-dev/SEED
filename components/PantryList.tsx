
import React, { useState } from 'react';
import { PantryItem } from '../types';

interface Props {
  pantry: PantryItem[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

const PantryList: React.FC<Props> = ({ pantry, onAdd, onRemove }) => {
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="glass rounded-[2rem] p-8 mb-12">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#86A789] mb-6 font-black">Available Resources</h3>
      <div className="flex flex-wrap gap-3 mb-8">
        {pantry.map(item => (
          <span 
            key={item.id} 
            className="inline-flex items-center px-5 py-2 rounded-full bg-white/60 text-[#2D362E] text-[10px] font-bold tracking-widest border border-[#E5E1D8] group hover:border-[#86A789]/40 transition-colors"
          >
            {item.name}
            <button 
              onClick={() => onRemove(item.id)}
              className="ml-3 text-zinc-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="New biological asset..."
          className="flex-1 bg-transparent border-b border-[#E5E1D8] focus:border-[#86A789] outline-none px-2 py-2 text-xs transition-colors font-medium text-[#2D362E] placeholder:text-zinc-300"
        />
        <button type="submit" className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400 hover:text-[#86A789] transition-colors">Add</button>
      </form>
    </div>
  );
};

export default PantryList;
