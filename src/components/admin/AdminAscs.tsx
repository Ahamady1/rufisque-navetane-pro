import { useState } from 'react';
import type { AppData } from '@/App';
import { supabase, type Asc } from '@/lib/supabase';
import { AscAvatar } from '@/components/Avatars';
import { zoneName, pouleName } from '@/lib/helpers';
import { uploadImage, fileToDataUrl } from '@/lib/storage';
import { Plus, Trash2, Pencil, X, Check, Upload } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];

export default function AdminAscs({
  data,
  reload,
}: {
  data: AppData;
  reload: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asc | null>(null);
  const [name, setName] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [pouleId, setPouleId] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function resetForm() {
    setName('');
    setZoneId('');
    setPouleId('');
    setColor(COLORS[0]);
    setEditing(null);
    setShowForm(false);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function startEdit(asc: Asc) {
    setEditing(asc);
    setName(asc.name);
    setZoneId(asc.zone_id ?? '');
    setPouleId(asc.poule_id ?? '');
    setColor(asc.logo_color);
    setLogoPreview(asc.logo_url ?? null);
    setLogoFile(null);
    setShowForm(true);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const preview = await fileToDataUrl(file);
    setLogoPreview(preview);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setUploading(true);
    let logoUrl = editing?.logo_url ?? null;
    if (logoFile) {
      const uploaded = await uploadImage('team-logos', logoFile, `logo-${Date.now()}`);
      if (uploaded) logoUrl = uploaded;
    }
    setUploading(false);
    const payload = {
      name: name.trim(),
      zone_id: zoneId || null,
      poule_id: pouleId || null,
      logo_color: color,
      logo_url: logoUrl,
    };
    if (editing) {
      await supabase.from('ascs').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('ascs').insert(payload);
    }
    setSaving(false);
    resetForm();
    reload();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette ASC ? Tous ses joueurs seront aussi supprimés.')) return;
    await supabase.from('ascs').delete().eq('id', id);
    reload();
  }

  const availablePoules = data.poules.filter((p) => !p.zone_id || p.zone_id === zoneId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Gestion des ASC ({data.ascs.length})</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Nouvelle ASC
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? 'Modifier l\'ASC' : 'Ajouter une ASC'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/10" />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white text-lg"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                >
                  {name.trim() ? name.trim().replace(/^ASC\s+/i, '').slice(0, 2).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">Logo de l'équipe</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-sm">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{logoFile ? logoFile.name : 'Choisir une image…'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoPreview && (
                <button
                  onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1"
                >
                  Retirer le logo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">Nom de l'ASC</label>
            <input className="input" placeholder="Ex: ASC Yakaar" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Zone</label>
              <select className="input" value={zoneId} onChange={(e) => { setZoneId(e.target.value); setPouleId(''); }}>
                <option value="">Sans zone</option>
                {data.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Poule</label>
              <select className="input" value={pouleId} onChange={(e) => setPouleId(e.target.value)} disabled={availablePoules.length === 0}>
                <option value="">Sans poule</option>
                {availablePoules.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Couleur du logo</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#131826] scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving || uploading} className="btn-primary flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {uploading ? 'Upload…' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {data.ascs.map((a) => (
          <div key={a.id} className="card p-3 flex items-center gap-3">
            <AscAvatar asc={a} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{a.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {zoneName(data.zones, a.zone_id)} · {pouleName(data.poules, a.poule_id)}
              </p>
            </div>
            <button onClick={() => startEdit(a)} className="text-gray-400 hover:text-white p-1.5">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-300 p-1.5">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {data.ascs.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">Aucune ASC enregistrée.</p>
        )}
      </div>
    </div>
  );
}
