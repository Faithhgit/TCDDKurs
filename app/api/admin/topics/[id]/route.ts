import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

function toSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-ğüşiöç]/gi, "")
    .replace(/-+/g, "-");
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Geçersiz konu id." }, { status: 400 });
  }

  const rawBody = (await request.json().catch(() => null)) as {
    title?: unknown;
    slug?: unknown;
    is_active?: unknown;
  } | null;

  const updates: Record<string, unknown> = {};

  if (rawBody?.title !== undefined) {
    const title = String(rawBody.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Konu başlığı zorunlu." }, { status: 400 });
    }
    updates.title = title;
  }

  if (rawBody?.slug !== undefined) {
    const slug = toSlug(String(rawBody.slug ?? ""));
    if (!slug) {
      return NextResponse.json({ error: "Geçerli bir slug üretilemedi." }, { status: 400 });
    }
    updates.slug = slug;
  }

  if (rawBody?.is_active !== undefined) {
    updates.is_active = Boolean(rawBody.is_active);
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Güncellenecek alan bulunamadı." }, { status: 400 });
  }

  if (typeof updates.slug === "string") {
    const existingRes = await supabaseAdmin
      .from("topics")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", id)
      .maybeSingle();

    if (existingRes.error) {
      return NextResponse.json({ error: existingRes.error.message }, { status: 500 });
    }

    if (existingRes.data) {
      return NextResponse.json({ error: "Bu slug başka bir konuda kullanılıyor." }, { status: 409 });
    }
  }

  const updateRes = await supabaseAdmin.from("topics").update(updates).eq("id", id).select("*").single();
  if (updateRes.error) {
    return NextResponse.json({ error: updateRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ item: updateRes.data });
}
