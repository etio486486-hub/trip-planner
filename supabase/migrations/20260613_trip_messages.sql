-- 멤버 채팅 메시지
CREATE TABLE IF NOT EXISTS trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_messages_trip ON trip_messages(trip_id, created_at DESC);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_messages_all" ON trip_messages FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE trip_messages;
