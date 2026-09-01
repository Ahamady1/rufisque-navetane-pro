import { useMemo, useState } from 'react';
import type { AppData } from '@/App';
import type { Match, MatchStatus } from '@/lib/supabase';
import { AscAvatar } from '@/components/Avatars';
import { STATUS_COLORS, STATUS_LABELS, formatDateTime, zoneName } from '@/lib/helpers';
import { getTimerState, useNow } from '@/lib/timer';
import { MapPin, Radio, Calendar, ChevronRight } from 'lucide-react';
import { MatchDetailModal } from '@/components/MatchDetailModal';

type FilterStatus = 'all' | MatchStatus;

export default function MatchesView({ data }: { data: AppData }) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const now = useNow(1000);

  const ascMap = useMemo(() => new Map(data.ascs.map((a) => [a.id, a])), [data.ascs]);
  const playerMap = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players]);

  // Count matches per status, respecting the current zone filter
  const counts = useMemo(() => {
    const zoneFiltered = data.matches.filter((m) => zoneFilter === 'all' || m.zone_id === zoneFilter);
    return {
      all: zoneFiltered.length,
      live: zoneFiltered.filter((m) => m.status === 'live').length,
      upcoming: zoneFiltered.filter((m) => m.status === 'upcoming').length,
      finished: zoneFiltered.filter((m) => m.status === 'finished').length,
    };
  }, [data.matches, zoneFilter]);

  const statusTabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: counts.all },
    { id: 'live', label: 'En cours', count: counts.live },
    { id: 'upcoming', label: 'À venir', count: counts.upcoming },
    { id: 'finished', label: 'Terminés', count: counts.finished },
  ];

  // Filter by zone + status
  const filtered = useMemo(() => {
    return data.matches.filter((m) => {
      if (zoneFilter !== 'all' && m.zone_id !== zoneFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [data.matches, statusFilter, zoneFilter]);

  const liveMatches = useMemo(
    () => filtered.filter((m) => m.status === 'live'),
    [filtered]
  );
  const upcomingMatches = useMemo(
    () =>
      filtered
        .filter((m) => m.status === 'upcoming')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()),
    [filtered]
  );
  const finishedMatches = useMemo(
    () =>
      filtered
        .filter((m) => m.status === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()),
    [filtered]
  );

  const selectedMatch = selectedMatchId ? data.matches.find((m) => m.id === selectedMatchId) ?? null : null;

  const renderMatchCard = (m: Match) => {
    const home = ascMap.get(m.home_asc_id);
    const away = ascMap.get(m.away_asc_id);
    if (!home || !away) return null;
    const isLive = m.status === 'live';
    const isFinished = m.status === 'finished';
    const timerState = getTimerState(m, now);
    const matchGoals = data.goals.filter((g) => g.match_id === m.id).sort((a, b) => a.minute - b.minute);
    const matchCards = data.cards.filter((c) => c.match_id === m.id).sort((a, b) => a.minute - b.minute);
    const homeGoals = matchGoals.filter((g) => g.asc_id === m.home_asc_id);
    const awayGoals = matchGoals.filter((g) => g.asc_id === m.away_asc_id);
    const homeCards = matchCards.filter((c) => c.asc_id === m.home_asc_id);
    const awayCards = matchCards.filter((c) => c.asc_id === m.away_asc_id);

    return (
      <div
        key={m.id}
        className={`card p-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${isLive ? 'border-red-500/20' : ''}`}
        onClick={() => setSelectedMatchId(m.id)}
      >
        <div className="flex items-center justify-between mb-3">
          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-red-500/20 border-red-500/40 text-red-400 live-badge">
                <Radio className="w-3 h-3" />
                EN DIRECT
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] tabular-nums live-minute">
                {timerState.displayMinute}
              </span>
            </div>
          ) : (
            <span className={`chip ${STATUS_COLORS[m.status]}`}>
              {STATUS_LABELS[m.status]}
            </span>
          )}
          <span className="text-xs text-gray-500">{zoneName(data.zones, m.zone_id)}</span>
        </div>

        <div className="flex items-stretch gap-3">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <AscAvatar asc={home} size="md" />
            <span className="font-semibold text-sm text-center leading-tight line-clamp-2 break-words">
              {home.name}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 px-3 shrink-0">
            {isLive || isFinished ? (
              <span className={`text-3xl font-bold tabular-nums ${isLive ? 'text-red-400' : 'text-white'}`}>
                {m.home_score}
                <span className="text-gray-600 mx-1">-</span>
                {m.away_score}
              </span>
            ) : (
              <span className="text-gray-600 text-xl font-bold">VS</span>
            )}
            <span className="text-[10px] text-gray-600 font-mono">{timerState.displayTime}</span>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <AscAvatar asc={away} size="md" />
            <span className="font-semibold text-sm text-center leading-tight line-clamp-2 break-words">
              {away.name}
            </span>
          </div>
        </div>

        {(matchGoals.length > 0 || matchCards.length > 0) && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
            <div className="space-y-1">
              {homeGoals.map((g) => {
                const player = playerMap.get(g.player_id);
                return (
                  <div key={g.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>⚽</span>
                    <span className="truncate flex-1">{player ? `${player.last_name}` : 'But'}</span>
                    <span className="font-mono text-gray-500">{g.minute}'</span>
                  </div>
                );
              })}
              {homeCards.map((c) => {
                const player = playerMap.get(c.player_id);
                return (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>{c.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                    <span className="truncate flex-1">{player ? `${player.last_name}` : 'Carton'}</span>
                    <span className="font-mono text-gray-500">{c.minute}'</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1 text-right">
              {awayGoals.map((g) => {
                const player = playerMap.get(g.player_id);
                return (
                  <div key={g.id} className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                    <span className="font-mono text-gray-500">{g.minute}'</span>
                    <span className="truncate flex-1 text-right">{player ? `${player.last_name}` : 'But'}</span>
                    <span>⚽</span>
                  </div>
                );
              })}
              {awayCards.map((c) => {
                const player = playerMap.get(c.player_id);
                return (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                    <span className="font-mono text-gray-500">{c.minute}'</span>
                    <span className="truncate flex-1 text-right">{player ? `${player.last_name}` : 'Carton'}</span>
                    <span>{c.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateTime(m.match_date)}
          </span>
          {m.stadium && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {m.stadium}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[#10B981]">
            Détails <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    accent: string,
    matches: Match[],
    emptyMessage: string
  ) => {
    if (matches.length === 0) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className={`text-sm font-bold ${accent}`}>{title}</h3>
          </div>
          <p className="text-xs text-gray-600 pl-7">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`text-sm font-bold ${accent}`}>{title}</h3>
          <span className="text-xs text-gray-600 font-mono">({matches.length})</span>
        </div>
        <div className="space-y-3">
          {matches.map(renderMatchCard)}
        </div>
      </div>
    );
  };

  const showAllSections = statusFilter === 'all';
  const hasAnyResults = liveMatches.length > 0 || upcomingMatches.length > 0 || finishedMatches.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Matchs & Calendrier</h2>
        <p className="text-gray-500 text-sm">Suivez toutes les rencontres du championnat</p>
      </div>

      {/* Status filter with counts */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {statusTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              statusFilter === s.id
                ? 'bg-[#10B981] text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s.label}
            <span className={`ml-1.5 ${statusFilter === s.id ? 'text-black/60' : 'text-gray-600'}`}>
              ({s.count})
            </span>
          </button>
        ))}
      </div>

      {/* Zone filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => setZoneFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            zoneFilter === 'all'
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-transparent text-gray-500 border border-white/5 hover:border-white/10'
          }`}
        >
          Toutes zones
        </button>
        {data.zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setZoneFilter(z.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              zoneFilter === z.id
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-transparent text-gray-500 border border-white/5 hover:border-white/10'
            }`}
          >
            {z.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {showAllSections ? (
        hasAnyResults ? (
          <div className="space-y-6">
            {renderSection(
              'En Direct',
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-badge" />,
              'text-red-400',
              liveMatches,
              'Aucun match en direct'
            )}
            {renderSection(
              'À Venir',
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />,
              'text-amber-400',
              upcomingMatches,
              'Aucun match à venir'
            )}
            {renderSection(
              'Terminés',
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />,
              'text-slate-400',
              finishedMatches,
              'Aucun match terminé'
            )}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun match trouvé pour cette zone.</p>
          </div>
        )
      ) : (
        filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun match trouvé pour ces filtres.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(renderMatchCard)}
          </div>
        )
      )}

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          data={data}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}
