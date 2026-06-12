"use client";

import { useState } from "react";
import { Check, Copy, Database } from "lucide-react";

const MIGRATION_SQL = `-- 체크리스트 & 가계부 테이블 생성
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '기타',
  title TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'JPY',
  category TEXT NOT NULL DEFAULT '기타',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by_user_id UUID,
  paid_by_name TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_trip ON checklist_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_all" ON checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;`;

export function MigrationNotice({ feature }: { feature: string }) {
  const [copied, setCopied] = useState(false);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10 text-center">
      <div className="rounded-full bg-amber-50 p-4">
        <Database className="h-8 w-8 text-amber-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-800">
          {feature} DB 설정이 필요합니다
        </h3>
        <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-zinc-500">
          Supabase에 <strong>checklist_items</strong>,{" "}
          <strong>expenses</strong> 테이블이 아직 없습니다.
          아래 SQL을 한 번만 실행하면 체크리스트·가계부가 모두
          동작합니다.
        </p>
      </div>
      <ol className="max-w-[300px] space-y-1.5 text-left text-xs text-zinc-600">
        <li>1. Supabase 대시보드 → SQL Editor</li>
        <li>2. 아래 SQL 복사 후 Run</li>
        <li>3. 이 페이지 새로고침</li>
      </ol>
      <button
        type="button"
        onClick={copySql}
        className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            SQL 복사됨!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            설정 SQL 복사
          </>
        )}
      </button>
      <p className="text-[10px] text-zinc-400">
        Realtime 추가 줄에서 오류가 나면 테이블은 이미 생성된 것입니다.
        새로고침만 하세요.
      </p>
    </div>
  );
}
