import { useState } from 'react';
import type { AppData } from '@/App';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, MapPin, Layers } from 'lucide-react';

export default function AdminZones({
  data,
  reload,
}: {
  data: AppData;
  reload: () => Promise<void>;
}) {
  const [zoneName, setZoneName] = useState('');
  const [pouleName, setPouleName] = useState('');
  const [pouleZone, setPouleZone] = useState('');
  const [saving, setSaving] = useState(false);

  async function addZone() {
    if (!zoneName.trim()) return;
    setSaving(true);
    await supabase.from('zones').insert({ name: zoneName.trim() });
    setZoneName('');
    setSaving(false);
    reload();
  }

  async function addPoule() {
    if (!pouleName.trim()) return;
    setSaving(true);
    await supabase.from('poules').insert({
      name: pouleName.trim(),
      zone_id: pouleZone || null,
    });
    setPouleName('');
    setSaving(false);
    reload();
  }

  async function deleteZone(id: string) {
    if (!confirm('Supprimer cette zone ? Les poules et équipes associées perdront leur zone.')) return;
    await supabase.from('zones').delete().eq('id', id);
    reload();
  }

  async function deletePoule(id: string) {
    if (!confirm('Supprimer cette poule ? Les équipes associées perdront leur poule.')) return;
    await supabase.from('poules').delete().eq('id', id);
    reload();
  }

  return (
    <div className="space-y-5">
      {/* Add zone */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#10B981]" />
          Ajouter une Zone
        </h3>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Ex: Zone 1 - Rufisque Centre"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addZone()}
          />
          <button onClick={addZone} disabled={saving} className="btn-primary shrink-0 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Add poule */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#10B981]" />
          Ajouter une Poule
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="Ex: Poule A"
            value={pouleName}
            onChange={(e) => setPouleName(e.target.value)}
          />
          <select
            className="input"
            value={pouleZone}
            onChange={(e) => setPouleZone(e.target.value)}
          >
            <option value="">Sans zone</option>
            {data.zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        <button onClick={addPoule} disabled={saving} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Ajouter la poule
        </button>
      </div>

      {/* Zones list */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Zones existantes</h3>
        {data.zones.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune zone créée.</p>
        ) : (
          <div className="space-y-3">
            {data.zones.map((z) => {
              const poules = data.poules.filter((p) => p.zone_id === z.id);
              return (
                <div key={z.id} className="border border-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{z.name}</span>
                    <button
                      onClick={() => deleteZone(z.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {poules.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {poules.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1 text-xs"
                        >
                          {p.name}
                          <button
                            onClick={() => deletePoule(p.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orphan poules */}
      {data.poules.some((p) => !p.zone_id) && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Poules sans zone</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.poules.filter((p) => !p.zone_id).map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1 text-xs">
                {p.name}
                <button onClick={() => deletePoule(p.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
