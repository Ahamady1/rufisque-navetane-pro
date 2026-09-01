import { useMemo } from 'react';
import type { AppData } from '@/App';
import { PlayerAvatar } from '@/components/Avatars';
import { Trophy } from 'lucide-react';

export default function ScorersView({ data }: { data: AppData }) {
  const scorers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of data.goals) {
      if (!g.player_id || g.own_goal) continue;
      counts.set(g.player_id, (counts.get(g.player_id) ?? 0) + 1);
    }
    const ascMap = new Map(data.ascs.map((a) => [a.id, a]));
    return data.players
      .map((p) => {
        const goals = counts.get(p.id) ?? 0;
        const asc = ascMap.get(p.asc_id);
        return { player: p, goals, asc };
      })
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals);
  }, [data.goals, data.players, data.ascs]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Meilleurs Buteurs</h2>
        <p className="text-gray-500 text-sm">Classement individuel des buteurs du championnat</p>
      </div>

      {scorers.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Aucun but n'a encore été enregistré.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {scorers.map((s, i) => (
            <div
              key={s.player.id}
              className="card p-3 flex items-center gap-3"
            >
              <span
                className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  i === 0
                    ? 'bg-[#F5B945] text-black'
                    : i === 1
                    ? 'bg-white/10 text-white'
                    : i === 2
                    ? 'bg-amber-700/40 text-amber-300'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                {i + 1}
              </span>
              <PlayerAvatar
                firstName={s.player.first_name}
                lastName={s.player.last_name}
                color={s.asc?.logo_color ?? '#10B981'}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {s.player.first_name} {s.player.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {s.asc?.name ?? '—'} · N°{s.player.jersey_number}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#10B981]">{s.goals}</span>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">buts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
