import { NextRequest, NextResponse } from "next/server";

import { type AnnouncementRow } from "@/lib/announcements";
import { writeAuditLog } from "@/lib/server/audit";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

function getPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []) as AnnouncementRow[] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: string; description?: string }
    | null;

  const title = body?.title?.trim() ?? "";
  const description = body?.description?.trim() ?? "";

  if (title.length < 3) {
    return NextResponse.json({ error: "Duyuru başlığı çok kısa." }, { status: 400 });
  }

  if (description.length < 5) {
    return NextResponse.json({ error: "Duyuru açıklaması çok kısa." }, { status: 400 });
  }

  if (title.length > 120) {
    return NextResponse.json({ error: "Duyuru başlığı çok uzun." }, { status: 400 });
  }

  if (description.length > 1000) {
    return NextResponse.json({ error: "Duyuru açıklaması çok uzun." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .insert([{ title, description }])
    .select("id, title, description, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "announcement_created",
    target_type: "announcement",
    target_id: String(data.id),
    summary: `Duyuru eklendi: ${title}`,
  });

  return NextResponse.json({ data });
}
