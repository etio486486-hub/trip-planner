"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckSquare,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { useTripChecklist } from "@/hooks/useTripChecklist";
import { isMissingTableError } from "@/lib/supabase/errors";
import { CHECKLIST_CATEGORIES } from "@/lib/trip-constants";
import { resolveMemberName } from "@/hooks/useTripExpenses";
import type { ChecklistItem, TripMember } from "@/types/database";
import { MigrationNotice } from "./MigrationNotice";

type ChecklistPanelProps = {
  checklist: ReturnType<typeof useTripChecklist>;
  members: TripMember[];
  isMobile?: boolean;
};

const ALL_FILTER = "전체";

export function ChecklistPanel({
  checklist,
  members,
  isMobile = false,
}: ChecklistPanelProps) {
  const {
    items,
    loading,
    error,
    needsMigration,
    progress,
    addItem,
    assignItem,
    toggleItem,
    deleteItem,
    seedTemplate,
  } = checklist;

  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("기타");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const filteredItems = useMemo(() => {
    if (filter === ALL_FILTER) return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    const order = [...CHECKLIST_CATEGORIES, "기타"];
    return order
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)! }));
  }, [filteredItems]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const assignee = newAssigneeId
        ? {
            userId: newAssigneeId,
            name: resolveMemberName(members, newAssigneeId),
          }
        : undefined;
      await addItem(newTitle, newCategory, assignee);
      setNewTitle("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "항목 추가 실패");
    } finally {
      setAdding(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedTemplate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "템플릿 추가 실패");
    } finally {
      setSeeding(false);
    }
  };

  if (needsMigration || (error && isMissingTableError({ message: error }))) {
    return <MigrationNotice feature="체크리스트" />;
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 진행률 */}
      <div className="shrink-0 border-b border-zinc-100 bg-gradient-to-r from-blue-50 to-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-zinc-800">
              준비 진행률
            </span>
          </div>
          <span className="text-sm font-bold text-blue-600">
            {progress.done}/{progress.total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {progress.percent === 100 && progress.total > 0
            ? "모든 준비가 끝났어요!"
            : `${progress.percent}% 완료 · 멤버와 실시간 동기화`}
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-zinc-100 px-3 py-2">
        {[ALL_FILTER, ...CHECKLIST_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <p className="shrink-0 px-4 py-2 text-xs text-red-600">{error}</p>
      )}

      {/* 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-zinc-500">
              체크리스트가 비어 있습니다.
              <br />
              기본 템플릿으로 빠르게 시작해 보세요.
            </p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              기본 준비물 템플릿 추가
            </button>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {grouped.map(({ category, items: catItems }) => {
              const done = catItems.filter((i) => i.is_checked).length;
              return (
                <section key={category}>
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <h4 className="text-xs font-semibold text-zinc-700">
                      {category}
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {done}/{catItems.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {catItems.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        item={item}
                        members={members}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        onAssign={assignItem}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* 추가 입력 */}
      <div
        className={`shrink-0 border-t border-zinc-200 bg-white ${
          isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""
        }`}
      >
        <div className="flex flex-wrap gap-2 px-3 py-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
          >
            {CHECKLIST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={newAssigneeId}
            onChange={(e) => setNewAssigneeId(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
          >
            <option value="">담당자 (선택)</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name ?? m.user_id.slice(0, 6)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="할 일 추가..."
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  members,
  onToggle,
  onDelete,
  onAssign,
}: {
  item: ChecklistItem;
  members: TripMember[];
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssign: (
    id: string,
    userId: string | null,
    name: string | null
  ) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <li
      className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
        item.is_checked ? "bg-zinc-50" : "bg-white ring-1 ring-zinc-100"
      }`}
    >
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onToggle(item.id, !item.is_checked);
          } finally {
            setBusy(false);
          }
        }}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          item.is_checked
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-zinc-300 bg-white hover:border-blue-400"
        }`}
      >
        {item.is_checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <span
          className={`text-sm ${
            item.is_checked
              ? "text-zinc-400 line-through"
              : "text-zinc-800"
          }`}
        >
          {item.title}
        </span>
        <select
          value={item.assigned_to_user_id ?? ""}
          disabled={busy}
          onChange={async (e) => {
            const uid = e.target.value || null;
            setBusy(true);
            try {
              await onAssign(
                item.id,
                uid,
                uid ? resolveMemberName(members, uid) : null
              );
            } finally {
              setBusy(false);
            }
          }}
          className="mt-0.5 block max-w-full truncate rounded border-0 bg-transparent p-0 text-[10px] text-blue-600 outline-none"
        >
          <option value="">담당자 없음</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              @{m.display_name ?? m.user_id.slice(0, 6)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={async () => {
          if (!window.confirm("이 항목을 삭제할까요?")) return;
          setBusy(true);
          try {
            await onDelete(item.id);
          } finally {
            setBusy(false);
          }
        }}
        className="shrink-0 rounded p-1 text-zinc-300 opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
        title="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
