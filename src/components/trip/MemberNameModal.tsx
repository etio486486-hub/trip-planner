"use client";

import { useState } from "react";
import { User } from "lucide-react";

type MemberNameModalProps = {
  open: boolean;
  initialName?: string;
  onSave: (name: string) => Promise<void>;
};

export function MemberNameModal({
  open,
  initialName = "",
  onSave,
}: MemberNameModalProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("이름은 2글자 이상 입력해 주세요.");
      return;
    }
    if (trimmed.length > 12) {
      setError("이름은 12글자 이하로 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(trimmed);
    } catch {
      setError("이름 저장에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-xl safe-bottom"
      >
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800">
          <User className="h-5 w-5 text-blue-600" />
          참여 이름 설정
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          다른 멤버에게 보이는 이름입니다. 원하는 닉네임을 입력하세요.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 민수, 지영"
          maxLength={12}
          className="mb-2 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
          autoFocus
          disabled={saving}
        />
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-[48px]"
        >
          {saving ? "저장 중..." : "참여하기"}
        </button>
      </form>
    </div>
  );
}
