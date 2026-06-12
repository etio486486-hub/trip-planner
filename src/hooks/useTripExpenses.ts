"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ExpenseCurrency } from "@/lib/trip-constants";
import type { Expense, TripMember } from "@/types/database";

export type ExpenseInput = {
  title: string;
  amount: number;
  currency: ExpenseCurrency;
  category: string;
  expense_date: string;
  paid_by_user_id: string | null;
  paid_by_name: string;
  memo?: string | null;
};

export type MemberExpenseSummary = {
  userId: string | null;
  name: string;
  totalByCurrency: Record<string, number>;
};

export type CategoryExpenseSummary = {
  category: string;
  totalByCurrency: Record<string, number>;
};

function isMissingTableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("expenses") &&
    (msg.includes("does not exist") || msg.includes("schema cache"))
  );
}

function parseAmount(value: number | string): number {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function useTripExpenses(tripId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsMigration(false);

    try {
      const { data, error: fetchError } = await getSupabase()
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) {
        if (isMissingTableError(fetchError)) {
          setNeedsMigration(true);
          setExpenses([]);
          return;
        }
        throw fetchError;
      }

      setExpenses(
        (data ?? []).map((row) => ({
          ...row,
          amount: parseAmount(row.amount),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "가계부 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    if (!isSupabaseConfigured() || needsMigration) return;

    const channel = getSupabase()
      .channel(`expenses:trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (!id) return;
            setExpenses((prev) => prev.filter((exp) => exp.id !== id));
            return;
          }

          const row = payload.new as Expense;
          if (row.trip_id !== tripId) return;
          const normalized = { ...row, amount: parseAmount(row.amount) };

          if (payload.eventType === "INSERT") {
            setExpenses((prev) => {
              if (prev.some((exp) => exp.id === normalized.id)) return prev;
              return [normalized, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setExpenses((prev) =>
              prev.map((exp) => (exp.id === normalized.id ? normalized : exp))
            );
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId, needsMigration]);

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const exp of expenses) {
      totals[exp.currency] = (totals[exp.currency] ?? 0) + exp.amount;
    }
    return totals;
  }, [expenses]);

  const memberSummaries = useMemo((): MemberExpenseSummary[] => {
    const map = new Map<string, MemberExpenseSummary>();

    for (const exp of expenses) {
      const key = exp.paid_by_user_id ?? exp.paid_by_name ?? "unknown";
      const name = exp.paid_by_name ?? "미지정";
      const existing = map.get(key) ?? {
        userId: exp.paid_by_user_id,
        name,
        totalByCurrency: {},
      };
      existing.totalByCurrency[exp.currency] =
        (existing.totalByCurrency[exp.currency] ?? 0) + exp.amount;
      map.set(key, existing);
    }

    return [...map.values()].sort((a, b) => {
      const aTotal = Object.values(a.totalByCurrency).reduce((s, v) => s + v, 0);
      const bTotal = Object.values(b.totalByCurrency).reduce((s, v) => s + v, 0);
      return bTotal - aTotal;
    });
  }, [expenses]);

  const categorySummaries = useMemo((): CategoryExpenseSummary[] => {
    const map = new Map<string, CategoryExpenseSummary>();

    for (const exp of expenses) {
      const existing = map.get(exp.category) ?? {
        category: exp.category,
        totalByCurrency: {},
      };
      existing.totalByCurrency[exp.currency] =
        (existing.totalByCurrency[exp.currency] ?? 0) + exp.amount;
      map.set(exp.category, existing);
    }

    return [...map.values()];
  }, [expenses]);

  const expensesByDate = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const list = groups.get(exp.expense_date) ?? [];
      list.push(exp);
      groups.set(exp.expense_date, list);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const { error: insertError } = await getSupabase().from("expenses").insert({
        trip_id: tripId,
        title: input.title.trim(),
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        expense_date: input.expense_date,
        paid_by_user_id: input.paid_by_user_id,
        paid_by_name: input.paid_by_name,
        memo: input.memo ?? null,
      });

      if (insertError) throw insertError;
    },
    [tripId]
  );

  const deleteExpense = useCallback(async (id: string) => {
    const previous = expenses;
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));

    const { error: deleteError } = await getSupabase()
      .from("expenses")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setExpenses(previous);
      throw deleteError;
    }
  }, [expenses]);

  return {
    expenses,
    loading,
    error,
    needsMigration,
    totalsByCurrency,
    memberSummaries,
    categorySummaries,
    expensesByDate,
    addExpense,
    deleteExpense,
    reload: loadExpenses,
  };
}

export function resolveMemberName(
  members: TripMember[],
  userId: string
): string {
  const member = members.find((m) => m.user_id === userId);
  return member?.display_name ?? `유저 ${userId.slice(0, 6)}`;
}
