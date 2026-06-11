-- Trip Planner Database Schema
-- Run this in Supabase SQL Editor

-- trips: 여행 기본 정보
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- trip_members: 실시간 공유용 멤버 목록
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

-- daily_plans: 일차별 일정 (1일차, 2일차...)
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (trip_id, day_number)
);

-- places: 방문 장소
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_place_id TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  visit_order INT NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_trip ON daily_plans(trip_id);
CREATE INDEX IF NOT EXISTS idx_places_daily_plan ON places(daily_plan_id);

-- Row Level Security (개발용 — 프로덕션에서는 auth 기반 정책으로 교체)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_all" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "trip_members_all" ON trip_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "daily_plans_all" ON daily_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "places_all" ON places FOR ALL USING (true) WITH CHECK (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE places;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;

-- 샘플 데이터 (선택)
-- INSERT INTO trips (title, start_date, end_date, creator_id)
-- VALUES ('제주도 여행', '2026-06-15', '2026-06-17', '00000000-0000-0000-0000-000000000001');
