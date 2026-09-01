import { useMemo, useState } from 'react';
import type { AppData } from '@/App';
import { AscAvatar, PlayerAvatar } from '@/components/Avatars';
import { zoneName, pouleName } from '@/lib/helpers';
import { Users, Shirt, ChevronDown, MapPin } from 'lucide-react';

export default function DirectoryView({ data }: { data: AppData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const ascsWithMeta = useMemo(() => {
    return data.ascs.map((a) => ({
      ...a,
      zone_name: zoneName(data.zones, a.zone_id),
      poule_name: pouleName(data.poules, a.poule_id),
      players: data.players.filter((p) => p.asc_id === a.id).sort((x, y) => x.jersey_number - y.jersey_number),
    }));
  }, [data.ascs, data.zones, data.poules, data.players]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">ASC & Joueurs</h2>
        <p className="text-gray-500 text-sm">Répertoire des équipes et leurs effectifs</p>
      </div>

      <div className="space-y-3">
        {ascsWithMeta.map((asc) => {
          const isOpen = expanded === asc.id;
          return (
            <div key={asc.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : asc.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
              >
                <AscAvatar asc={asc} size="lg" />
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-bold text-base truncate">{asc.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {asc.zone_name}
                    </span>
                    <span>·</span>
                    <span>{asc.poule_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#10B981]">
                    <Users className="w-3.5 h-3.5" />
                    {asc.players.length} joueur{asc.players.length > 1 ? 's' : ''}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 animate-slide-up">
                  {asc.players.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500">Aucun joueur enregistré.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {asc.players.map((p) => (
                        <div key={p.id} className="p-3 flex items-center gap-3">
                          <PlayerAvatar
                            firstName={p.first_name}
                            lastName={p.last_name}
                            photoUrl={p.photo_url}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {p.first_name} {p.last_name}
                            </p>
                            {p.position && (
                              <p className="text-xs text-gray-500">{p.position}</p>
                            )}
                          </div>
                          <span className="text-xs font-mono text-gray-500 shrink-0">N°{p.jersey_number}</span>
                          {p.licence_number && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                                <Shirt className="w-3 h-3" />
                                Licence
                              </p>
                              <p className="text-xs font-mono text-gray-400">{p.licence_number}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
