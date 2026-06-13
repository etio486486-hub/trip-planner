-- Pro 투표 모드: 멤버 투표 (맛집·일정 선택 등)

CREATE TABLE IF NOT EXISTS trip_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trip_poll_votes (
  poll_id UUID NOT NULL REFERENCES trip_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_polls_trip ON trip_polls(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_poll_votes_poll ON trip_poll_votes(poll_id);

ALTER TABLE trip_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_polls_all" ON trip_polls;
CREATE POLICY "trip_polls_all" ON trip_polls FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "trip_poll_votes_all" ON trip_poll_votes;
CREATE POLICY "trip_poll_votes_all" ON trip_poll_votes FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE trip_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_poll_votes;
