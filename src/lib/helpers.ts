import type { Asc, Match, Poule, Zone } from './supabase';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} · ${formatTime(dateStr)}`;
}

export type StandingRow = {
  asc_id: string;
  asc_name: string;
  logo_color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export function computeStandings(
  matches: Match[],
  ascs: Asc[],
  pouleId: string | null
): StandingRow[] {
  const pouleAscs = ascs.filter((a) => a.poule_id === pouleId);
  const rows = new Map<string, StandingRow>();

  for (const asc of pouleAscs) {
    rows.set(asc.id, {
      asc_id: asc.id,
      asc_name: asc.name,
      logo_color: asc.logo_color,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    // Match by poule_id on the match, or fall back to the home team's poule
    const homeAsc = ascs.find((a) => a.id === m.home_asc_id);
    const matchPouleId = m.poule_id ?? homeAsc?.poule_id ?? null;
    if (matchPouleId !== pouleId) continue;
    const home = rows.get(m.home_asc_id);
    const away = rows.get(m.away_asc_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.home_score;
    home.goalsAgainst += m.away_score;
    away.goalsFor += m.away_score;
    away.goalsAgainst += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const result = Array.from(rows.values());
  for (const r of result) {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
  }
  result.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.asc_name.localeCompare(b.asc_name)
  );
  return result;
}

export function zoneName(zones: Zone[], id: string | null): string {
  if (!id) return 'Sans zone';
  return zones.find((z) => z.id === id)?.name ?? 'Sans zone';
}

export function pouleName(poules: Poule[], id: string | null): string {
  if (!id) return 'Sans poule';
  return poules.find((p) => p.id === id)?.name ?? 'Sans poule';
}

export const STATUS_LABELS: Record<string, string> = {
  upcoming: 'À venir',
  live: 'En cours',
  finished: 'Terminé',
};

export const STATUS_COLORS: Record<string, string> = {
  upcoming: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  live: 'text-red-400 bg-red-400/10 border-red-400/30',
  finished: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
};
