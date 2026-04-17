import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamLinks } from '../../types/team';
import styles from './MemoryGame.module.css';

const POKEMON = [
  { id: 25,  name: 'Pikachu' },
  { id: 39,  name: 'Jigglypuff' },
  { id: 1,   name: 'Bulbasaur' },
  { id: 4,   name: 'Charmander' },
  { id: 7,   name: 'Squirtle' },
  { id: 133, name: 'Eevee' },
  { id: 94,  name: 'Gengar' },
  { id: 143, name: 'Snorlax' },
];

// 4×4 grid = 16 cards = 8 pairs
const GRID_SIZE = 8;

function artwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

interface Card {
  uid: number;
  pokemonId: number;
  name: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  const chosen = POKEMON.slice(0, GRID_SIZE);
  const pairs = chosen.flatMap((p, i) => [
    { uid: i * 2,     pokemonId: p.id, name: p.name, flipped: false, matched: false },
    { uid: i * 2 + 1, pokemonId: p.id, name: p.name, flipped: false, matched: false },
  ]);
  return shuffle(pairs);
}

interface MemoryGameProps {
  links: TeamLinks;
  memberName: string;
}

export function MemoryGame({ links, memberName }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [_selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matched = cards.filter((c) => c.matched).length / 2;
  const total = GRID_SIZE;

  useEffect(() => {
    if (matched === total && total > 0) setWon(true);
  }, [matched, total]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCards(buildDeck());
    setSelected([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
    setStarted(false);
  }, []);

  const handleFlip = useCallback((uid: number) => {
    if (locked || won) return;
    setStarted(true);

    setCards((prev) => {
      const card = prev.find((c) => c.uid === uid);
      if (!card || card.flipped || card.matched) return prev;
      return prev.map((c) => c.uid === uid ? { ...c, flipped: true } : c);
    });

    setSelected((prev) => {
      if (prev.length === 1 && prev[0] === uid) return prev;
      const next = [...prev, uid];

      if (next.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);

        setCards((prevCards) => {
          const [a, b] = next.map((id) => prevCards.find((c) => c.uid === id)!);
          if (a && b && a.pokemonId === b.pokemonId) {
            const updated = prevCards.map((c) =>
              c.uid === a.uid || c.uid === b.uid ? { ...c, matched: true } : c,
            );
            setSelected([]);
            setLocked(false);
            return updated;
          }
          timeoutRef.current = setTimeout(() => {
            setCards((c) =>
              c.map((card) =>
                next.includes(card.uid) && !card.matched
                  ? { ...card, flipped: false }
                  : card,
              ),
            );
            setSelected([]);
            setLocked(false);
          }, 900);
          return prevCards;
        });
        return [];
      }

      return next;
    });
  }, [locked, won]);

  if (!started && !won) {
    return (
      <div className={styles.intro}>
        <div className={styles.introEmoji}>🃏</div>
        <p className={styles.introText}>
          Match all {total} Pokémon pairs to unlock {memberName.split(' ')[0]}'s contact!
        </p>
        <button className={styles.startBtn} onClick={() => setStarted(true)}>
          Let's play!
        </button>
      </div>
    );
  }

  if (won) {
    const linkEntries: Array<[string, string]> = [];
    if (links.linkedin) linkEntries.push(['LinkedIn', links.linkedin]);
    if (links.email) linkEntries.push(['Email', `mailto:${links.email}`]);
    if (links.twitter) linkEntries.push(['Twitter', links.twitter]);
    if (links.website) linkEntries.push(['Website', links.website]);

    return (
      <div className={styles.win}>
        <div className={styles.winEmoji}>🎉</div>
        <p className={styles.winTitle}>You got 'em all!</p>
        <p className={styles.winSub}>{moves} moves — now let's actually connect</p>
        <div className={styles.winLinks}>
          {linkEntries.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={styles.winLink}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {label}
            </a>
          ))}
        </div>
        <button className={styles.resetBtn} onClick={reset}>Play again</button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.hud}>
        <span>{matched}/{total} pairs</span>
        <span>{moves} moves</span>
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.uid}
            className={`${styles.card} ${card.flipped || card.matched ? styles.flipped : ''} ${card.matched ? styles.matched : ''}`}
            onClick={() => handleFlip(card.uid)}
            aria-label={card.flipped || card.matched ? card.name : 'Hidden card'}
            disabled={card.flipped || card.matched || locked}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardBack}>
                <div className={styles.pokeball} />
              </div>
              <div className={styles.cardFront}>
                <img
                  src={artwork(card.pokemonId)}
                  alt={card.name}
                  className={styles.pokemon}
                  loading="lazy"
                  draggable={false}
                />
                <span className={styles.pokeName}>{card.name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button className={styles.resetBtn} onClick={reset}>Restart</button>
    </div>
  );
}
