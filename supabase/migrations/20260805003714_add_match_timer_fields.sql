-- Add timer fields to matches for live chronometer support.
-- timer_started_at: when the chrono was last started/resumed (null = stopped)
-- timer_paused_at: when the chrono was paused (null = running)
-- timer_offset_ms: accumulated elapsed time from previous start/pause cycles (default 0)
-- timer_half: 1 = first half, 2 = second half (default 1)
-- Half duration in minutes (default 45 for standard navétane matches)

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS timer_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS timer_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS timer_offset_ms bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_half int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS timer_half_minutes int NOT NULL DEFAULT 45;
