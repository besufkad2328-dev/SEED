import React, { useState, useEffect } from 'react';
import { generateUIAsset } from '../services/geminiService';

interface Props {
  isEvening: boolean;
  isHome: boolean;
}

const FloatingAssets: React.FC<Props> = ({ isEvening, isHome }) => {
  const [assets, setAssets] = useState<{ id: string; url: string; delay: number; duration: number; pos: string; size: string; depth: number }[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const loadAssets = async () => {
      const subjects = [
        { name: 'halved Haas avocado with stone', pos: 'top-[5%] left-[8%]', size: 'w-48 h-48 md:w-80 md:h-80', depth: 20 },
        { name: 'fresh green spinach leaves with dew', pos: 'bottom-[10%] left-[-5%]', size: 'w-40 h-40 md:w-72 md:h-72', depth: 40 },
        { name: 'minimalist crystal glass water bottle with condensation', pos: 'top-[15%] right-[-5%]', size: 'w-44 h-44 md:w-64 md:h-64', depth: 30 }
      ];

      const loaded = await Promise.all(subjects.map(async (s, i) => {
        const url = await generateUIAsset(s.name, isEvening);
        return url ? {
          id: s.name,
          url,
          delay: i * 1.5,
          duration: 12 + i * 4,
          pos: s.pos,
          size: s.size,
          depth: s.depth
        } : null;
      }));

      setAssets(loaded.filter(a => a !== null) as any);
    };

    loadAssets();
  }, [isEvening]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[-1] overflow-hidden transition-opacity duration-1000 ${isHome ? 'opacity-100' : 'opacity-40'}`}>
      {assets.map((asset) => {
        const translateX = mousePos.x * asset.depth;
        const translateY = mousePos.y * asset.depth;
        
        return (
          <div
            key={asset.id}
            className={`absolute ${asset.pos} transition-transform duration-300 ease-out`}
            style={{ 
              transform: `translate(${translateX}px, ${translateY}px)`,
            }}
          >
            <div 
              className="animate-float-3d" 
              style={{ 
                animationDelay: `${asset.delay}s`, 
                animationDuration: `${asset.duration}s` 
              }}
            >
              <img 
                src={asset.url} 
                alt="" 
                className={`${asset.size} object-contain transition-all duration-1000 ${isEvening ? 'mix-blend-screen opacity-60' : 'mix-blend-multiply opacity-80'}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingAssets;