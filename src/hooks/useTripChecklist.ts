"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getSupabaseErrorMessage,
  isMissingTableError,
} from "@/lib/supabase/errors";
import {
  CHECKLIST_CATEGORIES,
  DEFAULT_CHECKLIST_TEMPLATE,
  type ChecklistCategory,
} from "@/lib/trip-constants";
import type { ChecklistItem } from "@/types/database";

function sortItems(items: ChecklistItem[]): ChecklistItem[] {
  const categoryOrder = new Map(
    CHECKLIST_CATEGORIES.map((c, i) => [c, i])
  );
  return [...items].sort((a, b) => {
    const catA = categoryOrder.get(a.category as ChecklistCategory) ?? 99;
    const catB = categoryOrder.get(b.category as ChecklistCategory) ?? 99;
    if (catA !== catB) return catA - catB;
    return a.sort_order - b.sort_order;
  });
}

export function useTripChecklist(tripId: string, currentUserId: string) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const loadItems = useCallback(async () => {
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
        .from("checklist_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true });

      if (fetchError) {
        if (isMissingTableError(fetchError, "checklist_items")) {
          setNeedsMigration(true);
          setItems([]);
          return;
        }
        throw fetchError;
      }

      setItems(sortItems(data ?? []));
    } catch (err) {
      if (isMissingTableError(err, "checklist_items")) {
        setNeedsMigration(true);
        setItems([]);
      } else {
        setError(getSupabaseErrorMessage(err) || "체크리스트 로드 실패");
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!isSupabaseConfigured() || needsMigration) return;

    const channel = getSupabase()
      .channel(`checklist:trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checklist_items",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (!id) return;
            setItems((prev) => prev.filter((item) => item.id !== id));
            return;
          }

          const row = payload.new as ChecklistItem;
          if (row.trip_id !== tripId) return;

          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((item) => item.id === row.id)) return prev;
              return sortItems([...prev, row]);
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              sortItems(prev.map((item) => (item.id === row.id ? row : item)))
            );
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId, needsMigration]);

  const progress = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.is_checked).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [items]);

  const addItem = useCallback(
    async (title: string, category: string = "기타") => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const nextOrder =
        items.length > 0
          ? Math.max(...items.map((item) => item.sort_order)) + 1
          : 1;

      const { error: insertError } = await getSupabase()
        .from("checklist_items")
        .insert({
          trip_id: tripId,
          title: trimmed,
          category,
          sort_order: nextOrder,
          created_by: currentUserId || null,
        });

      if (insertError) throw insertError;
    },
    [tripId, items, currentUserId]
  );

  const toggleItem = useCallback(async (id: string, isChecked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_checked: isChecked } : item
      )
    );

    const { error: updateError } = await getSupabase()
      .from("checklist_items")
      .update({ is_checked: isChecked })
      .eq("id", id);

    if (updateError) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_checked: !isChecked } : item
        )
      );
      throw updateError;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    const { error: deleteError } = await getSupabase()
      .from("checklist_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setItems(previous);
      throw deleteError;
    }
  }, [items]);

  const seedTemplate = useCallback(async () => {
    const rows = DEFAULT_CHECKLIST_TEMPLATE.map((item, index) => ({
      trip_id: tripId,
      category: item.category,
      title: item.title,
      sort_order: index + 1,
      created_by: currentUserId || null,
    }));

    const { error: insertError } = await getSupabase()
      .from("checklist_items")
      .insert(rows);

    if (insertError) throw insertError;
  }, [tripId, currentUserId]);

  return {
    items,
    loading,
    error,
    needsMigration,
    progress,
    addItem,
    toggleItem,
    deleteItem,
    seedTemplate,
    reload: loadItems,
  };
}
