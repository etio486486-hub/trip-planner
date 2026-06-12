"use client";

import { Database } from "lucide-react";

export function MigrationNotice({ feature }: { feature: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-amber-50 p-4">
        <Database className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-base font-semibold text-zinc-800">
        {feature} 테이블이 필요합니다
      </h3>
      <p className="max-w-[280px] text-sm leading-relaxed text-zinc-500">
        Supabase SQL Editor에서{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">
          supabase/migrations/20260611_checklist_expenses.sql
        </code>{" "}
        파일을 실행해 주세요.
      </p>
    </div>
  );
}
