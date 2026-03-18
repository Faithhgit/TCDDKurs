import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 10;
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
  const actorRole = searchParams.get("actorRole")?.trim() ?? "all";
  const targetType = searchParams.get("targetType")?.trim() ?? "all";
  const query = searchParams.get("query")?.trim() ?? "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let totalQuery = supabaseAdmin.from("audit_logs").select("*", { count: "exact", head: true });
  let listQuery = supabaseAdmin.from("audit_logs").select("*").order("created_at", { ascending: false });

  if (actorRole !== "all") {
    totalQuery = totalQuery.eq("actor_role", actorRole);
    listQuery = listQuery.eq("actor_role", actorRole);
  }

  if (targetType !== "all") {
    totalQuery = totalQuery.eq("target_type", targetType);
    listQuery = listQuery.eq("target_type", targetType);
  }

  if (query) {
    const search = `%${query}%`;
    totalQuery = totalQuery.or(`actor_name.ilike.${search},action.ilike.${search},summary.ilike.${search}`);
    listQuery = listQuery.or(`actor_name.ilike.${search},action.ilike.${search},summary.ilike.${search}`);
  }

  const [totalRes, itemsRes] = await Promise.all([totalQuery, listQuery.range(from, to)]);

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
