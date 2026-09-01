import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Zone = {
  id: string;
  name: string;
  created_at?: string;
};

export type Poule = {
  id: string;
  name: string;
  zone_id: string | null;
  created_at?: string;
};

export type Asc = {
  id: string;
  name: string;
  zone_id: string | null;
  poule_id: string | null;
  logo_color: string;
  logo_url: string | null;
  created_at?: string;
};

export type Player = {
  id: string;
  asc_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number;
  licence_number: string | null;
  position: string | null;
  photo_url: string | null;
  created_at?: string;
};

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export type Match = {
  id: string;
  home_asc_id: string;
  away_asc_id: string;
  zone_id: string | null;
  poule_id: string | null;
  match_date: string;
  stadium: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  timer_started_at: string | null;
  timer_paused_at: string | null;
  timer_offset_ms: number;
  timer_half: number;
  timer_half_minutes: number;
  created_at?: string;
};

export type Goal = {
  id: string;
  match_id: string;
  player_id: string | null;
  asc_id: string;
  minute: number;
  own_goal: boolean;
  created_at?: string;
};

export type CardType = 'yellow' | 'red';

export type Card = {
  id: string;
  match_id: string;
  player_id: string | null;
  asc_id: string;
  card_type: CardType;
  minute: number;
  created_at?: string;
};

export type MatchWithTeams = Match & {
  home_asc?: Asc;
  away_asc?: Asc;
  zone?: Zone | null;
  poule?: Poule | null;
};

export type PlayerWithAsc = Player & {
  asc?: Asc;
};

export type GoalWithPlayer = Goal & {
  player?: Player | null;
  asc?: Asc;
};
