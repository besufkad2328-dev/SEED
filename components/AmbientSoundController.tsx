
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isEvening: boolean;
  isMuted: boolean;
  accentColor: string;
}

const AmbientSoundController: React.FC<Props> = ({ isEvening, isMuted, accentColor }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const morningNodeRef = useRef<BiquadFilterNode | null>(null);
  const eveningNodeRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (isMuted) {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current!.currentTime, 1);
      }
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }

    const ctx = audioCtxRef.current;
    const masterGain = gainNodeRef.current!;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Fade in master gain
    masterGain.gain.setTargetAtTime(0.15, ctx.currentTime, 2);

    // Setup Morning Profile: Wind/Leaves
    if (!morningNodeRef.current) {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      const filterLFO = ctx.createOscillator();
      filterLFO.frequency.value = 0.1;
      const filterLFOGain = ctx.createGain();
      filterLFOGain.gain.value = 300;
      
      filterLFO.connect(filterLFOGain);
      filterLFOGain.connect(filter.frequency);
      filterLFO.start();

      whiteNoise.connect(filter);
      morningNodeRef.current = filter;
      whiteNoise.start();
    }

    // Setup Evening Profile: Deep Hum
    if (eveningNodeRef.current.length === 0) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc1.frequency.value = 55; // A1
      osc2.frequency.value = 82.41; // E2 (Perfect fifth)
      osc1.type = 'sine';
      osc2.type = 'sine';

      lfoRef.current = ctx.createOscillator();
      lfoRef.current.frequency.value = 0.08; // Very slow breathing
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;

      lfoRef.current.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      
      eveningNodeRef.current = [osc1, osc2];
      lfoRef.current.start();
      osc1.start();
      osc2.start();

      // Store local gain to control profile fade
      (oscGain as any).id = 'eveningGain';
    }

    // Crossfade Logic
    const eveningGain = ctx.createGain(); // Proxy for cleaner control
    const morningGain = ctx.createGain();

    morningNodeRef.current.connect(morningGain);
    morningGain.connect(masterGain);

    // Assuming we manage the connection to the deep hum oscillators
    const eveningOscGain = ctx.createGain();
    eveningNodeRef.current.forEach(osc => osc.connect(eveningOscGain));
    eveningOscGain.connect(eveningGain);
    eveningGain.connect(masterGain);

    if (isEvening) {
      morningGain.gain.setTargetAtTime(0, ctx.currentTime, 2);
      eveningGain.gain.setTargetAtTime(0.3, ctx.currentTime, 2);
    } else {
      morningGain.gain.setTargetAtTime(0.2, ctx.currentTime, 2);
      eveningGain.gain.setTargetAtTime(0, ctx.currentTime, 2);
    }

    return () => {
      // Cleanup happens on unmount or manual trigger, 
      // but here we mostly want to manage the gains.
    };
  }, [isEvening, isMuted]);

  return null; // Logic-only component
};

export default AmbientSoundController;
