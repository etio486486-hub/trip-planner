"use client";

import { Calculator } from "lucide-react";

export function ExpensePanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="rounded-full bg-emerald-50 p-4">
        <Calculator className="h-8 w-8 text-emerald-500" />
      </div>
      <h3 className="text-base font-semibold text-zinc-800">여행 총경비 가계부</h3>
      <p className="max-w-[240px] text-sm leading-relaxed text-zinc-500">
        교통·식비·숙박 등 여행 경비를 함께 기록하는 기능입니다.
        <br />
        <span className="font-medium text-emerald-600">곧 업데이트 예정</span>
        입니다.
      </p>
    </div>
  );
}
