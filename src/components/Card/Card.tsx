import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { TeamMember } from '../../types/team';
import { TYPE_LABELS } from '../../types/team';
import styles from './Card.module.css';

interface CardProps {
  member: TeamMember;
  onOpen: (slug: string) => void;
  onHoverSound?: () => void;
}

export function Card({ member, onOpen, onHoverSound }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

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

  const initials = member.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.button
      layoutId={`card-${member.slug}`}
      className={styles.cardWrap}
      data-type={member.type}
      onClick={() => onOpen(member.slug)}
      aria-label={`Open ${member.name}'s card`}
      whileTap={{ scale: 0.97 }}
    >
      <div
        ref={cardRef}
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={onHoverSound}
      >
        <div className={styles.frame}>
          <div className={styles.topRow}>
            <span className={styles.name}>{member.name}</span>
            <span className={styles.hp}>
              HP<span className={styles.hpValue}>{member.hp}</span>
            </span>
          </div>

          <div className={styles.avatarFrame}>
            <span className={styles.typeBadge}>{TYPE_LABELS[member.type]}</span>
            {avatarFailed ? (
              <div className={styles.avatarPlaceholder}>{initials}</div>
            ) : (
              <img
                src={member.avatar}
                alt={member.name}
                className={styles.avatar}
                onError={() => setAvatarFailed(true)}
                loading="lazy"
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
