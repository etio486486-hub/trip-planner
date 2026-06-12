-- 여행 참여 코드 (링크/코드로만 입장)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

UPDATE trips
SET invite_code = upper(substring(replace(id::text, '-', '') from 1 for 6))
WHERE invite_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON trips(invite_code);
