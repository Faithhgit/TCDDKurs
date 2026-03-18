import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { writeAuditLog } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validateEnum } from "@/lib/server/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const questionId = Number(id);
  if (!Number.isFinite(questionId)) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
  }

  const rawBody = (await request.json()) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const status = validateEnum(rawBody.status, ["approved", "rejected"] as const, "Durum");
  if (!status.ok) {
    return NextResponse.json({ error: status.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({ status: status.value })
    .eq("id", questionId)
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
    action: status.value === "approved" ? "question_approved" : "question_rejected",
    target_type: "question",
    target_id: String(questionId),
    summary: `Soru ${status.value === "approved" ? "onaylandı" : "reddedildi"}: ${data.question_text}`,
  });

  return NextResponse.json({ data });
}
