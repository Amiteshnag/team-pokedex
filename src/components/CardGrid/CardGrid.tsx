import type { TeamMember } from '../../types/team';
import { Card } from '../Card/Card';
import styles from './CardGrid.module.css';

interface CardGridProps {
  members: TeamMember[];
  onOpen: (slug: string) => void;
  onHoverSound?: (slug: string) => void;
}

export function CardGrid({ members, onOpen, onHoverSound }: CardGridProps) {
  return (
    <div className={styles.grid}>
      {members.map((m) => (
        <Card key={m.slug} member={m} onOpen={onOpen} onHoverSound={onHoverSound} />
      ))}
    </div>
  );
}
