import { NextResponse } from "next/server";
import {
  aggregatePopularPlaces,
  type RawPopularPlaceRow,
} from "@/lib/popular-places";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ places: [] });
  }

  try {
    const { data, error } = await getSupabase()
      .from("places")
      .select(
        "name, google_place_id, latitude, longitude, memo, daily_plans!inner(trip_id)"
      )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json(
        { places: [], error: error.message },
        { status: 500 }
      );
    }

    const places = aggregatePopularPlaces(
      (data ?? []) as RawPopularPlaceRow[],
      10
    );

    return NextResponse.json(
      { places },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ places: [], error: message }, { status: 500 });
  }
}
