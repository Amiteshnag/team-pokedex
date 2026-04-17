export type PokemonType =
  | 'psychic'
  | 'fairy'
  | 'electric'
  | 'fighting'
  | 'water'
  | 'fire'
  | 'grass'
  | 'dragon'
  | 'ghost'
  | 'steel';

export const TYPE_LABELS: Record<PokemonType, string> = {
  psychic: 'Strategist',
  fairy: 'Designer',
  electric: 'Engineer',
  fighting: 'Ops',
  water: 'Researcher',
  fire: 'Growth',
  grass: 'Content',
  dragon: 'Founder',
  ghost: 'Data / ML',
  steel: 'Platform',
};

export interface TeamMove {
  name: string;
  description: string;
  power?: number;
}

export interface TeamStat {
  label: string;
  value: number;
}

export interface TeamLinks {
  slack?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
  website?: string;
}

export interface TeamMember {
  slug: string;
  name: string;
  avatar: string;
  role: string;
  type: PokemonType;
  hp: number;
  flavor: string;
  bio: string;
  likes: string[];
  dislikes: string[];
  stats: TeamStat[];
  moves?: TeamMove[];
  links: TeamLinks;
  game?: 'memory';
}
