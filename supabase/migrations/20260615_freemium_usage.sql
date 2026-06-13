-- Pro 기능 맛보기 사용량 (무료 플랜 횟수 제한)

CREATE TABLE IF NOT EXISTS pro_feature_usage (
  user_id UUID NOT NULL,
  feature_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, feature_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_pro_feature_usage_user
  ON pro_feature_usage (user_id);

ALTER TABLE pro_feature_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own freemium usage" ON pro_feature_usage;
CREATE POLICY "Users read own freemium usage"
  ON pro_feature_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own freemium usage" ON pro_feature_usage;
CREATE POLICY "Users insert own freemium usage"
  ON pro_feature_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own freemium usage" ON pro_feature_usage;
CREATE POLICY "Users update own freemium usage"
  ON pro_feature_usage FOR UPDATE
  USING (auth.uid() = user_id);
