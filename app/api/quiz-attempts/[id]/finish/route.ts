import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { type AttemptMode, recordQuestionAttemptAndProgress } from "@/lib/server/solveStats";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validateEnum } from "@/lib/server/validation";

const endedReasons = ["user_finished", "time_up", "cancelled"] as const;

function parseNonNegativeNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, error: `${field} gecersiz.` };
  }

  return { ok: true as const, value };
}

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

  const answeredCount = parseNonNegativeNumber(rawBody.answered_count, "Cevaplanan");
  const correctCount = parseNonNegativeNumber(rawBody.correct_count, "Dogru");
  const wrongCount = parseNonNegativeNumber(rawBody.wrong_count, "Yanlis");
  const skippedCount = parseNonNegativeNumber(rawBody.skipped_count, "Bos");
  const elapsedSeconds = parseNonNegativeNumber(rawBody.elapsed_seconds, "Gecen sure");
  const endedReason = validateEnum(rawBody.ended_reason, endedReasons, "Bitis nedeni");

  if (!answeredCount.ok || !correctCount.ok || !wrongCount.ok || !skippedCount.ok || !elapsedSeconds.ok || !endedReason.ok) {
    return NextResponse.json(
      {
        error:
          answeredCount.error ||
          correctCount.error ||
          wrongCount.error ||
          skippedCount.error ||
          elapsedSeconds.error ||
          endedReason.error,
      },
      { status: 400 }
    );
  }

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, user_id, status")
    .eq("id", quizAttemptId)
    .single();

  if (attemptError || !attempt || attempt.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Quiz kaydi bulunamadi." }, { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ ok: true });
  }

  const finishedAt = new Date().toISOString();
  const finalStatus = endedReason.value === "time_up" ? "expired" : endedReason.value === "cancelled" ? "cancelled" : "completed";

  const { data: unansweredItems, error: unansweredError } = await supabaseAdmin
    .from("quiz_attempt_items")
    .select("question_id")
    .eq("quiz_attempt_id", quizAttemptId)
    .is("selected_option", null);

  if (unansweredError) {
    return NextResponse.json({ error: unansweredError.message }, { status: 500 });
  }

  if ((unansweredItems ?? []).length > 0) {
    const { error: skipUpdateError } = await supabaseAdmin
      .from("quiz_attempt_items")
      .update({
        is_skipped: true,
        answered_at: finishedAt,
      })
      .eq("quiz_attempt_id", quizAttemptId)
      .is("selected_option", null);

    if (skipUpdateError) {
      return NextResponse.json({ error: skipUpdateError.message }, { status: 500 });
    }

    for (const item of unansweredItems ?? []) {
      await recordQuestionAttemptAndProgress({
        userId: auth.user.id,
        questionId: Number(item.question_id),
        mode: "quiz" as AttemptMode,
        selectedOption: null,
        isCorrect: null,
        isSkipped: true,
        answeredAt: finishedAt,
      });
    }
  }

  const { error: finishError } = await supabaseAdmin
    .from("quiz_attempts")
    .update({
      answered_count: answeredCount.value,
      correct_count: correctCount.value,
      wrong_count: wrongCount.value,
      skipped_count: skippedCount.value,
      elapsed_seconds: elapsedSeconds.value,
      ended_reason: endedReason.value,
      status: finalStatus,
      finished_at: finishedAt,
    })
    .eq("id", quizAttemptId);

  if (finishError) {
    return NextResponse.json({ error: finishError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
