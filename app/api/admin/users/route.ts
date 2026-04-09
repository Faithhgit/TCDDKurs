import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SELECT_FIELDS_WITH_GUIDE =
  "id, name, email, role, is_active, admin_note, can_access_makinist_guide, makinist_guide_message, created_at";
const SELECT_FIELDS_WITHOUT_GUIDE = "id, name, email, role, is_active, admin_note, created_at";

function hasMakinistGuideColumnError(message?: string) {
  return (
    message?.includes("can_access_makinist_guide") === true ||
    message?.includes("makinist_guide_message") === true
  );
}

function normalizeUser<T extends Record<string, unknown>>(item: T) {
  return {
    ...item,
    can_access_makinist_guide:
      typeof item.can_access_makinist_guide === "boolean" ? item.can_access_makinist_guide : false,
    makinist_guide_message:
      typeof item.makinist_guide_message === "string" || item.makinist_guide_message === null
        ? item.makinist_guide_message
        : null,
  };
}

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

  const primarySelectFields = isManager
    ? SELECT_FIELDS_WITH_GUIDE
    : SELECT_FIELDS_WITH_GUIDE.replace(", admin_note", "");
  const fallbackSelectFields = isManager
    ? SELECT_FIELDS_WITHOUT_GUIDE
    : SELECT_FIELDS_WITHOUT_GUIDE.replace(", admin_note", "");

  let totalQuery = supabaseAdmin.from("users").select("*", { count: "exact", head: true });
  let listQuery = supabaseAdmin
    .from("users")
    .select(primarySelectFields)
    .order("created_at", { ascending: false });

  if (query) {
    const search = `%${query}%`;
    totalQuery = totalQuery.or(`name.ilike.${search},email.ilike.${search},id.ilike.${search}`);
    listQuery = listQuery.or(`name.ilike.${search},email.ilike.${search},id.ilike.${search}`);
  }

  const [totalRes, itemsRes] = await Promise.all([totalQuery, listQuery.range(from, to)]);

  if (itemsRes.error && hasMakinistGuideColumnError(itemsRes.error.message)) {
    let fallbackQuery = supabaseAdmin
      .from("users")
      .select(fallbackSelectFields)
      .order("created_at", { ascending: false });

    if (query) {
      const search = `%${query}%`;
      fallbackQuery = fallbackQuery.or(`name.ilike.${search},email.ilike.${search},id.ilike.${search}`);
    }

    const fallbackItemsRes = await fallbackQuery.range(from, to);

    if (totalRes.error || fallbackItemsRes.error) {
      return NextResponse.json(
        { error: totalRes.error?.message || fallbackItemsRes.error?.message },
        { status: 500 }
      );
    }

    const total = totalRes.count ?? 0;

    return NextResponse.json({
      items: (fallbackItemsRes.data ?? []).map((item) =>
        normalizeUser(item as unknown as Record<string, unknown>)
      ),
      total,
      page,
      limit,
      hasMore: from + limit < total,
    });
  }

  if (totalRes.error || itemsRes.error) {
    return NextResponse.json({ error: totalRes.error?.message || itemsRes.error?.message }, { status: 500 });
  }

  const total = totalRes.count ?? 0;

  return NextResponse.json({
    items: (itemsRes.data ?? []).map((item) => normalizeUser(item as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
    hasMore: from + limit < total,
  });
}
