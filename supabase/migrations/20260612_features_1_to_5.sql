-- 기능 1~5: 정산·장소시간·환율·체크리스트 담당자
-- Supabase SQL Editor에서 실행

-- 장소: 방문 시간·체류 시간·메모(memo 기존)
ALTER TABLE places ADD COLUMN IF NOT EXISTS visit_time TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- 가계부: N분의 1 정산
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_user_ids TEXT[] NOT NULL DEFAULT '{}';

-- 체크리스트: 담당자
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
