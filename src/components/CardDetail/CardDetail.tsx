import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TeamMember } from '../../types/team';
import { TYPE_LABELS } from '../../types/team';
import { Card } from '../Card/Card';
import { MemoryGame } from '../MemoryGame/MemoryGame';
import { PlatformerGame } from '../PlatformerGame/PlatformerGame';
import { GlitchText } from '../GlitchText/GlitchText';
import styles from './CardDetail.module.css';

// fftSize=1024 → 512 bins, each ~86Hz
// [startBin, endBin] for each band
const BANDS: [number, number][] = [
  [0,  2],   // 0 sub-bass  0–172 Hz
  [2,  8],   // 1 bass      172–688 Hz
  [8,  20],  // 2 low-mid   688–1720 Hz
  [20, 40],  // 3 mid       1720–3440 Hz
  [40, 70],  // 4 high-mid  3440–6020 Hz
  [70, 120], // 5 treble    6020–10320 Hz
  [120,200], // 6 brilliance 10320–17200 Hz
];

const B_SUB  = 0;
const B_BASS = 1;
const B_LMD  = 2;
const B_MID  = 3;
const B_HMD  = 4;
const B_TRB  = 5;
const B_BRIL = 6;

interface CardDetailProps {
  member: TeamMember;
}

export function CardDetail({ member }: CardDetailProps) {
  const [gameOpen, setGameOpen] = useState(false);
  const [platformerOpen, setPlatformerOpen] = useState(false);
  const { links } = member;
  const linkEntries: Array<[string, string]> = [];
  if (links.linkedin) linkEntries.push(['LinkedIn', links.linkedin]);
  if (links.twitter) linkEntries.push(['Twitter', links.twitter]);
  if (links.website) linkEntries.push(['Website', links.website]);
  if (links.email) linkEntries.push(['Email', `mailto:${links.email}`]);
  if (links.slack) linkEntries.push([`Slack (${links.slack})`, '#']);

  const statFillRefs = useRef<Array<HTMLDivElement | null>>(Array(member.stats.length).fill(null));
  const statValueRefs = useRef<Array<HTMLSpanElement | null>>(Array(member.stats.length).fill(null));
  // translateY/glow refs for key containers
  const nameRef  = useRef<HTMLHeadingElement>(null);
  const roleRef  = useRef<HTMLParagraphElement>(null);
  const flavRef  = useRef<HTMLParagraphElement>(null);
  const bioRef   = useRef<HTMLParagraphElement>(null);
  // Shared band energies ref — updated every rAF, read by GlitchText intervals
  const bandEnergiesRef = useRef<number[]>(new Array(BANDS.length).fill(0));
  const [hoverAnalyser, setHoverAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const baseWidths = member.stats.map(s => Math.max(0, Math.min(100, s.value)));
    const domRefs = [nameRef, roleRef, flavRef, bioRef];
    const domBands = [B_HMD, B_LMD, B_MID, B_HMD];

    if (!hoverAnalyser) {
      bandEnergiesRef.current.fill(0);
      statFillRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.width = `${baseWidths[i]}%`;
        el.style.filter = '';
        el.style.boxShadow = '';
      });
      statValueRefs.current.forEach((el, i) => {
        if (el) el.textContent = String(member.stats[i].value);
      });
      domRefs.forEach(r => {
        if (!r.current) return;
        r.current.style.transform = '';
        r.current.style.filter = '';
        r.current.style.textShadow = '';
      });
      return;
    }

    const dataArray = new Uint8Array(hoverAnalyser.frequencyBinCount);
    let rafId: number;

    const tick = () => {
      hoverAnalyser.getByteFrequencyData(dataArray);

      // Compute all band energies
      BANDS.forEach(([s, e], bi) => {
        const end = Math.min(e, dataArray.length);
        let sum = 0;
        for (let j = s; j < end; j++) sum += dataArray[j];
        bandEnergiesRef.current[bi] = sum / (end - s) / 255;
      });

      // Stat bars — each bar gets its own band
      const statBands = [B_BASS, B_MID, B_TRB];
      statFillRefs.current.forEach((el, i) => {
        if (!el) return;
        const energy = bandEnergiesRef.current[statBands[i] ?? B_MID];
        const base = baseWidths[i];
        const currentWidth = Math.min(100, base + energy * 55);
        el.style.width = `${currentWidth.toFixed(1)}%`;
        el.style.filter = `brightness(${(1 + energy * 1.5).toFixed(2)}) saturate(${(1 + energy * 2).toFixed(2)})`;
        el.style.boxShadow = energy > 0.1 ? `0 0 ${Math.round(energy * 20)}px rgba(255,255,255,${(energy * 0.7).toFixed(2)})` : '';
        const valEl = statValueRefs.current[i];
        if (valEl) valEl.textContent = String(Math.round(currentWidth));
      });

      // Main text containers — translateY + glow
      domRefs.forEach((r, i) => {
        const el = r.current;
        if (!el) return;
        const energy = bandEnergiesRef.current[domBands[i]];
        el.style.transform = `translateY(${(-energy * 1.04).toFixed(2)}px)`;
        el.style.filter = `brightness(${(1 + energy * 0.26).toFixed(2)})`;
        el.style.textShadow = energy > 0.33 ? `0 0 ${Math.round(energy * 3.9)}px currentColor` : '';
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hoverAnalyser, member.stats]);

  return (
    <motion.div
      className={styles.wrap}
      data-type={member.type}
      data-slug={member.slug}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className={styles.cardSlot}>
        <Card
          member={member}
          onOpen={() => {}}
          onAnalyserReady={setHoverAnalyser}
          disableTrippy
        />
      </div>

      {platformerOpen && (
        <PlatformerGame onClose={() => setPlatformerOpen(false)} avatarSrc={member.avatar} />
      )}

      <div className={styles.details}>
        <div>
          <div className={styles.header}>
            <h2 className={styles.name} ref={nameRef}>
              <GlitchText text={member.name} intensitiesRef={bandEnergiesRef} intensityIdx={B_HMD} />
            </h2>
            <span className={styles.typePill}>
              <GlitchText text={TYPE_LABELS[member.type]} intensitiesRef={bandEnergiesRef} intensityIdx={B_LMD} />
            </span>
          </div>
          <p className={styles.role} ref={roleRef}>
            <GlitchText text={member.role} intensitiesRef={bandEnergiesRef} intensityIdx={B_LMD} />
          </p>
        </div>

        <p className={styles.flavor} ref={flavRef}>
          "<GlitchText text={member.flavor} intensitiesRef={bandEnergiesRef} intensityIdx={B_MID} />"
        </p>
        <p className={styles.bio} ref={bioRef}>
          <GlitchText text={member.bio} intensitiesRef={bandEnergiesRef} intensityIdx={B_HMD} />
        </p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <GlitchText text="Stats" intensitiesRef={bandEnergiesRef} intensityIdx={B_SUB} />
          </h3>
          {member.stats.map((stat, i) => (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>
                <GlitchText
                  text={stat.label}
                  intensitiesRef={bandEnergiesRef}
                  intensityIdx={[B_BASS, B_MID, B_TRB][i] ?? B_MID}
                />
              </span>
              <div className={styles.statBar}>
                <div
                  className={styles.statFill}
                  ref={(el) => { statFillRefs.current[i] = el; }}
                  style={{ width: `${Math.max(0, Math.min(100, stat.value))}%` }}
                />
              </div>
              <span className={styles.statValue} ref={(el) => { statValueRefs.current[i] = el; }}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <GlitchText text="Likes" intensitiesRef={bandEnergiesRef} intensityIdx={B_MID} />
            </h3>
            <ul className={styles.tagList}>
              {member.likes.map((item) => (
                <li key={item} className={styles.tag}>
                  <GlitchText text={item} intensitiesRef={bandEnergiesRef} intensityIdx={B_TRB} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {member.moves && member.moves.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <GlitchText text="Signature Moves" intensitiesRef={bandEnergiesRef} intensityIdx={B_SUB} />
            </h3>
            <div className={styles.moves}>
              {member.moves.map((move) => (
                <div key={move.name} className={styles.move}>
                  <div className={styles.moveHeader}>
                    <span className={styles.moveName}>
                      <GlitchText text={move.name} intensitiesRef={bandEnergiesRef} intensityIdx={B_BASS} />
                    </span>
                    {move.power !== undefined && (
                      <span className={styles.movePower}>{move.power}</span>
                    )}
                  </div>
                  <p className={styles.moveDesc}>
                    <GlitchText text={move.description} intensitiesRef={bandEnergiesRef} intensityIdx={B_MID} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkEntries.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <GlitchText text="Where to find" intensitiesRef={bandEnergiesRef} intensityIdx={B_HMD} />
            </h3>
            <div className={styles.links}>
              {linkEntries.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className={styles.link}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <GlitchText text={label} intensitiesRef={bandEnergiesRef} intensityIdx={B_BRIL} />
                </a>
              ))}
            </div>
          </div>
        )}

        {member.slug === 'amitesh' && (
          <div className={styles.section}>
            <button className={styles.gameBtn} onClick={() => setPlatformerOpen(true)}>
              <GlitchText text="GAME" intensitiesRef={bandEnergiesRef} intensityIdx={B_BASS} />
            </button>
          </div>
        )}

        {member.game === 'memory' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Mini game</h3>
            {!gameOpen ? (
              <button className={styles.gameTeaser} onClick={() => setGameOpen(true)}>
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
