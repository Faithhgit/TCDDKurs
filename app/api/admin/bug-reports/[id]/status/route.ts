import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { writeAuditLog } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validateEnum } from "@/lib/server/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Geçersiz hata bildirimi id." }, { status: 400 });
  }

  const rawBody = (await request.json()) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const status = validateEnum(rawBody.status, ["open", "resolved"] as const, "Durum");
  if (!status.ok) {
    return NextResponse.json({ error: status.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bug_reports")
    .update({ status: status.value })
    .eq("id", reportId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: status.value === "resolved" ? "bug_report_resolved" : "bug_report_reopened",
    target_type: "bug_report",
    target_id: String(reportId),
    summary: `Hata bildirimi ${status.value === "resolved" ? "çözüldü" : "tekrar açıldı"}.`,
  });

  return NextResponse.json({ data });
}
