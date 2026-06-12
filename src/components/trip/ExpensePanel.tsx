"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
  Loader2,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  resolveMemberName,
  type ExpenseInput,
  type useTripExpenses,
} from "@/hooks/useTripExpenses";
import { formatDateKo, formatMoney } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CURRENCIES,
  type ExpenseCategory,
  type ExpenseCurrency,
} from "@/lib/trip-constants";
import type { TripMember } from "@/types/database";
import { MigrationNotice } from "./MigrationNotice";

type ExpensePanelProps = {
  expenses: ReturnType<typeof useTripExpenses>;
  members: TripMember[];
  currentUserId: string;
  tripStartDate?: string;
  tripEndDate?: string;
  isMobile?: boolean;
};

export function ExpensePanel({
  expenses: expenseState,
  members,
  currentUserId,
  tripStartDate,
  tripEndDate,
  isMobile = false,
}: ExpensePanelProps) {
  const {
    loading,
    error,
    needsMigration,
    totalsByCurrency,
    memberSummaries,
    categorySummaries,
    expensesByDate,
    addExpense,
    deleteExpense,
  } = expenseState;

  const [formOpen, setFormOpen] = useState(false);

  if (needsMigration) {
    return <MigrationNotice feature="가계부" />;
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const primaryCurrency =
    (Object.keys(totalsByCurrency)[0] as ExpenseCurrency) ?? "JPY";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 요약 카드 */}
      <div className="shrink-0 border-b border-zinc-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-zinc-800">총 지출</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {Object.keys(totalsByCurrency).length === 0 ? (
            <p className="text-2xl font-bold text-zinc-400">¥0</p>
          ) : (
            Object.entries(totalsByCurrency).map(([currency, total]) => (
              <p
                key={currency}
                className="text-2xl font-bold text-emerald-700"
              >
                {formatMoney(total, currency as ExpenseCurrency)}
              </p>
            ))
          )}
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {expensesByDate.length > 0
            ? `${expensesByDate.reduce((s, [, list]) => s + list.length, 0)}건 기록 · 멤버별 정산 참고`
            : "지출을 기록하면 멤버별 합계가 표시됩니다"}
        </p>
      </div>

      {/* 멤버별 정산 */}
      {memberSummaries.length > 0 && (
        <div className="shrink-0 border-b border-zinc-100 px-3 py-2">
          <p className="mb-1.5 px-1 text-[11px] font-semibold text-zinc-500">
            누가 얼마 냈나
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {memberSummaries.map((summary) => (
              <div
                key={summary.userId ?? summary.name}
                className="shrink-0 rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200"
              >
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-zinc-400" />
                  <span className="max-w-[80px] truncate text-xs font-medium text-zinc-800">
                    {summary.name}
                  </span>
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {Object.entries(summary.totalByCurrency).map(
                    ([currency, total]) => (
                      <p
                        key={currency}
                        className="text-sm font-bold text-emerald-700"
                      >
                        {formatMoney(total, currency as ExpenseCurrency)}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리별 */}
      {categorySummaries.length > 0 && (
        <div className="shrink-0 border-b border-zinc-100 px-3 py-2">
          <p className="mb-1.5 px-1 text-[11px] font-semibold text-zinc-500">
            카테고리별
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categorySummaries.map((cat) => {
              const color =
                EXPENSE_CATEGORY_COLORS[
                  cat.category as ExpenseCategory
                ] ?? EXPENSE_CATEGORY_COLORS["기타"];
              const mainTotal =
                cat.totalByCurrency[primaryCurrency] ??
                Object.values(cat.totalByCurrency)[0] ??
                0;
              const mainCurr =
                cat.totalByCurrency[primaryCurrency] != null
                  ? primaryCurrency
                  : (Object.keys(cat.totalByCurrency)[0] as ExpenseCurrency);
              return (
                <span
                  key={cat.category}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${color}`}
                >
                  {cat.category}
                  <span className="font-bold">
                    {formatMoney(mainTotal, mainCurr)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="shrink-0 px-4 py-2 text-xs text-red-600">{error}</p>
      )}

      {/* 지출 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {expensesByDate.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-zinc-500">
              아직 기록된 지출이 없습니다.
              <br />
              교통·식비·숙박 등을 함께 기록해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {expensesByDate.map(([date, list]) => (
              <section key={date}>
                <h4 className="mb-1.5 px-1 text-xs font-semibold text-zinc-500">
                  {formatDateKo(date)}
                </h4>
                <ul className="space-y-1.5">
                  {list.map((exp) => {
                    const color =
                      EXPENSE_CATEGORY_COLORS[
                        exp.category as ExpenseCategory
                      ] ?? EXPENSE_CATEGORY_COLORS["기타"];
                    return (
                      <li
                        key={exp.id}
                        className="group flex items-start gap-2 rounded-lg bg-white px-3 py-2.5 ring-1 ring-zinc-100"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${color}`}
                            >
                              {exp.category}
                            </span>
                            <span className="truncate text-sm font-medium text-zinc-800">
                              {exp.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-zinc-400">
                            {exp.paid_by_name ?? "미지정"} · 결제
                          </p>
                          {exp.memo && (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              {exp.memo}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-bold text-zinc-900">
                            {formatMoney(
                              exp.amount,
                              exp.currency as ExpenseCurrency
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("이 지출을 삭제할까요?"))
                                return;
                              try {
                                await deleteExpense(exp.id);
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "삭제 실패"
                                );
                              }
                            }}
                            className="rounded p-0.5 text-zinc-300 opacity-100 transition-opacity hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* 지출 추가 버튼 */}
      <div
        className={`shrink-0 border-t border-zinc-200 bg-white ${
          isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800"
        >
          <Plus className="h-4 w-4" />
          지출 추가
        </button>
      </div>

      {formOpen && (
        <ExpenseAddModal
          members={members}
          currentUserId={currentUserId}
          defaultDate={tripStartDate}
          minDate={tripStartDate}
          maxDate={tripEndDate}
          onClose={() => setFormOpen(false)}
          onSave={async (input) => {
            await addExpense(input);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ExpenseAddModal({
  members,
  currentUserId,
  defaultDate,
  minDate,
  maxDate,
  onClose,
  onSave,
}: {
  members: TripMember[];
  currentUserId: string;
  defaultDate?: string;
  minDate?: string;
  maxDate?: string;
  onClose: () => void;
  onSave: (input: ExpenseInput) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<ExpenseCurrency>("JPY");
  const [category, setCategory] = useState<string>("식비");
  const [expenseDate, setExpenseDate] = useState(defaultDate ?? today);
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    const parsed = Number(amount.replace(/,/g, ""));
    if (!title.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        amount: parsed,
        currency,
        category,
        expense_date: expenseDate,
        paid_by_user_id: paidByUserId || null,
        paid_by_name: resolveMemberName(members, paidByUserId),
        memo: memo.trim() || null,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">지출 추가</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="내용">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 라멘, 지하철, 호텔"
              autoFocus
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
            />
          </Field>

          <div className="flex gap-2">
            <Field label="금액" className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              />
            </Field>
            <Field label="통화" className="w-24">
              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as ExpenseCurrency)
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-emerald-400"
              >
                {EXPENSE_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="카테고리">
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const color =
                  EXPENSE_CATEGORY_COLORS[cat] ??
                  EXPENSE_CATEGORY_COLORS["기타"];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-opacity ${
                      category === cat
                        ? color
                        : "bg-zinc-50 text-zinc-500 ring-zinc-200 opacity-70"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="날짜">
            <input
              type="date"
              value={expenseDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </Field>

          <Field label="결제한 사람">
            <select
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ?? `유저 ${m.user_id.slice(0, 6)}`}
                  {m.user_id === currentUserId ? " (나)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="메모 (선택)">
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            saving || !title.trim() || !amount || Number(amount) <= 0
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          저장
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}
