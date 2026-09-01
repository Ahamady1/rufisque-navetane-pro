import { useState } from 'react';
import type { AppData } from '@/App';
import { supabase, type Player } from '@/lib/supabase';
import { PlayerAvatar } from '@/components/Avatars';
import { uploadImage, fileToDataUrl } from '@/lib/storage';
import { Plus, Trash2, Pencil, X, Check, Shirt, Upload } from 'lucide-react';

export default function AdminPlayers({
  data,
  reload,
}: {
  data: AppData;
  reload: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [ascId, setAscId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jersey, setJersey] = useState('');
  const [licence, setLicence] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function resetForm() {
    setEditing(null);
    setAscId('');
    setFirstName('');
    setLastName('');
    setJersey('');
    setLicence('');
    setPosition('');
    setShowForm(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function startEdit(p: Player) {
    setEditing(p);
    setAscId(p.asc_id);
    setFirstName(p.first_name);
    setLastName(p.last_name);
    setJersey(String(p.jersey_number));
    setLicence(p.licence_number ?? '');
    setPosition(p.position ?? '');
    setPhotoPreview(p.photo_url ?? null);
    setPhotoFile(null);
    setShowForm(true);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const preview = await fileToDataUrl(file);
    setPhotoPreview(preview);
  }

  async function save() {
    if (!firstName.trim() || !lastName.trim() || !ascId) return;
    setSaving(true);
    setUploading(true);
    let photoUrl = editing?.photo_url ?? null;
    if (photoFile) {
      const uploaded = await uploadImage('player-photos', photoFile, `player-${Date.now()}`);
      if (uploaded) photoUrl = uploaded;
    }
    setUploading(false);
    const payload = {
      asc_id: ascId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      jersey_number: parseInt(jersey) || 1,
      licence_number: licence.trim() || null,
      position: position.trim() || null,
      photo_url: photoUrl,
    };
    if (editing) {
      await supabase.from('players').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('players').insert(payload);
    }
    setSaving(false);
    resetForm();
    reload();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce joueur ?')) return;
    await supabase.from('players').delete().eq('id', id);
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Joueurs & Licences ({data.players.length})</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Nouveau joueur
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? 'Modifier le joueur' : 'Ajouter un joueur'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold text-lg">
                  {(firstName[0] ?? '') + (lastName[0] ?? '')}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">Photo du joueur</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-sm">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{photoFile ? photoFile.name : 'Choisir une photo…'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              {photoPreview && (
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1"
                >
                  Retirer la photo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">ASC</label>
            <select className="input" value={ascId} onChange={(e) => setAscId(e.target.value)}>
              <option value="">Sélectionner une ASC</option>
              {data.ascs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Moussa" />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Diop" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label">N° maillot</label>
              <input className="input" type="number" min={1} value={jersey} onChange={(e) => setJersey(e.target.value)} placeholder="10" />
            </div>
            <div>
              <label className="label">N° licence</label>
              <input className="input" value={licence} onChange={(e) => setLicence(e.target.value)} placeholder="RN-001" />
            </div>
            <div>
              <label className="label">Poste</label>
              <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Attaquant" />
            </div>
          </div>
          <button onClick={save} disabled={saving || uploading} className="btn-primary flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {uploading ? 'Upload…' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      )}

      {/* Players grouped by ASC */}
      <div className="space-y-3">
        {data.ascs.map((a) => {
          const players = data.players.filter((p) => p.asc_id === a.id).sort((x, y) => x.jersey_number - y.jersey_number);
          if (players.length === 0) return null;
          return (
            <div key={a.id} className="card p-4">
              <h4 className="font-semibold text-sm mb-3 text-[#10B981]">{a.name}</h4>
              <div className="divide-y divide-white/5">
                {players.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center gap-3">
                    <PlayerAvatar
                      firstName={p.first_name}
                      lastName={p.last_name}
                      photoUrl={p.photo_url}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                      <p className="text-xs text-gray-500">
                        {p.position && <span>{p.position}</span>}
                        {p.position && p.licence_number && <span> · </span>}
                        {p.licence_number && <span className="flex items-center gap-1 inline-flex"><Shirt className="w-3 h-3" />{p.licence_number}</span>}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-500 shrink-0">N°{p.jersey_number}</span>
                    <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-white p-1.5">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-300 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {data.players.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">Aucun joueur enregistré.</p>
        )}
      </div>
    </div>
  );
}
