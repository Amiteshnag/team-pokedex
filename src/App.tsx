import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CardGrid } from './components/CardGrid/CardGrid';
import { Modal } from './components/Modal/Modal';
import { CardDetail } from './components/CardDetail/CardDetail';
import { findBySlug, team } from './data/loadTeam';
import { useSounds } from './hooks/useSounds';

function getSlugFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('member');
}

function setSlugInUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set('member', slug);
  } else {
    url.searchParams.delete('member');
  }
  window.history.replaceState({}, '', url.toString());
}

export default function App() {
  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    getSlugFromUrl(),
  );
  const { muted, toggleMute, playHover, playOpen, playClose } = useSounds();

  const activeMember = findBySlug(activeSlug);

  useEffect(() => {
    setSlugInUrl(activeMember ? activeMember.slug : null);
  }, [activeMember]);

  useEffect(() => {
    const onPop = () => setActiveSlug(getSlugFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleOpen = useCallback(
    (slug: string) => {
      playOpen();
      setActiveSlug(slug);
    },
    [playOpen],
  );

  const handleClose = useCallback(() => {
    setActiveSlug(null);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Team Pokédex</h1>
        <p>
          Meet the crew — tap any card to flip open their full profile. Hover to
          see the foil shimmer.
        </p>
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          style={{
            marginTop: 12,
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-1)',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {muted ? '\uD83D\uDD07 Sound Off' : '\uD83D\uDD0A Sound On'}
        </button>
      </header>

      <CardGrid members={team} onOpen={handleOpen} onHoverSound={playHover} />

      <AnimatePresence>
        {activeMember && (
          <Modal key={activeMember.slug} onClose={handleClose} onCloseSound={playClose}>
            <CardDetail member={activeMember} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
