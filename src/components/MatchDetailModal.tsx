import { useMemo } from 'react';
import type { AppData } from '@/App';
import type { Match, Goal, Card } from '@/lib/supabase';
import { AscAvatar, PlayerAvatar } from '@/components/Avatars';
import { STATUS_COLORS, STATUS_LABELS, formatDateTime, zoneName, pouleName } from '@/lib/helpers';
import { getTimerState, useNow } from '@/lib/timer';
import { X, MapPin, Calendar, Radio, Clock } from 'lucide-react';

type TimelineEvent = {
  id: string;
  minute: number;
  type: 'goal' | 'card';
  side: 'home' | 'away';
  playerName: string;
  ascName: string;
  ascColor: string;
  cardType?: 'yellow' | 'red';
  ownGoal?: boolean;
  createdAt: string;
};

export function MatchDetailModal({
  match,
  data,
  onClose,
}: {
  match: Match;
  data: AppData;
  onClose: () => void;
}) {
  const now = useNow(1000);
  const home = data.ascs.find((a) => a.id === match.home_asc_id);
  const away = data.ascs.find((a) => a.id === match.away_asc_id);
  const timerState = getTimerState(match, now);

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    const matchGoals = data.goals.filter((g) => g.match_id === match.id);
    const matchCards = data.cards.filter((c) => c.match_id === match.id);

    for (const g of matchGoals) {
      const player = data.players.find((p) => p.id === g.player_id);
      const asc = data.ascs.find((a) => a.id === g.asc_id);
      events.push({
        id: g.id,
        minute: g.minute,
        type: 'goal',
        side: g.asc_id === match.home_asc_id ? 'home' : 'away',
        playerName: player ? `${player.first_name} ${player.last_name}` : 'Inconnu',
        ascName: asc?.name ?? '',
        ascColor: asc?.logo_color ?? '#10B981',
        ownGoal: g.own_goal,
        createdAt: g.created_at ?? '',
      });
    }

    for (const c of matchCards) {
      const player = data.players.find((p) => p.id === c.player_id);
      const asc = data.ascs.find((a) => a.id === c.asc_id);
      events.push({
        id: c.id,
        minute: c.minute,
        type: 'card',
        side: c.asc_id === match.home_asc_id ? 'home' : 'away',
        playerName: player ? `${player.first_name} ${player.last_name}` : 'Inconnu',
        ascName: asc?.name ?? '',
        ascColor: asc?.logo_color ?? '#10B981',
        cardType: c.card_type,
        createdAt: c.created_at ?? '',
      });
    }

    return events.sort((a, b) => a.minute - b.minute || (a.createdAt < b.createdAt ? -1 : 1));
  }, [data, match]);

  if (!home || !away) return null;

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#131826]/95 backdrop-blur-md px-5 py-4 border-b border-white/5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-red-500/20 border-red-500/40 text-red-400 live-badge">
                <Radio className="w-3 h-3" />
                EN DIRECT
              </span>
            ) : (
              <span className={`chip ${STATUS_COLORS[match.status]}`}>
                {STATUS_LABELS[match.status]}
              </span>
            )}
            <span className="text-xs text-gray-500">{zoneName(data.zones, match.zone_id)}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 -mr-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="px-5 py-6">
          <div className="flex items-stretch gap-3">
            <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
              <AscAvatar asc={home} size="xl" />
              <span className="font-bold text-sm text-center leading-tight line-clamp-2 break-words">
                {home.name}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 px-4 shrink-0">
              {isLive || isFinished ? (
                <span className={`text-5xl font-bold tabular-nums ${isLive ? 'text-red-400' : 'text-white'}`}>
                  {match.home_score}
                  <span className="text-gray-600 mx-1.5">-</span>
                  {match.away_score}
                </span>
              ) : (
                <span className="text-2xl text-gray-600 font-bold">VS</span>
              )}
              {isLive && (
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] tabular-nums live-minute">
                    {timerState.displayMinute}
                  </span>
                  <p className="text-[10px] text-gray-600 font-mono mt-1 tabular-nums">{timerState.displayTime}</p>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
              <AscAvatar asc={away} size="xl" />
              <span className="font-bold text-sm text-center leading-tight line-clamp-2 break-words">
                {away.name}
              </span>
            </div>
          </div>

          {/* Match info */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-4 border-t border-white/5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(match.match_date)}
            </span>
            {match.stadium && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {match.stadium}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pouleName(data.poules, match.poule_id)}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-5 pb-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            Chronologie des événements
          </h3>

          {timeline.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Aucun événement enregistré pour ce match.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />

              <div className="space-y-3">
                {timeline.map((ev) => (
                  <div
                    key={ev.id}
                    className={`relative flex items-start gap-3 pl-10 ${
                      ev.side === 'away' ? 'flex-row-reverse pl-0 pr-10 text-right' : ''
                    }`}
                  >
                    {/* Dot */}
                    <div
                      className={`absolute top-1.5 ${
                        ev.side === 'away' ? 'right-[26px]' : 'left-[10px]'
                      } w-3 h-3 rounded-full ring-4 ring-[#131826] z-10 ${
                        ev.type === 'goal' ? 'bg-[#10B981]' : ev.cardType === 'red' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                    />

                    {/* Minute badge */}
                    <div className="shrink-0">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white/5 text-gray-400">
                        {ev.minute}'
                      </span>
                    </div>

                    {/* Event card */}
                    <div className={`flex-1 ${ev.side === 'away' ? 'text-left' : ''}`}>
                      <div className="inline-flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                        <span className="text-base leading-none">
                          {ev.type === 'goal' ? '⚽' : ev.cardType === 'red' ? '🟥' : '🟨'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {ev.playerName}
                            {ev.ownGoal && <span className="text-xs text-gray-500 ml-1">(c.s.c.)</span>}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight">
                            {ev.type === 'goal' ? 'But' : ev.cardType === 'red' ? 'Carton rouge' : 'Carton jaune'}
                            {' · '}
                            <span style={{ color: ev.ascColor }}>{ev.ascName}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lineups */}
        <div className="px-5 pb-6 border-t border-white/5 pt-5">
          <h3 className="font-semibold text-sm mb-4">Compositions</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ asc: home, side: 'home' as const }, { asc: away, side: 'away' as const }].map(({ asc }) => {
              const players = data.players
                .filter((p) => p.asc_id === asc.id)
                .sort((a, b) => a.jersey_number - b.jersey_number);
              if (players.length === 0) {
                return (
                  <div key={asc.id} className="text-center py-4">
                    <p className="text-xs text-gray-600">Aucun joueur enregistré</p>
                  </div>
                );
              }
              return (
                <div key={asc.id} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <AscAvatar asc={asc} size="sm" />
                    <span className="font-medium text-sm">{asc.name}</span>
                  </div>
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 text-sm">
                      <PlayerAvatar
                        firstName={p.first_name}
                        lastName={p.last_name}
                        photoUrl={p.photo_url}
                        color={asc.logo_color}
                        size="sm"
                      />
                      <span className="font-mono text-xs text-gray-500 w-6 shrink-0">N°{p.jersey_number}</span>
                      <span className="truncate">{p.first_name} {p.last_name}</span>
                      {p.position && <span className="text-xs text-gray-600 truncate">· {p.position}</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
