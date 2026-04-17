import { useCallback, useRef, useState } from 'react';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

function shimmer() {
  playTone(1800, 0.08, 'sine', 0.06);
}

function chimeOpen() {
  playTone(660, 0.12, 'square', 0.08);
  setTimeout(() => playTone(880, 0.15, 'square', 0.08), 80);
}

function chimeClose() {
  playTone(880, 0.1, 'square', 0.07);
  setTimeout(() => playTone(550, 0.18, 'square', 0.07), 70);
}

export function useSounds() {
  const [muted, setMuted] = useState(false);
  const lastHover = useRef(0);

  const playHover = useCallback(() => {
    if (muted || prefersReducedMotion()) return;
    const now = Date.now();
    if (now - lastHover.current < 150) return;
    lastHover.current = now;
    shimmer();
  }, [muted]);

  const playOpen = useCallback(() => {
    if (muted || prefersReducedMotion()) return;
    chimeOpen();
  }, [muted]);

  const playClose = useCallback(() => {
    if (muted || prefersReducedMotion()) return;
    chimeClose();
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  return { muted, toggleMute, playHover, playOpen, playClose };
}
