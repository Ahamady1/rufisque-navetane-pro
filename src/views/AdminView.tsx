import { useState } from 'react';
import type { AppData } from '@/App';
import AdminZones from '@/components/admin/AdminZones';
import AdminAscs from '@/components/admin/AdminAscs';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminMatches from '@/components/admin/AdminMatches';
import { MapPin, Shield, Users, CalendarDays, Trophy, LogOut } from 'lucide-react';

type AdminSection = 'zones' | 'ascs' | 'players' | 'matches';

const SECTIONS: { id: AdminSection; label: string; icon: typeof Trophy; desc: string }[] = [
  { id: 'zones', label: 'Zones & Poules', icon: MapPin, desc: 'Organisation géographique' },
  { id: 'ascs', label: 'ASC (Équipes)', icon: Shield, desc: 'Gestion des équipes' },
  { id: 'players', label: 'Joueurs & Licences', icon: Users, desc: 'Effectifs et licences' },
  { id: 'matches', label: 'Matchs & Scores', icon: CalendarDays, desc: 'Rencontres et buts' },
];

export default function AdminView({
  data,
  reload,
  onSignOut,
}: {
  data: AppData;
  reload: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [section, setSection] = useState<AdminSection>('zones');

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold">Espace Admin</h2>
        </div>
        <p className="text-gray-500 text-sm">Gestion du championnat — espace sécurisé réservé aux administrateurs</p>
      </div>

      {/* Sign out (mobile-friendly, visible within admin panel) */}
      <button
        onClick={onSignOut}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Déconnexion
      </button>

      {/* Section tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`p-3 rounded-xl text-left transition-colors border ${
              section === s.id
                ? 'bg-[#10B981]/10 border-[#10B981]/30'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <s.icon className={`w-5 h-5 mb-2 ${section === s.id ? 'text-[#10B981]' : 'text-gray-400'}`} />
            <p className={`font-semibold text-sm ${section === s.id ? 'text-white' : 'text-gray-300'}`}>{s.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
          </button>
        ))}
      </div>

      <div key={section} className="animate-fade-in">
        {section === 'zones' && <AdminZones data={data} reload={reload} />}
        {section === 'ascs' && <AdminAscs data={data} reload={reload} />}
        {section === 'players' && <AdminPlayers data={data} reload={reload} />}
        {section === 'matches' && <AdminMatches data={data} reload={reload} />}
      </div>
    </div>
  );
}
