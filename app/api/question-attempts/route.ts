import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { type AttemptMode, recordQuestionAttemptAndProgress } from "@/lib/server/solveStats";
import { isRecord, validateBoolean, validateEnum, validatePositiveNumber } from "@/lib/server/validation";

const attemptModes = ["classic", "true_false"] as const;
const answerOptions = ["A", "B", "C", "D"] as const;

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Gecersiz istek govdesi." }, { status: 400 });
  }

  const questionId = validatePositiveNumber(rawBody.question_id, "Soru");
  if (!questionId.ok) {
    return NextResponse.json({ error: questionId.error }, { status: 400 });
  }

  const mode = validateEnum(rawBody.mode, attemptModes, "Mod");
  if (!mode.ok) {
    return NextResponse.json({ error: mode.error }, { status: 400 });
  }

  const isCorrect = validateBoolean(rawBody.is_correct, "Sonuc");
  if (!isCorrect.ok) {
    return NextResponse.json({ error: isCorrect.error }, { status: 400 });
  }

  const selectedOption =
    rawBody.selected_option === null
      ? { ok: true as const, value: null }
      : validateEnum(rawBody.selected_option, answerOptions, "Secilen cevap");

  if (!selectedOption.ok) {
    return NextResponse.json({ error: selectedOption.error }, { status: 400 });
  }

  try {
    await recordQuestionAttemptAndProgress({
      userId: auth.user.id,
      questionId: questionId.value,
      mode: mode.value as AttemptMode,
      selectedOption: selectedOption.value,
      isCorrect: isCorrect.value,
      isSkipped: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Soru kaydi yapilamadi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
