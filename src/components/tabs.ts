import { Trophy, CalendarDays, BarChart3, Users, Shield } from 'lucide-react';

export type TabId = 'matches' | 'standings' | 'scorers' | 'directory' | 'admin';

export const TABS: { id: TabId; label: string; icon: typeof Trophy }[] = [
  { id: 'matches', label: 'Matchs', icon: CalendarDays },
  { id: 'standings', label: 'Classement', icon: BarChart3 },
  { id: 'scorers', label: 'Buteurs', icon: Trophy },
  { id: 'directory', label: 'ASC & Joueurs', icon: Users },
  { id: 'admin', label: 'Espace Admin', icon: Shield },
];
