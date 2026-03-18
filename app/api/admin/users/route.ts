import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function getPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const isManager = auth.profile.role === "manager";
  const { searchParams } = new URL(request.url);
  const page = getPositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const query = searchParams.get("query")?.trim() ?? "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const selectFields = isManager
    ? "id, name, email, role, is_active, admin_note, created_at"
    : "id, name, email, role, is_active, created_at";

  let totalQuery = supabaseAdmin.from("users").select("*", { count: "exact", head: true });
  let listQuery = supabaseAdmin.from("users").select(selectFields).order("created_at", { ascending: false });

  if (query) {
    const search = `%${query}%`;
    totalQuery = totalQuery.or(`name.ilike.${search},email.ilike.${search},id.ilike.${search}`);
    listQuery = listQuery.or(`name.ilike.${search},email.ilike.${search},id.ilike.${search}`);
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
