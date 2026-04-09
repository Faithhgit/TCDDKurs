import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/server/audit";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validateAnnouncement(title: string, description: string) {
  if (title.length < 3) return "Duyuru başlığı çok kısa.";
  if (description.length < 5) return "Duyuru açıklaması çok kısa.";
  if (title.length > 120) return "Duyuru başlığı çok uzun.";
  if (description.length > 1000) return "Duyuru açıklaması çok uzun.";
  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { title?: string; description?: string }
    | null;

  const title = body?.title?.trim() ?? "";
  const description = body?.description?.trim() ?? "";
  const validationError = validateAnnouncement(title, description);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .update({ title, description })
    .eq("id", Number(id))
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
    action: "announcement_updated",
    target_type: "announcement",
    target_id: String(data.id),
    summary: `Duyuru güncellendi: ${title}`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  const { data: existing } = await supabaseAdmin
    .from("announcements")
    .select("id, title")
    .eq("id", Number(id))
    .single();

  const { error } = await supabaseAdmin.from("announcements").delete().eq("id", Number(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "announcement_deleted",
    target_type: "announcement",
    target_id: id,
    summary: `Duyuru silindi: ${existing?.title ?? id}`,
  });

  return NextResponse.json({ success: true });
}
