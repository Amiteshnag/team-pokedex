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

// ── Shadow Monarch sounds (Barun's card) ──────────────────────────────────────

function shadowOpen() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Layer 1 — deep bass surge, the void awakening
  const bass = ac.createOscillator();
  const bassGain = ac.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(48, now);
  bass.frequency.exponentialRampToValueAtTime(38, now + 1.0);
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.22, now + 0.12);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  bass.connect(bassGain).connect(ac.destination);
  bass.start(now);
  bass.stop(now + 1.0);

  // Layer 2 — eerie descending sawtooth (portal tearing open)
  const tear = ac.createOscillator();
  const tearGain = ac.createGain();
  tear.type = 'sawtooth';
  tear.frequency.setValueAtTime(260, now + 0.06);
  tear.frequency.exponentialRampToValueAtTime(100, now + 0.65);
  tearGain.gain.setValueAtTime(0.07, now + 0.06);
  tearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  tear.connect(tearGain).connect(ac.destination);
  tear.start(now + 0.06);
  tear.stop(now + 0.7);

  // Layer 3 — dark lower harmonic (shadow echo)
  const echo = ac.createOscillator();
  const echoGain = ac.createGain();
  echo.type = 'sawtooth';
  echo.frequency.setValueAtTime(130, now + 0.12);
  echo.frequency.exponentialRampToValueAtTime(52, now + 0.65);
  echoGain.gain.setValueAtTime(0.04, now + 0.12);
  echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  echo.connect(echoGain).connect(ac.destination);
  echo.start(now + 0.12);
  echo.stop(now + 0.7);

  // Layer 4 — ethereal high shimmer (stars forging)
  const star = ac.createOscillator();
  const starGain = ac.createGain();
  star.type = 'sine';
  star.frequency.setValueAtTime(2400, now + 0.35);
  star.frequency.exponentialRampToValueAtTime(1600, now + 0.85);
  starGain.gain.setValueAtTime(0.03, now + 0.35);
  starGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
  star.connect(starGain).connect(ac.destination);
  star.start(now + 0.35);
  star.stop(now + 0.85);

  // Layer 5 — second gold shimmer pulse (constellation locking in)
  const spark = ac.createOscillator();
  const sparkGain = ac.createGain();
  spark.type = 'sine';
  spark.frequency.setValueAtTime(3200, now + 0.55);
  spark.frequency.exponentialRampToValueAtTime(2000, now + 0.9);
  sparkGain.gain.setValueAtTime(0.02, now + 0.55);
  sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  spark.connect(sparkGain).connect(ac.destination);
  spark.start(now + 0.55);
  spark.stop(now + 0.9);
}

function shadowHover() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Faint low pulse — something stirs in the dark
  const pulse = ac.createOscillator();
  const pulseGain = ac.createGain();
  pulse.type = 'sine';
  pulse.frequency.setValueAtTime(80, now);
  pulseGain.gain.setValueAtTime(0.05, now);
  pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  pulse.connect(pulseGain).connect(ac.destination);
  pulse.start(now);
  pulse.stop(now + 0.25);

  // Faint high whisper
  const whisper = ac.createOscillator();
  const whisperGain = ac.createGain();
  whisper.type = 'sine';
  whisper.frequency.setValueAtTime(1400, now + 0.05);
  whisper.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
  whisperGain.gain.setValueAtTime(0.02, now + 0.05);
  whisperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  whisper.connect(whisperGain).connect(ac.destination);
  whisper.start(now + 0.05);
  whisper.stop(now + 0.22);
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

  const playHover = useCallback((slug?: string) => {
    bgm.startOnce();
    if (muted || prefersReducedMotion()) return;
    const now = Date.now();
    if (now - lastHover.current < 150) return;
    lastHover.current = now;
    if (slug === 'barun') shadowHover();
    else shimmer();
  }, [muted]);

  const playOpen = useCallback((slug?: string) => {
    bgm.startOnce();
    if (muted || prefersReducedMotion()) return;
    if (slug === 'barun') shadowOpen();
    else chimeOpen();
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
