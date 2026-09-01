/*
# Rufisque Navétane Pro — Full Schema

1. New Tables
- `zones` : geographical zones (Zone 1, Zone 2, ...)
  - id (uuid pk), name (text unique), created_at
- `poules` : groups/pools within the championship (Poule A, Poule B, ...)
  - id (uuid pk), name (text unique), zone_id (fk zones), created_at
- `ascs` : teams (ASC = Association Sportive et Culturelle)
  - id (uuid pk), name (text), zone_id (fk zones, nullable), poule_id (fk poules, nullable), logo_color (text for avatar color), created_at
- `players` : players belonging to an ASC
  - id (uuid pk), asc_id (fk ascs), first_name (text), last_name (text), jersey_number (int), licence_number (text), position (text), created_at
- `matches` : fixtures between two ASCs
  - id (uuid pk), home_asc_id (fk ascs), away_asc_id (fk ascs), zone_id (fk zones, nullable), poule_id (fk poules, nullable), match_date (timestamtz), stadium (text), status (text: 'upcoming'|'live'|'finished'), home_score (int default 0), away_score (int default 0), created_at
- `goals` : goals scored in a match, attributed to a player
  - id (uuid pk), match_id (fk matches), player_id (fk players), asc_id (fk ascs), minute (int), own_goal (boolean default false), created_at

2. Security
- This is a no-auth single-tenant app (admin accessible without password for dev phase).
- RLS enabled on every table.
- Policies allow anon + authenticated full CRUD on all tables (public/shared data).
*/

CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_zones" ON zones;
CREATE POLICY "anon_select_zones" ON zones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_zones" ON zones;
CREATE POLICY "anon_insert_zones" ON zones FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_zones" ON zones;
CREATE POLICY "anon_update_zones" ON zones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_zones" ON zones;
CREATE POLICY "anon_delete_zones" ON zones FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS poules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE poules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_poules" ON poules;
CREATE POLICY "anon_select_poules" ON poules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_poules" ON poules;
CREATE POLICY "anon_insert_poules" ON poules FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_poules" ON poules;
CREATE POLICY "anon_update_poules" ON poules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_poules" ON poules;
CREATE POLICY "anon_delete_poules" ON poules FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS ascs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  poule_id uuid REFERENCES poules(id) ON DELETE SET NULL,
  logo_color text DEFAULT '#10B981',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ascs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ascs" ON ascs;
CREATE POLICY "anon_select_ascs" ON ascs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ascs" ON ascs;
CREATE POLICY "anon_insert_ascs" ON ascs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ascs" ON ascs;
CREATE POLICY "anon_update_ascs" ON ascs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ascs" ON ascs;
CREATE POLICY "anon_delete_ascs" ON ascs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asc_id uuid NOT NULL REFERENCES ascs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  jersey_number int NOT NULL DEFAULT 1,
  licence_number text,
  position text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_asc_id uuid NOT NULL REFERENCES ascs(id) ON DELETE CASCADE,
  away_asc_id uuid NOT NULL REFERENCES ascs(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  poule_id uuid REFERENCES poules(id) ON DELETE SET NULL,
  match_date timestamptz NOT NULL DEFAULT now(),
  stadium text,
  status text NOT NULL DEFAULT 'upcoming',
  home_score int NOT NULL DEFAULT 0,
  away_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_matches" ON matches;
CREATE POLICY "anon_select_matches" ON matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  asc_id uuid NOT NULL REFERENCES ascs(id) ON DELETE CASCADE,
  minute int NOT NULL DEFAULT 1,
  own_goal boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_goals" ON goals;
CREATE POLICY "anon_select_goals" ON goals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
CREATE POLICY "anon_insert_goals" ON goals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_goals" ON goals;
CREATE POLICY "anon_update_goals" ON goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "anon_delete_goals" ON goals FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ascs_zone ON ascs(zone_id);
CREATE INDEX IF NOT EXISTS idx_ascs_poule ON ascs(poule_id);
CREATE INDEX IF NOT EXISTS idx_players_asc ON players(asc_id);
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_asc_id);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_asc_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_zone ON matches(zone_id);
CREATE INDEX IF NOT EXISTS idx_matches_poule ON matches(poule_id);
CREATE INDEX IF NOT EXISTS idx_goals_match ON goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player ON goals(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_asc ON goals(asc_id);
