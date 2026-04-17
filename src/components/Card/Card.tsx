import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { TeamMember } from '../../types/team';
import { TYPE_LABELS } from '../../types/team';
import styles from './Card.module.css';

interface CardProps {
  member: TeamMember;
  onOpen: (slug: string) => void;
  onHoverSound?: (slug: string) => void;
  onAvatarHoverChange?: (hovered: boolean) => void;
  disableTrippy?: boolean;
}

export function Card({ member, onOpen, onHoverSound, onAvatarHoverChange, disableTrippy }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const beatRafRef = useRef<number | null>(null);
  const decayRafRef = useRef<number | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [trippy, setTrippy] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [hp, setHp] = useState(member.hp);
  const hpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mx = (x / rect.width) * 100;
    const my = (y / rect.height) * 100;
    const rx = ((x / rect.width) - 0.5) * 14;
    const ry = -((y / rect.height) - 0.5) * 14;
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', String(mx));
      el.style.setProperty('--my', String(my));
      el.style.setProperty('--rx', String(rx));
      el.style.setProperty('--ry', String(ry));
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    el.style.setProperty('--mx', '50');
    el.style.setProperty('--my', '50');
    el.style.setProperty('--rx', '0');
    el.style.setProperty('--ry', '0');
  }, []);

  const handleAvatarEnter = useCallback(() => {
    if (member.slug !== 'amitesh') return;
    if (!disableTrippy) setTrippy(true);
    setAvatarHovered(true);
    onAvatarHoverChange?.(true);
    const vid = hoverVideoRef.current;
    if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
    if (!hoverAudioRef.current) {
      hoverAudioRef.current = new Audio('/hover.mp3');
    }
    hoverAudioRef.current.play().catch(() => {});

    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;
      const source = ctx.createMediaElementSource(hoverAudioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } else {
      audioCtxRef.current.resume().catch(() => {});
    }

    const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
    const bassEnd = Math.max(1, Math.floor(dataArray.length * 0.08));
    const energyHistory: number[] = [];
    let lastBeatTime = 0;

    const applyBeat = (v: number) => {
      const card = cardRef.current;
      const frame = frameRef.current;
      // CSS var for ::before / ::after pseudo-elements
      const s = v.toFixed(3);
      card?.style.setProperty('--beat', s);
      frame?.style.setProperty('--beat', s);
      if (v > 0.01) {
        const glow = Math.round(60 + v * 160);
        card?.style.setProperty('box-shadow',
          `0 0 0 ${(v * 3).toFixed(1)}px rgba(255,0,0,${v.toFixed(2)}) inset,` +
          `0 20px 60px -20px rgba(0,0,0,0.95),` +
          `0 0 ${glow}px -5px rgba(255,0,0,${(0.4 + v * 0.6).toFixed(2)})`
        );
        card?.style.setProperty('filter', `brightness(${(1 + v * 0.5).toFixed(2)})`);
        frame?.style.setProperty('border-color', `rgba(255,0,0,${(0.3 + v * 0.7).toFixed(2)})`);
        frame?.style.setProperty('box-shadow', `inset 0 0 ${Math.round(v * 30)}px rgba(255,0,0,${(v * 0.6).toFixed(2)})`);
      } else {
        card?.style.removeProperty('box-shadow');
        card?.style.removeProperty('filter');
        frame?.style.removeProperty('border-color');
        frame?.style.removeProperty('box-shadow');
        card?.style.removeProperty('--beat');
        frame?.style.removeProperty('--beat');
      }
    };

    const startDecay = () => {
      const decay = () => {
        const cur = parseFloat(cardRef.current?.style.getPropertyValue('--beat') ?? '0');
        if (cur < 0.01) { applyBeat(0); decayRafRef.current = null; return; }
        applyBeat(cur * 0.80);
        decayRafRef.current = requestAnimationFrame(decay);
      };
      decayRafRef.current = requestAnimationFrame(decay);
    };

    const tick = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bassEnd; i++) sum += dataArray[i];
      const energy = sum / bassEnd / 255;
      energyHistory.push(energy);
      if (energyHistory.length > 18) energyHistory.shift();
      const avg = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
      const now = performance.now();
      if (energy > avg * 1.3 && energy > 0.04 && now - lastBeatTime > 140) {
        lastBeatTime = now;
        if (decayRafRef.current) { cancelAnimationFrame(decayRafRef.current); decayRafRef.current = null; }
        applyBeat(1);
        setTimeout(startDecay, 70);
      }
      beatRafRef.current = requestAnimationFrame(tick);
    };
    beatRafRef.current = requestAnimationFrame(tick);

    hpIntervalRef.current = setInterval(() => setHp(v => v + 1), 80);
  }, [member.slug, disableTrippy, onAvatarHoverChange]);

  const handleAvatarLeave = useCallback(() => {
    if (member.slug !== 'amitesh') return;
    if (!disableTrippy) setTrippy(false);
    setAvatarHovered(false);
    onAvatarHoverChange?.(false);
    const vid = hoverVideoRef.current;
    if (vid) { vid.pause(); vid.currentTime = 0; }
    hoverAudioRef.current?.pause();
    if (beatRafRef.current) { cancelAnimationFrame(beatRafRef.current); beatRafRef.current = null; }
    if (decayRafRef.current) { cancelAnimationFrame(decayRafRef.current); decayRafRef.current = null; }
    cardRef.current?.style.removeProperty('box-shadow');
    cardRef.current?.style.removeProperty('filter');
    cardRef.current?.style.removeProperty('--beat');
    frameRef.current?.style.removeProperty('border-color');
    frameRef.current?.style.removeProperty('box-shadow');
    frameRef.current?.style.removeProperty('--beat');
    if (hpIntervalRef.current) { clearInterval(hpIntervalRef.current); hpIntervalRef.current = null; }
    setHp(member.hp);
  }, [member.slug, disableTrippy, onAvatarHoverChange]);

  const initials = member.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.button
      layoutId={`card-${member.slug}`}
      className={`${styles.cardWrap} ${trippy ? styles.trippyWrap : ''}`}
      data-type={member.type}
      data-slug={member.slug}
      onClick={() => onOpen(member.slug)}
      aria-label={`Open ${member.name}'s card`}
      whileTap={{ scale: 0.97 }}
    >
      <div
        ref={cardRef}
        className={`${styles.card} ${trippy ? styles.trippyCard : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => onHoverSound?.(member.slug)}
      >
        {trippy && <div className={styles.trippyOverlay} />}
        {trippy && <div className={styles.grainOverlay} />}

        <div ref={frameRef} className={styles.frame}>
          <div className={styles.topRow}>
            <span className={styles.name}>{member.name}</span>
            <span className={styles.hp}>
              HP<span className={styles.hpValue}>{hp}</span>
            </span>
          </div>

          <div
            className={styles.avatarFrame}
            onMouseEnter={handleAvatarEnter}
            onMouseLeave={handleAvatarLeave}
          >
            <span className={styles.typeBadge}>{TYPE_LABELS[member.type]}</span>
            {avatarFailed ? (
              <div className={styles.avatarPlaceholder}>{initials}</div>
            ) : (
              <img
                src={member.avatar}
                alt={member.name}
                className={`${styles.avatar} ${avatarHovered ? styles.avatarHidden : ''}`}
                onError={() => setAvatarFailed(true)}
                loading="lazy"
              />
            )}
            {member.slug === 'amitesh' && (
              <video
                ref={hoverVideoRef}
                src="/hover.mp4"
                loop
                muted
                playsInline
                className={`${styles.hoverVideo} ${avatarHovered ? styles.hoverVideoVisible : ''}`}
              />
            )}
          </div>

          <div className={styles.role}>{member.role}</div>

          <div className={styles.statsList}>
            {member.stats.slice(0, 4).map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.flavor}>{member.flavor}</div>
        </div>
      </div>
    </motion.button>
  );
}
