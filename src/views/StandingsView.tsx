import { useMemo, useState, useEffect } from 'react';
import type { AppData } from '@/App';
import { computeStandings } from '@/lib/helpers';
import { AscAvatar } from '@/components/Avatars';
import { ChevronRight, Trophy, Lock } from 'lucide-react';

export default function StandingsView({ data }: { data: AppData }) {
  const zonesWithPoules = useMemo(() => {
    return data.zones
      .map((z) => ({
        ...z,
        poules: data.poules
          .filter((p) => p.zone_id === z.id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((z) => z.poules.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.zones, data.poules]);

  const [activeZoneId, setActiveZoneId] = useState(zonesWithPoules[0]?.id ?? '');
  const activeZone = zonesWithPoules.find((z) => z.id === activeZoneId);

  const [activePouleId, setActivePouleId] = useState(activeZone?.poules[0]?.id ?? '');

  // Reset poule when zone changes
  useEffect(() => {
    const zone = zonesWithPoules.find((z) => z.id === activeZoneId);
    if (zone && !zone.poules.find((p) => p.id === activePouleId)) {
      setActivePouleId(zone.poules[0]?.id ?? '');
    }
  }, [activeZoneId, zonesWithPoules, activePouleId]);

  const poule = activeZone?.poules.find((p) => p.id === activePouleId);

  const standings = useMemo(() => {
    if (!poule) return [];
    return computeStandings(data.matches, data.ascs, poule.id);
  }, [data.matches, data.ascs, poule]);

  if (zonesWithPoules.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">Aucune poule n'a encore été créée.</p>
        <p className="text-gray-600 text-xs mt-1">Créez des zones et des poules depuis l'administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Classement</h2>
        <p className="text-gray-500 text-sm">Classement interactif par zone et poule</p>
      </div>

      {/* Zone filter (level 1) */}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">Zone</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {zonesWithPoules.map((z) => (
            <button
              key={z.id}
              onClick={() => setActiveZoneId(z.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeZoneId === z.id
                  ? 'bg-[#10B981] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>

      {/* Poule sub-tabs (level 2) */}
      {activeZone && activeZone.poules.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">Poule</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {activeZone.poules.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePouleId(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activePouleId === p.id
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-transparent text-gray-500 border border-white/5 hover:border-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Standings table */}
      {standings.length > 0 ? (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="text-left py-3 pl-4">Rang</th>
                  <th className="text-left py-3">Équipe</th>
                  <th className="text-center py-3" title="Matchs Joués">MJ</th>
                  <th className="text-center py-3" title="Victoires">V</th>
                  <th className="text-center py-3" title="Nuls">N</th>
                  <th className="text-center py-3" title="Défaites">D</th>
                  <th className="text-center py-3" title="Buts Pour">BP</th>
                  <th className="text-center py-3" title="Buts Contre">BC</th>
                  <th className="text-center py-3" title="Différence de Buts">DB</th>
                  <th className="text-center py-3 pr-4 font-bold text-[#10B981]" title="Points">PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const asc = data.ascs.find((a) => a.id === row.asc_id);
                  return (
                    <tr
                      key={row.asc_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 pl-4">
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0
                              ? 'bg-[#F5B945] text-black'
                              : i === 1
                              ? 'bg-white/10 text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <AscAvatar asc={{ name: row.asc_name, logo_color: row.logo_color, logo_url: asc?.logo_url ?? null }} size="sm" />
                          <span className="font-medium">{row.asc_name}</span>
                        </div>
                      </td>
                      <td className="text-center text-gray-400">{row.played}</td>
                      <td className="text-center text-gray-400">{row.won}</td>
                      <td className="text-center text-gray-400">{row.drawn}</td>
                      <td className="text-center text-gray-400">{row.lost}</td>
                      <td className="text-center text-gray-400">{row.goalsFor}</td>
                      <td className="text-center text-gray-400">{row.goalsAgainst}</td>
                      <td className={`text-center font-medium ${row.goalDiff > 0 ? 'text-[#10B981]' : row.goalDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                      </td>
                      <td className="text-center pr-4 font-bold text-white">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-white/5">
            {standings.map((row, i) => {
              const asc = data.ascs.find((a) => a.id === row.asc_id);
              return (
                <div key={row.asc_id} className="p-3 flex items-center gap-3">
                  <span
                    className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-[#F5B945] text-black' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <AscAvatar asc={{ name: row.asc_name, logo_color: row.logo_color, logo_url: asc?.logo_url ?? null }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{row.asc_name}</p>
                    <p className="text-xs text-gray-500">
                      {row.played}MJ · {row.won}V · {row.drawn}N · {row.lost}D
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{row.points} pts</p>
                    <p className="text-xs text-gray-500">
                      {row.goalDiff > 0 ? '+' : ''}{row.goalDiff} diff
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">Aucune équipe dans cette poule ou aucun match terminé.</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
        <ChevronRight className="w-3 h-3" />
        Le classement est calculé automatiquement à partir des matchs terminés (V: +3 pts, N: +1 pt, D: 0 pt).
      </div>
    </div>
  );
}
