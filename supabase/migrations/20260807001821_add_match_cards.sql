/*
# Add cards (yellow/red) for matches

1. New Tables
- `cards`
  - id (uuid pk)
  - match_id (uuid, fk matches, cascade delete)
  - player_id (uuid, fk players, set null on delete)
  - asc_id (uuid, fk ascs, cascade delete)
  - card_type (text: 'yellow' | 'red')
  - minute (int, default 1)
  - created_at (timestamptz)

2. Security
- RLS enabled on `cards`.
- Anon + authenticated full CRUD (single-tenant public data, same as goals).

3. Indexes
- idx_cards_match on cards(match_id)
- idx_cards_player on cards(player_id)
- idx_cards_asc on cards(asc_id)
*/

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  asc_id uuid NOT NULL REFERENCES ascs(id) ON DELETE CASCADE,
  card_type text NOT NULL DEFAULT 'yellow' CHECK (card_type IN ('yellow', 'red')),
  minute int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cards" ON cards;
CREATE POLICY "anon_select_cards" ON cards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cards" ON cards;
CREATE POLICY "anon_insert_cards" ON cards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cards" ON cards;
CREATE POLICY "anon_update_cards" ON cards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cards" ON cards;
CREATE POLICY "anon_delete_cards" ON cards FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cards_match ON cards(match_id);
CREATE INDEX IF NOT EXISTS idx_cards_player ON cards(player_id);
CREATE INDEX IF NOT EXISTS idx_cards_asc ON cards(asc_id);
