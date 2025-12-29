
import React, { useState, useEffect } from 'react';
import { generateUIAsset } from '../services/geminiService';

interface Props {
  isEvening: boolean;
}

const FloatingAssets: React.FC<Props> = ({ isEvening }) => {
  const [assets, setAssets] = useState<{ id: string; url: string; delay: number; duration: number; pos: string; size: string }[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      const subjects = [
        { name: 'halved Haas avocado with stone', pos: 'top-[-10%] left-[5%]', size: 'w-48 h-48 md:w-64 md:h-64' },
        { name: 'fresh green spinach leaves with dew', pos: 'bottom-[15%] left-[-5%]', size: 'w-32 h-32 md:w-56 md:h-56' },
        { name: 'minimalist crystal glass water bottle with condensation', pos: 'top-[20%] right-[-8%]', size: 'w-40 h-40 md:w-60 md:h-60' }
      ];

      const loaded = await Promise.all(subjects.map(async (s, i) => {
        const url = await generateUIAsset(s.name, isEvening);
        return url ? {
          id: s.name,
          url,
          delay: i * 2,
          duration: 10 + i * 5,
          pos: s.pos,
          size: s.size
        } : null;
      }));

      setAssets(loaded.filter(a => a !== null) as any);
    };

    loadAssets();
  }, [isEvening]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`absolute ${asset.pos} animate-in fade-in duration-[3s]`}
        >
          <div 
            className="animate-float" 
            style={{ 
              animationDelay: `${asset.delay}s`, 
              animationDuration: `${asset.duration}s` 
            }}
          >
            <img 
              src={asset.url} 
              alt="" 
              className={`${asset.size} object-contain opacity-80 transition-all duration-1000 ${isEvening ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingAssets;
