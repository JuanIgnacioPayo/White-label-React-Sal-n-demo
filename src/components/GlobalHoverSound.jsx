import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase/firebase';

// Shared low-latency AudioContext reused across hovers to avoid context creation lag
let sharedCtx = null;

// Web Audio API Sound Synthesizer function
export const playHoverSound = (type = 'bubble', volume = 0.3, pitch = 1.0) => {
  if (type === 'none' || volume <= 0) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedCtx) {
      sharedCtx = new AudioContextClass({ latencyHint: 'interactive' });
    }
    
    // Auto-resume if context was suspended by browser autoplay policy
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    
    const ctx = sharedCtx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'bubble') {
      osc.type = 'sine';
      const baseFreq = 400 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.05);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.start(now);
      osc.stop(now + 0.13);
    } 
    else if (type === 'click') {
      osc.type = 'triangle';
      const baseFreq = 200 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 0.5, now + 0.02);
      
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc.start(now);
      osc.stop(now + 0.05);
    }
    else if (type === 'tech') {
      osc.type = 'square';
      const baseFreq = 800 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.03);
      
      gainNode.gain.setValueAtTime(volume * 0.4, now); // scale square loudness
      gainNode.gain.setValueAtTime(volume * 0.4, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.09);
    }
    else if (type === 'bell') {
      osc.type = 'sine';
      const baseFreq = 1800 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      
      const fmOsc = ctx.createOscillator();
      const fmGain = ctx.createGain();
      fmOsc.type = 'sine';
      fmOsc.frequency.value = baseFreq * 1.414;
      fmGain.gain.value = 300;
      
      fmOsc.connect(fmGain);
      fmGain.connect(osc.frequency);
      
      gainNode.gain.setValueAtTime(volume * 0.6, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      fmOsc.start(now);
      osc.start(now);
      
      fmOsc.stop(now + 0.36);
      osc.stop(now + 0.36);
    }
    else if (type === 'wood') {
      osc.type = 'triangle';
      const baseFreq = 600 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(300 * pitch, now + 0.05);

      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.start(now);
      osc.stop(now + 0.07);
    }
    else if (type === 'glass') {
      osc.type = 'sine';
      const baseFreq = 2200 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(2400 * pitch, now + 0.04);

      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
      
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      gainNode.gain.setValueAtTime(volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      harmonicGain.gain.setValueAtTime(volume * 0.2, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      harmonicOsc.start(now);

      osc.stop(now + 0.16);
      harmonicOsc.stop(now + 0.09);
    }
    else if (type === 'pluck') {
      osc.type = 'triangle';
      const baseFreq = 440 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

      osc.disconnect(gainNode);
      osc.connect(filter);
      filter.connect(gainNode);

      gainNode.gain.setValueAtTime(volume * 0.8, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.11);
    }
    else if (type === 'water') {
      osc.type = 'sine';
      const baseFreq = 450 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(1300 * pitch, now + 0.06);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.09);
    }
    else if (type === 'chime') {
      osc.type = 'sine';
      const baseFreq = 2200 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);

      const chimeOsc2 = ctx.createOscillator();
      const chimeGain2 = ctx.createGain();
      chimeOsc2.type = 'sine';
      chimeOsc2.frequency.setValueAtTime(baseFreq * 1.25, now);
      
      chimeOsc2.connect(chimeGain2);
      chimeGain2.connect(ctx.destination);

      gainNode.gain.setValueAtTime(volume * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      chimeGain2.gain.setValueAtTime(volume * 0.15, now);
      chimeGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.start(now);
      chimeOsc2.start(now);

      osc.stop(now + 0.26);
      chimeOsc2.stop(now + 0.19);
    }
    else if (type === 'pop') {
      osc.type = 'sine';
      const baseFreq = 1600 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(400 * pitch, now + 0.03);

      gainNode.gain.setValueAtTime(volume * 0.9, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.start(now);
      osc.stop(now + 0.05);
    }
    else if (type === 'tick') {
      osc.type = 'sine';
      const baseFreq = 3000 * pitch;
      osc.frequency.setValueAtTime(baseFreq, now);

      gainNode.gain.setValueAtTime(volume * 0.8, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.start(now);
      osc.stop(now + 0.02);
    }
  } catch (error) {
    // Fail silently
  }
};

export default function GlobalHoverSound() {
  const [config, setConfig] = useState({
    soundType: 'bubble',
    volume: 0.3,
    pitch: 1.0
  });

  useEffect(() => {
    const db = getDatabase(app);
    const soundRef = ref(db, 'settings/cardHoverSound');
    const unsubscribe = onValue(soundRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setConfig({
          soundType: val.soundType || 'bubble',
          volume: val.volume !== undefined ? Number(val.volume) : 0.3,
          pitch: val.pitch !== undefined ? Number(val.pitch) : 1.0
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let lastHoveredElement = null;

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const card = target.closest(
        '.holiday-idea-card, .configured-theme-item-card, .search-item-card, .theme-settings-card, .festive-theme-card, .card, [class*="card" i]'
      );

      if (card && card !== lastHoveredElement) {
        lastHoveredElement = card;
        playHoverSound(config.soundType, config.volume, config.pitch);
      }
    };

    const handleMouseLeave = (e) => {
      const target = e.target;
      if (!target) return;

      const card = target.closest(
        '.holiday-idea-card, .configured-theme-item-card, .search-item-card, .theme-settings-card, .festive-theme-card, .card, [class*="card" i]'
      );

      if (card && card === lastHoveredElement) {
        lastHoveredElement = null;
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [config]);

  return null;
}
