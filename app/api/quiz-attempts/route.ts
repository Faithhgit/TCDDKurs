import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validatePositiveNumber } from "@/lib/server/validation";

function parseQuestionIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false as const, error: "Quiz sorulari gecersiz." };
  }

  const parsed = value.map((item) => Number(item));
  if (parsed.some((item) => !Number.isFinite(item) || item <= 0)) {
    return { ok: false as const, error: "Quiz sorulari gecersiz." };
  }

  return { ok: true as const, value: parsed };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Gecersiz istek govdesi." }, { status: 400 });
  }

  const questionIds = parseQuestionIds(rawBody.question_ids);
  if (!questionIds.ok) {
    return NextResponse.json({ error: questionIds.error }, { status: 400 });
  }

  const durationSeconds = validatePositiveNumber(rawBody.duration_seconds, "Sure");
  if (!durationSeconds.ok) {
    return NextResponse.json({ error: durationSeconds.error }, { status: 400 });
  }

  const topicId =
    rawBody.topic_id === null || rawBody.topic_id === undefined
      ? null
      : Number.isFinite(Number(rawBody.topic_id)) && Number(rawBody.topic_id) > 0
        ? Number(rawBody.topic_id)
        : null;

  const { data: quizAttempt, error: quizError } = await supabaseAdmin
    .from("quiz_attempts")
    .insert([
      {
        user_id: auth.user.id,
        topic_id: topicId,
        total_questions: questionIds.value.length,
        duration_seconds: durationSeconds.value,
        status: "in_progress",
      },
    ])
    .select("id, started_at")
    .single();

  if (quizError || !quizAttempt) {
    return NextResponse.json({ error: quizError?.message || "Quiz baslatilamadi." }, { status: 500 });
  }

  const items = questionIds.value.map((questionId, index) => ({
    quiz_attempt_id: quizAttempt.id,
    question_id: questionId,
    question_order: index + 1,
  }));

  const { error: itemError } = await supabaseAdmin.from("quiz_attempt_items").insert(items);
  if (itemError) {
    await supabaseAdmin.from("quiz_attempts").delete().eq("id", quizAttempt.id);
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: quizAttempt.id, started_at: quizAttempt.started_at } });
}
