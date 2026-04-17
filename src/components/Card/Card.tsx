import { useCallback, useRef, useState } from 'react';
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
  const rafRef = useRef<number | null>(null);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);
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
    if (member.slug === 'amitesh') {
      hpIntervalRef.current = setInterval(() => setHp(v => v + 1), 80);
    }
  }, [member.slug, disableTrippy, onAvatarHoverChange]);

  const handleAvatarLeave = useCallback(() => {
    if (member.slug !== 'amitesh') return;
    if (!disableTrippy) setTrippy(false);
    setAvatarHovered(false);
    onAvatarHoverChange?.(false);
    const vid = hoverVideoRef.current;
    if (vid) { vid.pause(); vid.currentTime = 0; }
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

        <div className={styles.frame}>
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
