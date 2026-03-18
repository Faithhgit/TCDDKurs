import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function getPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = getPositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [totalRes, itemsRes] = await Promise.all([
    supabaseAdmin.from("bug_reports").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("bug_reports").select("*").order("created_at", { ascending: false }).range(from, to),
  ]);

  if (totalRes.error || itemsRes.error) {
    return NextResponse.json({ error: totalRes.error?.message || itemsRes.error?.message }, { status: 500 });
  }

  const total = totalRes.count ?? 0;

  return NextResponse.json({
    items: itemsRes.data ?? [],
    total,
    page,
    limit,
    hasMore: from + limit < total,
  });
}
