"use client";

import { CheckSquare } from "lucide-react";

export function ChecklistPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="rounded-full bg-blue-50 p-4">
        <CheckSquare className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-base font-semibold text-zinc-800">여행 체크리스트</h3>
      <p className="max-w-[240px] text-sm leading-relaxed text-zinc-500">
        여권, 짐 싸기, 환전 등 준비물을 함께 체크하는 기능입니다.
        <br />
        <span className="font-medium text-blue-600">곧 업데이트 예정</span>
        입니다.
      </p>
    </div>
  );
}
