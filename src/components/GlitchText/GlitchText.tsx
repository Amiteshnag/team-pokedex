import { useEffect, useRef, useState } from 'react';

const CHARS = '!@#$%^&*<>?/|[]{}~Xx0123456789ABCDEFabcdef█▓▒░▄▀■□';

interface Props {
  text: string;
  // Music-reactive mode: read intensity from a shared ref (no re-renders)
  intensitiesRef?: React.RefObject<number[]>;
  intensityIdx?: number;
  // Legacy random mode
  active?: boolean;
  speed?: number;
}

export function GlitchText({ text, intensitiesRef, intensityIdx = 0, active = false, speed = 50 }: Props) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (intensitiesRef) {
      const id = setInterval(() => {
        const raw = intensitiesRef.current?.[intensityIdx] ?? 0;
        const intensity = Math.min(1, raw * 0.39);
        if (intensity < 0.24) { setDisplay(text); return; }
        setDisplay(
          text.split('').map((ch) => {
            if (ch === ' ') return ' ';
            return Math.random() < intensity * 0.9
              ? CHARS[Math.floor(Math.random() * CHARS.length)]
              : ch;
          }).join('')
        );
      }, 25);
      return () => clearInterval(id);
    }

    if (!active) { setDisplay(text); return; }
    const id = setInterval(() => {
      setDisplay(
        text.split('').map((ch) => {
          if (ch === ' ') return ' ';
          return Math.random() > 0.45 ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch;
        }).join('')
      );
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed, intensitiesRef, intensityIdx]);

  return <>{display}</>;
}
