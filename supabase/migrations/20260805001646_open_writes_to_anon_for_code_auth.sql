-- Since auth is now frontend-only (localStorage + secret code), the browser
-- uses the anon key for all operations. Open write policies to anon so the
-- admin panel can insert/update/delete. Read stays open to anon+authenticated.

-- zones
DROP POLICY IF EXISTS "admin_insert_zones" ON zones;
DROP POLICY IF EXISTS "admin_update_zones" ON zones;
DROP POLICY IF EXISTS "admin_delete_zones" ON zones;
CREATE POLICY "anon_insert_zones" ON zones FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_zones" ON zones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_zones" ON zones FOR DELETE TO anon, authenticated USING (true);

-- poules
DROP POLICY IF EXISTS "admin_insert_poules" ON poules;
DROP POLICY IF EXISTS "admin_update_poules" ON poules;
DROP POLICY IF EXISTS "admin_delete_poules" ON poules;
CREATE POLICY "anon_insert_poules" ON poules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_poules" ON poules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_poules" ON poules FOR DELETE TO anon, authenticated USING (true);

-- ascs
DROP POLICY IF EXISTS "admin_insert_ascs" ON ascs;
DROP POLICY IF EXISTS "admin_update_ascs" ON ascs;
DROP POLICY IF EXISTS "admin_delete_ascs" ON ascs;
CREATE POLICY "anon_insert_ascs" ON ascs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_ascs" ON ascs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_ascs" ON ascs FOR DELETE TO anon, authenticated USING (true);

-- players
DROP POLICY IF EXISTS "admin_insert_players" ON players;
DROP POLICY IF EXISTS "admin_update_players" ON players;
DROP POLICY IF EXISTS "admin_delete_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_players" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_players" ON players FOR DELETE TO anon, authenticated USING (true);

-- matches
DROP POLICY IF EXISTS "admin_insert_matches" ON matches;
DROP POLICY IF EXISTS "admin_update_matches" ON matches;
DROP POLICY IF EXISTS "admin_delete_matches" ON matches;
CREATE POLICY "anon_insert_matches" ON matches FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_matches" ON matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_matches" ON matches FOR DELETE TO anon, authenticated USING (true);

-- goals
DROP POLICY IF EXISTS "admin_insert_goals" ON goals;
DROP POLICY IF EXISTS "admin_update_goals" ON goals;
DROP POLICY IF EXISTS "admin_delete_goals" ON goals;
CREATE POLICY "anon_insert_goals" ON goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_goals" ON goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_goals" ON goals FOR DELETE TO anon, authenticated USING (true);
