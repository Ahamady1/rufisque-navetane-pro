import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Zone, Poule, Asc, Player, Match, Goal, Card } from '@/lib/supabase';
import { TABS, type TabId } from '@/components/tabs';
import { Trophy, LogOut, Lock } from 'lucide-react';
import MatchesView from '@/views/MatchesView';
import StandingsView from '@/views/StandingsView';
import ScorersView from '@/views/ScorersView';
import DirectoryView from '@/views/DirectoryView';
import AdminView from '@/views/AdminView';
import LoginScreen from '@/components/LoginScreen';
import { useAuth } from '@/lib/auth';

export type AppData = {
  zones: Zone[];
  poules: Poule[];
  ascs: Asc[];
  players: Player[];
  matches: Match[];
  goals: Goal[];
  cards: Card[];
};

export default function App() {
  const { isAdmin, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>('matches');
  const [data, setData] = useState<AppData>({
    zones: [],
    poules: [],
    ascs: [],
    players: [],
    matches: [],
    goals: [],
    cards: [],
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [zones, poules, ascs, players, matches, goals, cards] = await Promise.all([
      supabase.from('zones').select('*').order('name'),
      supabase.from('poules').select('*').order('name'),
      supabase.from('ascs').select('*').order('name'),
      supabase.from('players').select('*').order('last_name'),
      supabase.from('matches').select('*').order('match_date'),
      supabase.from('goals').select('*'),
      supabase.from('cards').select('*'),
    ]);

    setData({
      zones: zones.data ?? [],
      poules: poules.data ?? [],
      ascs: ascs.data ?? [],
      players: players.data ?? [],
      matches: matches.data ?? [],
      goals: goals.data ?? [],
      cards: cards.data ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Show login screen when admin tab is selected but user is not authenticated
  if (tab === 'admin' && !authLoading && !isAdmin) {
    return <LoginScreen />;
  }

  const renderTab = (): ReactNode => {
    switch (tab) {
      case 'matches':
        return <MatchesView data={data} />;
      case 'standings':
        return <StandingsView data={data} />;
      case 'scorers':
        return <ScorersView data={data} />;
      case 'directory':
        return <DirectoryView data={data} />;
      case 'admin':
        return <AdminView data={data} reload={loadAll} onSignOut={signOut} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-white/5 bg-[#0B0F17] z-30">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Rufisque Navétane</h1>
            <p className="text-[#10B981] font-bold text-xs tracking-wider">PRO</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <t.icon className="w-5 h-5" />
              {t.label}
              {t.id === 'admin' && !isAdmin && (
                <Lock className="w-3 h-3 ml-auto text-gray-600" />
              )}
            </button>
          ))}
        </nav>
        {isAdmin && tab === 'admin' && (
          <div className="p-3 border-t border-white/5">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-gray-500">Session administrateur active</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        )}
        <div className="p-4 text-xs text-gray-600">
          Championnat Navétane de Rufisque
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
          <Trophy className="w-4 h-4 text-black" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">Rufisque Navétane <span className="text-[#10B981]">Pro</span></h1>
        </div>
        {isAdmin && tab === 'admin' && (
          <button
            onClick={signOut}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Quitter
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Chargement du championnat…</p>
            </div>
          ) : (
            <div key={tab} className="animate-fade-in">{renderTab()}</div>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#131826]/95 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center justify-around px-1 py-1.5 safe-bottom">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex-1 ${
                tab === t.id ? 'text-[#10B981]' : 'text-gray-500'
              }`}
            >
              <t.icon className="w-5 h-5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
