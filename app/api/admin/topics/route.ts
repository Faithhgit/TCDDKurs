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

export async function GET(request: NextRequest) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const topicsRes = await supabaseAdmin.from("topics").select("*").order("title", { ascending: true });
  if (topicsRes.error) {
    return NextResponse.json({ error: topicsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ items: topicsRes.data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rawBody = (await request.json().catch(() => null)) as { title?: unknown; slug?: unknown } | null;
  const title = String(rawBody?.title ?? "").trim();
  const slug = toSlug(String(rawBody?.slug ?? title));

  if (!title) {
    return NextResponse.json({ error: "Lütfen konu başlığı gir." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Geçerli bir slug üretilemedi." }, { status: 400 });
  }

  const existingRes = await supabaseAdmin.from("topics").select("id").eq("slug", slug).maybeSingle();
  if (existingRes.error) {
    return NextResponse.json({ error: existingRes.error.message }, { status: 500 });
  }

  if (existingRes.data) {
    return NextResponse.json({ error: "Bu slug zaten kullanılıyor." }, { status: 409 });
  }

  const insertRes = await supabaseAdmin
    .from("topics")
    .insert([{ title, slug }])
    .select("*")
    .single();

  if (insertRes.error) {
    return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ item: insertRes.data }, { status: 201 });
}
