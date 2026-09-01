/*
# Add logo_url to ascs, photo_url to players, and create storage buckets

1. Schema Changes
   - `ascs.logo_url` (text, nullable): public URL of the team's logo image stored in Supabase Storage.
   - `players.photo_url` (text, nullable): public URL of the player's photo stored in Supabase Storage.

2. Storage Buckets
   - `team-logos`: public bucket for ASC logo images.
   - `player-photos`: public bucket for player photo images.

3. Security
   - Buckets are public (anyone can read). Writes are allowed for anon+authenticated since this is a single-tenant app with admin-only UI gating at the app layer.
*/

ALTER TABLE ascs ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_team_logos" ON storage.objects;
CREATE POLICY "public_read_team_logos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "public_write_team_logos" ON storage.objects;
CREATE POLICY "public_write_team_logos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "public_update_team_logos" ON storage.objects;
CREATE POLICY "public_update_team_logos" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'team-logos') WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "public_delete_team_logos" ON storage.objects;
CREATE POLICY "public_delete_team_logos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "public_read_player_photos" ON storage.objects;
CREATE POLICY "public_read_player_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "public_write_player_photos" ON storage.objects;
CREATE POLICY "public_write_player_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "public_update_player_photos" ON storage.objects;
CREATE POLICY "public_update_player_photos" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'player-photos') WITH CHECK (bucket_id = 'player-photos');

DROP POLICY IF EXISTS "public_delete_player_photos" ON storage.objects;
CREATE POLICY "public_delete_player_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'player-photos');
