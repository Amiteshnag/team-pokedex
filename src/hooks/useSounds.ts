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

// ── Chiptune BGM ──────────────────────────────────────────────────────────────

// Pokemon town-inspired looping melody — [frequency_hz, duration_sec], 0 = rest
const MELODY: [number, number][] = [
  // phrase 1
  [659.25, 0.15], [783.99, 0.15], [880.00, 0.30],
  [783.99, 0.15], [659.25, 0.15], [523.25, 0.30],
  [587.33, 0.15], [659.25, 0.15], [523.25, 0.30],
  [392.00, 0.15], [440.00, 0.15], [493.88, 0.15], [523.25, 0.15], [587.33, 0.30],
  [523.25, 0.15], [493.88, 0.15], [440.00, 0.15], [0, 0.15], [392.00, 0.30], [0, 0.30],
  // phrase 2
  [523.25, 0.15], [659.25, 0.15], [783.99, 0.30],
  [659.25, 0.15], [587.33, 0.15], [523.25, 0.30],
  [440.00, 0.15], [493.88, 0.15], [523.25, 0.30],
  [329.63, 0.15], [392.00, 0.15], [440.00, 0.15], [493.88, 0.15], [523.25, 0.30],
  [440.00, 0.15], [392.00, 0.15], [329.63, 0.15], [0, 0.15], [261.63, 0.60], [0, 0.30],
];

class ChiptunePlayer {
  private noteIndex = 0;
  private nextNoteTime = 0;
  private masterGain: GainNode | null = null;
  started = false;

  startOnce() {
    if (this.started || prefersReducedMotion()) return;
    this.started = true;
    const ac = getCtx();
    this.masterGain = ac.createGain();
    this.masterGain.gain.setValueAtTime(0.035, ac.currentTime);
    this.masterGain.connect(ac.destination);
    this.nextNoteTime = ac.currentTime + 0.5;
    this.tick();
  }

  private tick() {
    const ac = getCtx();
    while (this.nextNoteTime < ac.currentTime + 0.1) {
      const [freq, dur] = MELODY[this.noteIndex % MELODY.length];
      if (freq > 0 && this.masterGain) {
        const osc = ac.createOscillator();
        const ng = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.nextNoteTime);
        ng.gain.setValueAtTime(1, this.nextNoteTime);
        ng.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + dur * 0.8);
        osc.connect(ng).connect(this.masterGain);
        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + dur);
      }
      this.nextNoteTime += dur;
      this.noteIndex = (this.noteIndex + 1) % MELODY.length;
    }
    setTimeout(() => this.tick(), 40);
  }

  setMuted(muted: boolean) {
    if (!this.masterGain) return;
    const ac = getCtx();
    if (muted) {
      this.masterGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0.035, ac.currentTime + 0.4);
    }
  }
}

const bgm = new ChiptunePlayer();

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSounds() {
  const [muted, setMuted] = useState(false);
  const lastHover = useRef(0);

  const playHover = useCallback(() => {
    bgm.startOnce();
    if (muted || prefersReducedMotion()) return;
    const now = Date.now();
    if (now - lastHover.current < 150) return;
    lastHover.current = now;
    shimmer();
  }, [muted]);

  const playOpen = useCallback(() => {
    bgm.startOnce();
    if (muted || prefersReducedMotion()) return;
    chimeOpen();
  }, [muted]);

  const playClose = useCallback(() => {
    if (muted || prefersReducedMotion()) return;
    chimeClose();
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      bgm.setMuted(next);
      return next;
    });
  }, []);

  return { muted, toggleMute, playHover, playOpen, playClose };
}
