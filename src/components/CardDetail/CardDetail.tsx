import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TeamMember } from '../../types/team';
import { TYPE_LABELS } from '../../types/team';
import { Card } from '../Card/Card';
import { MemoryGame } from '../MemoryGame/MemoryGame';
import styles from './CardDetail.module.css';

interface CardDetailProps {
  member: TeamMember;
}

export function CardDetail({ member }: CardDetailProps) {
  const [gameOpen, setGameOpen] = useState(false);
  const { links } = member;
  const linkEntries: Array<[string, string]> = [];
  if (links.linkedin) linkEntries.push(['LinkedIn', links.linkedin]);
  if (links.twitter) linkEntries.push(['Twitter', links.twitter]);
  if (links.website) linkEntries.push(['Website', links.website]);
  if (links.email) linkEntries.push(['Email', `mailto:${links.email}`]);
  if (links.slack) linkEntries.push([`Slack (${links.slack})`, '#']);

  return (
    <motion.div
      className={styles.wrap}
      data-type={member.type}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className={styles.cardSlot}>
        <Card member={member} onOpen={() => { /* already open */ }} />
      </div>

      <div className={styles.details}>
        <div>
          <div className={styles.header}>
            <h2 className={styles.name}>{member.name}</h2>
            <span className={styles.typePill}>{TYPE_LABELS[member.type]}</span>
          </div>
          <p className={styles.role}>{member.role}</p>
        </div>

        <p className={styles.flavor}>"{member.flavor}"</p>
        <p className={styles.bio}>{member.bio}</p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Stats</h3>
          {member.stats.map((stat) => (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>{stat.label}</span>
              <div className={styles.statBar}>
                <div
                  className={styles.statFill}
                  style={{ width: `${Math.max(0, Math.min(100, stat.value))}%` }}
                />
              </div>
              <span className={styles.statValue}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Likes</h3>
            <ul className={styles.tagList}>
              {member.likes.map((item) => (
                <li key={item} className={styles.tag}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dislikes</h3>
            <ul className={styles.tagList}>
              {member.dislikes.map((item) => (
                <li key={item} className={`${styles.tag} ${styles.tagDislike}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {member.moves && member.moves.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Signature Moves</h3>
            <div className={styles.moves}>
              {member.moves.map((move) => (
                <div key={move.name} className={styles.move}>
                  <div className={styles.moveHeader}>
                    <span className={styles.moveName}>{move.name}</span>
                    {move.power !== undefined && (
                      <span className={styles.movePower}>{move.power}</span>
                    )}
                  </div>
                  <p className={styles.moveDesc}>{move.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkEntries.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Where to find</h3>
            <div className={styles.links}>
              {linkEntries.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className={styles.link}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        {member.game === 'memory' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Mini game</h3>
            {!gameOpen ? (
              <button
                className={styles.gameTeaser}
                onClick={() => setGameOpen(true)}
              >
                <span className={styles.gameTeaserIcon}>🎮</span>
                <span>
                  <strong>Match the Pokémon</strong>
                  <span className={styles.gameTeaserSub}>Win to unlock my contact</span>
                </span>
                <span className={styles.gameTeaserArrow}>›</span>
              </button>
            ) : (
              <MemoryGame links={member.links} memberName={member.name} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
