import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function DELETE(
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

  const { error } = await supabaseAdmin.from("bug_reports").delete().eq("id", reportId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
