import { useState, useEffect, useMemo } from 'react';
import type { AppData } from '@/App';
import { supabase, type Match, type MatchStatus, type CardType } from '@/lib/supabase';
import { AscAvatar } from '@/components/Avatars';
import { STATUS_LABELS, formatDateTime, zoneName, pouleName } from '@/lib/helpers';
import { getTimerState, useNow } from '@/lib/timer';
import { Plus, Trash2, Pencil, X, Check, Radio, Minus, Goal, MapPin, Play, Pause, RotateCcw, Clock, Square, Lock } from 'lucide-react';

const STATUSES: MatchStatus[] = ['upcoming', 'live', 'finished'];

export default function AdminMatches({
  data,
  reload,
}: {
  data: AppData;
  reload: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [pouleId, setPouleId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [stadium, setStadium] = useState('');
  const [status, setStatus] = useState<MatchStatus>('upcoming');
  const [saving, setSaving] = useState(false);

  // Score editor
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [goalPlayer, setGoalPlayer] = useState('');
  const [goalAsc, setGoalAsc] = useState('');
  const [goalMinute, setGoalMinute] = useState('');

  // Timer controls
  const [manualMinute, setManualMinute] = useState('');

  // Card editor
  const [cardAsc, setCardAsc] = useState('');
  const [cardPlayer, setCardPlayer] = useState('');
  const [cardType, setCardType] = useState<CardType>('yellow');
  const [cardMinute, setCardMinute] = useState('');

  const now = useNow(1000);

  function resetForm() {
    setEditing(null);
    setHomeId('');
    setAwayId('');
    setZoneId('');
    setPouleId('');
    setDate('');
    setTime('');
    setStadium('');
    setStatus('upcoming');
    setShowForm(false);
  }

  function startEdit(m: Match) {
    setEditing(m);
    setHomeId(m.home_asc_id);
    setAwayId(m.away_asc_id);
    setZoneId(m.zone_id ?? '');
    setPouleId(m.poule_id ?? '');
    const d = new Date(m.match_date);
    setDate(d.toISOString().slice(0, 10));
    setTime(d.toTimeString().slice(0, 5));
    setStadium(m.stadium ?? '');
    setStatus(m.status);
    setShowForm(true);
  }

  // Auto-determine poule from selected teams
  const autoPoule = useMemo(() => {
    if (!homeId) return null;
    const homeAsc = data.ascs.find((a) => a.id === homeId);
    if (!homeAsc?.poule_id) return null;
    // Verify away team is in same poule (if away selected)
    if (awayId) {
      const awayAsc = data.ascs.find((a) => a.id === awayId);
      if (awayAsc?.poule_id && awayAsc.poule_id !== homeAsc.poule_id) return null;
    }
    return homeAsc.poule_id;
  }, [homeId, awayId, data.ascs]);

  // Auto-fill poule and zone when teams are selected
  useEffect(() => {
    if (autoPoule) {
      setPouleId(autoPoule);
      // Auto-fill zone from poule
      const poule = data.poules.find((p) => p.id === autoPoule);
      if (poule?.zone_id && !zoneId) {
        setZoneId(poule.zone_id);
      }
    } else if (!editing) {
      setPouleId('');
    }
  }, [autoPoule, data.poules, zoneId, editing]);

  async function save() {
    if (!homeId || !awayId || homeId === awayId) return;
    setSaving(true);
    const dt = new Date(`${date || '2026-01-01'}T${time || '16:00'}`).toISOString();
    const payload = {
      home_asc_id: homeId,
      away_asc_id: awayId,
      zone_id: zoneId || null,
      poule_id: pouleId || null,
      match_date: dt,
      stadium: stadium.trim() || null,
      status,
    };
    if (editing) {
      await supabase.from('matches').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('matches').insert({ ...payload, home_score: 0, away_score: 0 });
    }
    setSaving(false);
    resetForm();
    reload();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce match et tous ses buts ?')) return;
    await supabase.from('matches').delete().eq('id', id);
    reload();
  }

  async function openScoreEditor(m: Match) {
    setScoreMatch(m);
    setHomeScore(m.home_score);
    setAwayScore(m.away_score);
    setGoalAsc('');
    setGoalPlayer('');
    setGoalMinute('');
    setManualMinute('');
  }

  async function saveScore() {
    if (!scoreMatch) return;
    await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status })
      .eq('id', scoreMatch.id);
    reload();
  }

  async function addGoal() {
    if (!scoreMatch || !goalPlayer || !goalAsc) return;
    // Use manual minute if provided, otherwise use current timer minute
    const timerState = getTimerState(scoreMatch, now);
    let minute: number;
    if (goalMinute.trim()) {
      minute = parseInt(goalMinute) || 1;
    } else {
      const totalMinutes = Math.floor(timerState.currentMs / 60_000);
      minute = Math.max(1, totalMinutes);
    }
    await supabase.from('goals').insert({
      match_id: scoreMatch.id,
      player_id: goalPlayer,
      asc_id: goalAsc,
      minute,
    });
    if (goalAsc === scoreMatch.home_asc_id) {
      setHomeScore((s) => s + 1);
      await supabase.from('matches').update({ home_score: homeScore + 1 }).eq('id', scoreMatch.id);
    } else {
      setAwayScore((s) => s + 1);
      await supabase.from('matches').update({ away_score: awayScore + 1 }).eq('id', scoreMatch.id);
    }
    setGoalPlayer('');
    setGoalMinute('');
    reload();
  }

  async function deleteGoal(goalId: string, ascId: string) {
    if (!scoreMatch) return;
    if (ascId === scoreMatch.home_asc_id) {
      setHomeScore((s) => Math.max(0, s - 1));
      await supabase.from('matches').update({ home_score: Math.max(0, homeScore - 1) }).eq('id', scoreMatch.id);
    } else {
      setAwayScore((s) => Math.max(0, s - 1));
      await supabase.from('matches').update({ away_score: Math.max(0, awayScore - 1) }).eq('id', scoreMatch.id);
    }
    await supabase.from('goals').delete().eq('id', goalId);
    reload();
  }

  // Timer control functions
  async function startTimer(m: Match) {
    if (m.timer_started_at && !m.timer_paused_at) return;
    const updates: Record<string, unknown> = {
      timer_started_at: new Date().toISOString(),
      timer_paused_at: null,
      status: 'live' as MatchStatus,
    };
    if (!m.timer_started_at) {
      updates.timer_offset_ms = 0;
      updates.timer_half = 1;
    }
    await supabase.from('matches').update(updates).eq('id', m.id);
    reload();
  }

  async function pauseTimer(m: Match) {
    if (!m.timer_started_at || m.timer_paused_at) return;
    const nowTs = new Date().toISOString();
    const started = new Date(m.timer_started_at).getTime();
    const added = Date.now() - started;
    await supabase.from('matches').update({
      timer_paused_at: nowTs,
      timer_offset_ms: m.timer_offset_ms + added,
    }).eq('id', m.id);
    reload();
  }

  async function resumeTimer(m: Match) {
    if (!m.timer_paused_at) return;
    await supabase.from('matches').update({
      timer_started_at: new Date().toISOString(),
      timer_paused_at: null,
    }).eq('id', m.id);
    reload();
  }

  async function setHalfTime(m: Match) {
    // Pause and move to second half
    const halfMs = m.timer_half_minutes * 60_000;
    await supabase.from('matches').update({
      timer_paused_at: new Date().toISOString(),
      timer_offset_ms: halfMs,
      timer_half: 2,
      timer_started_at: null,
    }).eq('id', m.id);
    reload();
  }

  async function startSecondHalf(m: Match) {
    await supabase.from('matches').update({
      timer_started_at: new Date().toISOString(),
      timer_paused_at: null,
      timer_half: 2,
    }).eq('id', m.id);
    reload();
  }

  async function resetTimer(m: Match) {
    await supabase.from('matches').update({
      timer_started_at: null,
      timer_paused_at: null,
      timer_offset_ms: 0,
      timer_half: 1,
    }).eq('id', m.id);
    reload();
  }

  async function applyManualMinute(m: Match) {
    const min = parseInt(manualMinute);
    if (isNaN(min) || min < 0) return;
    const half = min > m.timer_half_minutes ? 2 : 1;
    const offsetMs = min * 60_000;
    await supabase.from('matches').update({
      timer_offset_ms: offsetMs,
      timer_half: half,
      timer_started_at: m.timer_started_at && !m.timer_paused_at ? new Date().toISOString() : null,
      timer_paused_at: m.timer_paused_at ? new Date().toISOString() : null,
    }).eq('id', m.id);
    setManualMinute('');
    reload();
  }

  async function adjustMinute(m: Match, delta: number) {
    const timerState = getTimerState(m, now);
    let newMin = timerState.totalMinutes + delta;
    if (newMin < 0) newMin = 0;
    const half = newMin > m.timer_half_minutes ? 2 : 1;
    const offsetMs = newMin * 60_000;
    await supabase.from('matches').update({
      timer_offset_ms: offsetMs,
      timer_half: half,
      timer_started_at: m.timer_started_at && !m.timer_paused_at ? new Date().toISOString() : null,
      timer_paused_at: m.timer_paused_at ? new Date().toISOString() : null,
    }).eq('id', m.id);
    reload();
  }

  async function addExtraTime(m: Match, mins: number) {
    const timerState = getTimerState(m, now);
    const newMs = timerState.currentMs + mins * 60_000;
    const newMin = Math.floor(newMs / 60_000);
    const half = m.timer_half;
    await supabase.from('matches').update({
      timer_offset_ms: newMs,
      timer_half: half,
      timer_started_at: m.timer_started_at && !m.timer_paused_at ? new Date().toISOString() : null,
      timer_paused_at: m.timer_paused_at ? new Date().toISOString() : null,
    }).eq('id', m.id);
    reload();
  }

  async function finishMatch(m: Match) {
    await supabase.from('matches').update({
      status: 'finished',
      timer_paused_at: new Date().toISOString(),
    }).eq('id', m.id);
    reload();
  }

  async function addCard() {
    if (!scoreMatch || !cardPlayer || !cardAsc) return;
    const timerState = getTimerState(scoreMatch, now);
    let minute: number;
    if (cardMinute.trim()) {
      minute = parseInt(cardMinute) || 1;
    } else {
      minute = Math.max(1, Math.floor(timerState.currentMs / 60_000));
    }
    await supabase.from('cards').insert({
      match_id: scoreMatch.id,
      player_id: cardPlayer,
      asc_id: cardAsc,
      card_type: cardType,
      minute,
    });
    setCardPlayer('');
    setCardMinute('');
    reload();
  }

  async function deleteCard(cardId: string) {
    await supabase.from('cards').delete().eq('id', cardId);
    reload();
  }

  const matchGoals = data.goals.filter((g) => g.match_id === scoreMatch?.id);
  const matchCards = data.cards.filter((c) => c.match_id === scoreMatch?.id);
  const playersForGoal = data.players.filter((p) => p.asc_id === goalAsc);
  const playersForCard = data.players.filter((p) => p.asc_id === cardAsc);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Matchs & Scores ({data.matches.length})</h3>
        {!showForm && !scoreMatch && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Nouveau match
          </button>
        )}
      </div>

      {/* Match form */}
      {showForm && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? 'Modifier le match' : 'Créer une rencontre'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">ASC Domicile</label>
              <select className="input" value={homeId} onChange={(e) => setHomeId(e.target.value)}>
                <option value="">Sélectionner…</option>
                {data.ascs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ASC Extérieur</label>
              <select className="input" value={awayId} onChange={(e) => setAwayId(e.target.value)}>
                <option value="">Sélectionner…</option>
                {data.ascs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Zone</label>
              <select className="input" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value="">Sans zone</option>
                {data.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Poule {autoPoule ? <span className="text-[#10B981] normal-case font-normal">(auto)</span> : ''}</label>
              {autoPoule ? (
                <div className="input flex items-center gap-2 bg-[#10B981]/5 border-[#10B981]/20 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span className="text-sm text-gray-300">{pouleName(data.poules, autoPoule)}</span>
                </div>
              ) : (
                <select className="input" value={pouleId} onChange={(e) => setPouleId(e.target.value)} disabled={!editing}>
                  <option value="">Sans poule</option>
                  {data.poules.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              {homeId && !autoPoule && (
                <p className="text-xs text-amber-400/70 mt-1">L'équipe domicile n'appartient à aucune poule.</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Heure</label>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Stade</label>
            <input className="input" value={stadium} onChange={(e) => setStadium(e.target.value)} placeholder="Stade Ngalandou Diouf" />
          </div>
          <div>
            <label className="label">Statut</label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    status === s ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      )}

      {/* Score editor */}
      {scoreMatch && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              Gestion du score
            </h3>
            <button onClick={() => { setScoreMatch(null); saveScore(); }} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live timer controls */}
          <TimerControls
            match={scoreMatch}
            now={now}
            onStartFirstHalf={() => startTimer(scoreMatch)}
            onPause={() => pauseTimer(scoreMatch)}
            onResume={() => resumeTimer(scoreMatch)}
            onHalfTime={() => setHalfTime(scoreMatch)}
            onStartSecondHalf={() => startSecondHalf(scoreMatch)}
            onReset={() => resetTimer(scoreMatch)}
            onFinish={() => finishMatch(scoreMatch)}
            manualMinute={manualMinute}
            setManualMinute={setManualMinute}
            onSetManual={() => applyManualMinute(scoreMatch)}
            onAdjust={(delta) => adjustMinute(scoreMatch, delta)}
            onAddExtra={(mins) => addExtraTime(scoreMatch, mins)}
          />

          {/* Score display + manual edit */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{data.ascs.find((a) => a.id === scoreMatch.home_asc_id)?.name}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setHomeScore((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-bold w-12 text-center">{homeScore}</span>
                <button onClick={() => setHomeScore((s) => s + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className="text-gray-600 text-xl">-</span>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{data.ascs.find((a) => a.id === scoreMatch.away_asc_id)?.name}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setAwayScore((s) => Math.max(0, s - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-bold w-12 text-center">{awayScore}</span>
                <button onClick={() => setAwayScore((s) => s + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status quick change */}
          <div className="flex gap-2 justify-center">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={async () => { setStatus(s); await supabase.from('matches').update({ status: s }).eq('id', scoreMatch.id); reload(); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-400'}`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <button onClick={saveScore} className="btn-primary w-full flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Enregistrer le score
          </button>

          {/* Add goal */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Goal className="w-4 h-4 text-[#10B981]" /> Attribuer un but
            </h4>
            <div className="grid sm:grid-cols-3 gap-2">
              <select
                className="input"
                value={goalAsc}
                onChange={(e) => { setGoalAsc(e.target.value); setGoalPlayer(''); }}
              >
                <option value="">ASC buteur</option>
                <option value={scoreMatch.home_asc_id}>{data.ascs.find((a) => a.id === scoreMatch.home_asc_id)?.name}</option>
                <option value={scoreMatch.away_asc_id}>{data.ascs.find((a) => a.id === scoreMatch.away_asc_id)?.name}</option>
              </select>
              <select className="input" value={goalPlayer} onChange={(e) => setGoalPlayer(e.target.value)} disabled={playersForGoal.length === 0}>
                <option value="">Joueur</option>
                {playersForGoal.map((p) => (
                  <option key={p.id} value={p.id}>N°{p.jersey_number} · {p.first_name} {p.last_name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={120}
                  placeholder={`Min (auto: ${getTimerState(scoreMatch, now).displayMinute})`}
                  value={goalMinute}
                  onChange={(e) => setGoalMinute(e.target.value)}
                />
                <button onClick={addGoal} className="btn-primary shrink-0 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Laissez le champ "Min" vide pour utiliser automatiquement la minute actuelle du chronomètre ({getTimerState(scoreMatch, now).displayMinute}).
            </p>
          </div>

          {/* Goals list */}
          {matchGoals.length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <h4 className="font-medium text-sm mb-2">Buts enregistrés</h4>
              <div className="space-y-1.5">
                {matchGoals.sort((a, b) => a.minute - b.minute).map((g) => {
                  const player = data.players.find((p) => p.id === g.player_id);
                  const asc = data.ascs.find((a) => a.id === g.asc_id);
                  return (
                    <div key={g.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm">
                      <span className="text-xs font-mono text-gray-500 w-8">{g.minute}'</span>
                      <span className="flex-1 truncate">
                        {player ? `${player.first_name} ${player.last_name}` : 'Inconnu'}
                        <span className="text-gray-500 text-xs ml-1">({asc?.name})</span>
                      </span>
                      <button onClick={() => deleteGoal(g.id, g.asc_id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add card */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Square className="w-4 h-4 text-amber-400" /> Attribuer un carton
            </h4>
            <div className="grid sm:grid-cols-4 gap-2">
              <select
                className="input"
                value={cardAsc}
                onChange={(e) => { setCardAsc(e.target.value); setCardPlayer(''); }}
              >
                <option value="">ASC</option>
                <option value={scoreMatch.home_asc_id}>{data.ascs.find((a) => a.id === scoreMatch.home_asc_id)?.name}</option>
                <option value={scoreMatch.away_asc_id}>{data.ascs.find((a) => a.id === scoreMatch.away_asc_id)?.name}</option>
              </select>
              <select className="input" value={cardPlayer} onChange={(e) => setCardPlayer(e.target.value)} disabled={playersForCard.length === 0}>
                <option value="">Joueur</option>
                {playersForCard.map((p) => (
                  <option key={p.id} value={p.id}>N°{p.jersey_number} · {p.first_name} {p.last_name}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => setCardType('yellow')}
                  className={`flex-1 px-2 py-2 rounded-xl text-xs font-bold transition-colors ${cardType === 'yellow' ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400'}`}
                >
                  🟨 Jaune
                </button>
                <button
                  onClick={() => setCardType('red')}
                  className={`flex-1 px-2 py-2 rounded-xl text-xs font-bold transition-colors ${cardType === 'red' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'}`}
                >
                  🟥 Rouge
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Min"
                  value={cardMinute}
                  onChange={(e) => setCardMinute(e.target.value)}
                />
                <button onClick={addCard} className="btn-primary shrink-0 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards list */}
          {matchCards.length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <h4 className="font-medium text-sm mb-2">Cartons enregistrés</h4>
              <div className="space-y-1.5">
                {matchCards.sort((a, b) => a.minute - b.minute).map((c) => {
                  const player = data.players.find((p) => p.id === c.player_id);
                  const asc = data.ascs.find((a) => a.id === c.asc_id);
                  return (
                    <div key={c.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm">
                      <span className="text-xs font-mono text-gray-500 w-8">{c.minute}'</span>
                      <span>{c.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                      <span className="flex-1 truncate">
                        {player ? `${player.first_name} ${player.last_name}` : 'Inconnu'}
                        <span className="text-gray-500 text-xs ml-1">({asc?.name})</span>
                      </span>
                      <button onClick={() => deleteCard(c.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matches list */}
      {!showForm && !scoreMatch && (
        <div className="space-y-2">
          {data.matches.map((m) => {
            const home = data.ascs.find((a) => a.id === m.home_asc_id);
            const away = data.ascs.find((a) => a.id === m.away_asc_id);
            if (!home || !away) return null;
            const timerState = getTimerState(m, now);
            return (
              <div key={m.id} className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`chip text-xs ${
                    m.status === 'live' ? 'text-red-400 bg-red-400/10 border-red-400/30' :
                    m.status === 'finished' ? 'text-slate-400 bg-slate-400/10 border-slate-400/30' :
                    'text-amber-400 bg-amber-400/10 border-amber-400/30'
                  }`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                  {m.status === 'live' && timerState.running && (
                    <span className="chip text-xs text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30 font-mono">
                      <Clock className="w-3 h-3" /> {timerState.displayMinute}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{zoneName(data.zones, m.zone_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <AscAvatar asc={home} size="sm" />
                    <span className="text-sm font-medium truncate">{home.name}</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{m.home_score} - {m.away_score}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="text-sm font-medium truncate">{away.name}</span>
                    <AscAvatar asc={away} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5 text-xs text-gray-500">
                  <span>{formatDateTime(m.match_date)}</span>
                  {m.stadium && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.stadium}</span>}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openScoreEditor(m)} className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5">
                    <Radio className="w-3.5 h-3.5" /> Score & Buts
                  </button>
                  <button onClick={() => startEdit(m)} className="text-gray-400 hover:text-white p-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-300 p-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {data.matches.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">Aucun match créé.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TimerControls({
  match,
  now,
  onStartFirstHalf,
  onPause,
  onResume,
  onHalfTime,
  onStartSecondHalf,
  onReset,
  onFinish,
  manualMinute,
  setManualMinute,
  onSetManual,
  onAdjust,
  onAddExtra,
}: {
  match: Match;
  now: number;
  onStartFirstHalf: () => void;
  onPause: () => void;
  onResume: () => void;
  onHalfTime: () => void;
  onStartSecondHalf: () => void;
  onReset: () => void;
  onFinish: () => void;
  manualMinute: string;
  setManualMinute: (v: string) => void;
  onSetManual: () => void;
  onAdjust: (delta: number) => void;
  onAddExtra: (mins: number) => void;
}) {
  const timerState = getTimerState(match, now);
  const isRunning = timerState.running;
  const isPaused = !!match.timer_paused_at;
  const hasStarted = !!match.timer_started_at || match.status === 'live';
  const isSecondHalf = match.timer_half === 2;
  const isFinished = match.status === 'finished';

  return (
    <div className="bg-[#0B0F17] border border-white/5 rounded-2xl p-4 space-y-4">
      {/* Scoreboard display */}
      <div className="text-center py-4 bg-black/40 rounded-xl border border-white/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
            isRunning ? 'bg-[#10B981]/20 text-[#10B981]' : isPaused ? 'bg-amber-500/20 text-amber-400' : isFinished ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#10B981] animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-gray-500'}`} />
            {isRunning ? 'EN COURS' : isPaused ? 'PAUSE' : isFinished ? 'TERMINÉ' : 'ARRÊTÉ'}
          </span>
        </div>
        <div className={`font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-wider ${
          isRunning ? 'text-[#10B981]' : 'text-gray-500'
        }`}>
          {timerState.displayTime}
        </div>
        <div className="mt-2 text-xs text-gray-500 font-mono">
          {match.timer_half === 1 ? '1ère mi-temps' : '2ème mi-temps'} · {timerState.displayMinute}
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-1 rounded-full ${match.timer_half === 1 ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-white/5 text-gray-500'}`}>1ère MT</span>
        <span className={`px-2 py-1 rounded-full ${match.timer_half === 2 ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-white/5 text-gray-500'}`}>2ème MT</span>
      </div>

      {/* State buttons */}
      <div className="flex flex-wrap gap-2">
        {!isFinished && !hasStarted && (
          <button onClick={onStartFirstHalf} className="btn-primary flex items-center gap-1.5 text-sm">
            <Play className="w-4 h-4" /> Démarrer 1ère mi-temps
          </button>
        )}
        {!isFinished && isRunning && (
          <button onClick={onPause} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {!isFinished && isPaused && !isSecondHalf && (
          <button onClick={onResume} className="btn-primary flex items-center gap-1.5 text-sm">
            <Play className="w-4 h-4" /> Reprendre
          </button>
        )}
        {!isFinished && !isSecondHalf && hasStarted && (
          <button onClick={onHalfTime} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Pause className="w-4 h-4" /> Mi-temps (45')
          </button>
        )}
        {!isFinished && isSecondHalf && !isRunning && (
          <button onClick={onStartSecondHalf} className="btn-primary flex items-center gap-1.5 text-sm">
            <Play className="w-4 h-4" /> Démarrer 2ème mi-temps
          </button>
        )}
        {!isFinished && (
          <button onClick={onFinish} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl px-3 py-2">
            <Check className="w-4 h-4" /> Terminer le match
          </button>
        )}
        {hasStarted && !isFinished && (
          <button onClick={onReset} className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2">
            <RotateCcw className="w-4 h-4" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Quick time add buttons */}
      {!isFinished && hasStarted && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Temps additionnel:</span>
          <button onClick={() => onAddExtra(1)} className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] text-xs font-bold transition-colors">
            +1 min
          </button>
          <button onClick={() => onAddExtra(2)} className="px-3 py-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] text-xs font-bold transition-colors">
            +2 min
          </button>
        </div>
      )}

      {/* Manual minute adjustment */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <label className="text-xs text-gray-500 whitespace-nowrap">Minute:</label>
        <button onClick={() => onAdjust(-1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0">
          <Minus className="w-4 h-4" />
        </button>
        <input
          className="input flex-1 py-1.5 text-sm"
          type="number"
          min={0}
          max={120}
          placeholder="ex: 35"
          value={manualMinute}
          onChange={(e) => setManualMinute(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSetManual()}
        />
        <button onClick={() => onAdjust(1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={onSetManual} className="btn-ghost text-sm px-3 py-1.5 shrink-0">
          Appliquer
        </button>
      </div>
    </div>
  );
}
