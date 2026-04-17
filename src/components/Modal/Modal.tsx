import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import styles from './Modal.module.css';

interface ModalProps {
  onClose: () => void;
  onCloseSound?: () => void;
  children: React.ReactNode;
}

export function Modal({ onClose, onCloseSound, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseSound?.();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => { onCloseSound?.(); onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      <button
        className={styles.close}
        onClick={() => { onCloseSound?.(); onClose(); }}
        aria-label="Close"
        type="button"
      >
        ×
      </button>
    </motion.div>,
    document.body,
  );
}
