import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Geçersiz hata bildirimi id." }, { status: 400 });
  }

  const body = (await request.json()) as { status?: "open" | "resolved" };
  if (!body.status || !["open", "resolved"].includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bug_reports")
    .update({ status: body.status })
    .eq("id", reportId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
