import { useEffect, useState } from 'react';

const CHARS = '!@#$%^&*<>?/|[]{}~Xx0123456789ABCDEFabcdef█▓▒░▄▀■□';

interface Props {
  text: string;
  active: boolean;
  speed?: number;
}

export function GlitchText({ text, active, speed = 50 }: Props) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    const id = setInterval(() => {
      setDisplay(
        text.split('').map((ch) => {
          if (ch === ' ') return ' ';
          return Math.random() > 0.45
            ? CHARS[Math.floor(Math.random() * CHARS.length)]
            : ch;
        }).join('')
      );
    }, speed);
    return () => clearInterval(id);
  }, [active, text, speed]);

  return <>{display}</>;
}
