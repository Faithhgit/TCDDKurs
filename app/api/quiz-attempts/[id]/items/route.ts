import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { type AttemptMode, recordQuestionAttemptAndProgress } from "@/lib/server/solveStats";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validateBoolean, validateEnum, validatePositiveNumber } from "@/lib/server/validation";

const answerOptions = ["A", "B", "C", "D"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const quizAttemptId = Number(id);
  if (!Number.isFinite(quizAttemptId) || quizAttemptId <= 0) {
    return NextResponse.json({ error: "Gecersiz quiz id." }, { status: 400 });
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Gecersiz istek govdesi." }, { status: 400 });
  }

  const questionId = validatePositiveNumber(rawBody.question_id, "Soru");
  if (!questionId.ok) {
    return NextResponse.json({ error: questionId.error }, { status: 400 });
  }

  const selectedOption = validateEnum(rawBody.selected_option, answerOptions, "Secilen cevap");
  if (!selectedOption.ok) {
    return NextResponse.json({ error: selectedOption.error }, { status: 400 });
  }

  const isCorrect = validateBoolean(rawBody.is_correct, "Sonuc");
  if (!isCorrect.ok) {
    return NextResponse.json({ error: isCorrect.error }, { status: 400 });
  }

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, user_id")
    .eq("id", quizAttemptId)
    .single();

  if (attemptError || !attempt || attempt.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Quiz kaydi bulunamadi." }, { status: 404 });
  }

  const answeredAt = new Date().toISOString();

  const { error: itemError } = await supabaseAdmin
    .from("quiz_attempt_items")
    .update({
      selected_option: selectedOption.value,
      is_correct: isCorrect.value,
      is_skipped: false,
      answered_at: answeredAt,
    })
    .eq("quiz_attempt_id", quizAttemptId)
    .eq("question_id", questionId.value);

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  try {
    await recordQuestionAttemptAndProgress({
      userId: auth.user.id,
      questionId: questionId.value,
      mode: "quiz" as AttemptMode,
      selectedOption: selectedOption.value,
      isCorrect: isCorrect.value,
      isSkipped: false,
      answeredAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Soru kaydi yapilamadi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
