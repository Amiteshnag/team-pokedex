import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PlatformerGame.module.css';

const W = 600;
const H = 280;
const GROUND_Y = H - 50;
const PLAYER_X = 60;
const PLAYER_W = 72;
const PLAYER_H = 90;
const GRAVITY = 0.55;
const JUMP_FORCE = -13;

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

interface Props {
  onClose: () => void;
  avatarSrc: string;
}

export function PlatformerGame({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle');

  const state = useRef({
    running: false,
    playerY: GROUND_Y - PLAYER_H,
    vy: 0,
    onGround: true,
    obstacles: [] as Obstacle[],
    score: 0,
    frame: 0,
    dead: false,
    bgOffset: 0,
  });

  // Set up looping video
  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = '/player.mp4';
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = 'anonymous';
    vid.play().catch(() => {});
    videoRef.current = vid;

    const off = document.createElement('canvas');
    off.width = PLAYER_W;
    off.height = PLAYER_H;
    offscreenRef.current = off;

    return () => { vid.pause(); };
  }, []);

  const drawPlayerWithChroma = useCallback((
    ctx: CanvasRenderingContext2D,
    playerY: number
  ) => {
    const vid = videoRef.current;
    const off = offscreenRef.current;
    if (!vid || !off || vid.readyState < 2) return;

    const offCtx = off.getContext('2d', { willReadFrequently: true })!;
    offCtx.drawImage(vid, 0, 0, PLAYER_W, PLAYER_H);

    const imgData = offCtx.getImageData(0, 0, PLAYER_W, PLAYER_H);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      // Remove green: G dominant, above threshold
      if (g > 80 && g > r * 1.3 && g > b * 1.3) {
        d[i + 3] = 0;
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.translate(PLAYER_X * 2 + PLAYER_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(off, PLAYER_X, playerY, PLAYER_W, PLAYER_H);
    ctx.restore();
  }, []);

  const jump = useCallback(() => {
    const s = state.current;
    if (!s.running) {
      s.running = true;
      setPhase('playing');
      videoRef.current?.play().catch(() => {});
    }
    if (s.onGround && !s.dead) {
      s.vy = JUMP_FORCE;
      s.onGround = false;
    }
  }, []);

  const restart = useCallback(() => {
    const s = state.current;
    s.running = true;
    s.playerY = GROUND_Y - PLAYER_H;
    s.vy = 0;
    s.onGround = true;
    s.obstacles = [];
    s.score = 0;
    s.frame = 0;
    s.dead = false;
    setDisplayScore(0);
    setPhase('playing');
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleClick = useCallback(() => {
    if (phase === 'over') restart();
    else jump();
  }, [phase, restart, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const drawGlow = (fn: () => void, color: string, blur: number) => {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      fn();
      ctx.restore();
    };

    const loop = () => {
      const s = state.current;
      s.bgOffset = (s.bgOffset + 1.5) % 40;

      // Background: red
      ctx.fillStyle = '#990000';
      ctx.fillRect(0, 0, W, H);

      // Grid: black lines
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let x = -s.bgOffset; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Ground: black
      const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      gGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
      gGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // Ground line: black glow
      drawGlow(() => {
        ctx.strokeStyle = 'rgba(0,0,0,0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
      }, 'rgba(0,0,0,0.9)', 14);

      if (s.running && !s.dead) {
        s.vy += GRAVITY;
        s.playerY += s.vy;
        if (s.playerY >= GROUND_Y - PLAYER_H) {
          s.playerY = GROUND_Y - PLAYER_H;
          s.vy = 0;
          s.onGround = true;
        }

        s.frame++;
        const interval = Math.max(55, 115 - Math.floor(s.score / 400) * 8);
        if (s.frame % interval === 0) {
          const h = 22 + Math.random() * 30;
          s.obstacles.push({ x: W + 10, w: 18, h });
        }

        const speed = 4 + s.score / 1800;
        s.obstacles = s.obstacles.filter(o => o.x > -40);
        s.obstacles.forEach(o => { o.x -= speed; });

        for (const o of s.obstacles) {
          const oy = GROUND_Y - o.h;
          if (
            PLAYER_X + PLAYER_W - 14 > o.x &&
            PLAYER_X + 14 < o.x + o.w &&
            s.playerY + PLAYER_H - 6 > oy
          ) {
            s.dead = true;
            setPhase('over');
            setDisplayScore(Math.floor(s.score));
            break;
          }
        }

        s.score += 0.12;
        if (s.frame % 5 === 0) setDisplayScore(Math.floor(s.score));
      }

      // Obstacles
      s.obstacles.forEach(o => {
        const oy = GROUND_Y - o.h;
        drawGlow(() => {
          ctx.fillStyle = '#111';
          ctx.fillRect(o.x, oy, o.w, o.h);
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.moveTo(o.x - 2, oy);
          ctx.lineTo(o.x + o.w / 2, oy - 16);
          ctx.lineTo(o.x + o.w + 2, oy);
          ctx.closePath();
          ctx.fill();
        }, 'rgba(0,0,0,0.8)', 12);
      });

      // Player video with chroma key
      drawPlayerWithChroma(ctx, s.playerY);

      // Red glow under player
      drawGlow(() => {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          PLAYER_X + PLAYER_W / 2,
          GROUND_Y,
          PLAYER_W / 2,
          4,
          0, 0, Math.PI * 2
        );
        ctx.stroke();
      }, 'rgba(0,0,0,0.9)', 10);

      if (!s.running) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        drawGlow(() => {
          ctx.fillStyle = '#ff3333';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SPACE  /  TAP  TO  START', W / 2, H / 2);
        }, 'rgba(255,0,0,0.9)', 20);
      }

      if (s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, W, H);
        drawGlow(() => {
          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 40px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('GAME OVER', W / 2, H / 2 - 24);
        }, 'rgba(255,0,0,1)', 30);
        ctx.fillStyle = '#ffaaaa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`SCORE: ${Math.floor(s.score)}`, W / 2, H / 2 + 16);
        ctx.fillStyle = 'rgba(255,100,100,0.6)';
        ctx.font = '12px monospace';
        ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 42);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [jump, onClose, drawPlayerWithChroma]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.box}>
        <div className={styles.header}>
          <span className={styles.title}>SUPER SPEED RUN</span>
          <span className={styles.score}>SCORE: {displayScore}</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={styles.canvas}
          onClick={handleClick}
        />
        <div className={styles.hint}>
          {phase === 'idle' && 'SPACE / TAP TO START'}
          {phase === 'playing' && 'SPACE / TAP TO JUMP'}
          {phase === 'over' && `FINAL SCORE: ${displayScore} — TAP TO RESTART`}
        </div>
      </div>
    </div>
  );
}
