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
  const questionId = Number(id);
  if (!Number.isFinite(questionId)) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
  }

  const body = (await request.json()) as { status?: "approved" | "rejected" };
  if (!body.status || !["approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({ status: body.status })
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
