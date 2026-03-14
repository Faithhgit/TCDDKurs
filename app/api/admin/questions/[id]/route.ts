import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

function getQuestionId(id: string) {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const questionId = getQuestionId(id);
  if (!questionId) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
  }

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("questions")
    .update(body)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const questionId = getQuestionId(id);
  if (!questionId) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("questions").delete().eq("id", questionId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
