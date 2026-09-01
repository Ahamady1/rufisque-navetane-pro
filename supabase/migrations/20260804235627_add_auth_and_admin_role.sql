/*
# Add authentication & role-based access control

1. New Tables
- `profiles` : one row per auth user, holds the role (admin/member)
  - id (uuid pk, references auth.users ON DELETE CASCADE)
  - email (text)
  - role (text: 'admin' | 'member', default 'member')
  - created_at

2. Helper function
- `is_admin()` : returns true if the current authenticated user has role='admin' in profiles.

3. Trigger
- Auto-create a profile row (role='member') when a new auth.users row is inserted.

4. Security changes (RLS policy updates)
- All existing tables (zones, poules, ascs, players, matches, goals):
  - SELECT: stays open to anon + authenticated (public read).
  - INSERT / UPDATE / DELETE: restricted to authenticated users whose profile role is 'admin'.
- profiles: users can read their own profile; admins can read all.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== Update write policies to require admin =====

-- zones
DROP POLICY IF EXISTS "anon_insert_zones" ON zones;
CREATE POLICY "admin_insert_zones" ON zones FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_zones" ON zones;
CREATE POLICY "admin_update_zones" ON zones FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_zones" ON zones;
CREATE POLICY "admin_delete_zones" ON zones FOR DELETE
  TO authenticated USING (is_admin());

-- poules
DROP POLICY IF EXISTS "anon_insert_poules" ON poules;
CREATE POLICY "admin_insert_poules" ON poules FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_poules" ON poules;
CREATE POLICY "admin_update_poules" ON poules FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_poules" ON poules;
CREATE POLICY "admin_delete_poules" ON poules FOR DELETE
  TO authenticated USING (is_admin());

-- ascs
DROP POLICY IF EXISTS "anon_insert_ascs" ON ascs;
CREATE POLICY "admin_insert_ascs" ON ascs FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_ascs" ON ascs;
CREATE POLICY "admin_update_ascs" ON ascs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_ascs" ON ascs;
CREATE POLICY "admin_delete_ascs" ON ascs FOR DELETE
  TO authenticated USING (is_admin());

-- players
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "admin_insert_players" ON players FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "admin_update_players" ON players FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "admin_delete_players" ON players FOR DELETE
  TO authenticated USING (is_admin());

-- matches
DROP POLICY IF EXISTS "anon_insert_matches" ON matches;
CREATE POLICY "admin_insert_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_matches" ON matches;
CREATE POLICY "admin_update_matches" ON matches FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_matches" ON matches;
CREATE POLICY "admin_delete_matches" ON matches FOR DELETE
  TO authenticated USING (is_admin());

-- goals
DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
CREATE POLICY "admin_insert_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_update_goals" ON goals;
CREATE POLICY "admin_update_goals" ON goals FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "admin_delete_goals" ON goals FOR DELETE
  TO authenticated USING (is_admin());
