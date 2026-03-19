import { supabaseAdmin } from "./supabaseAdmin";

export type AttemptMode = "classic" | "true_false" | "quiz";
export type AttemptOption = "A" | "B" | "C" | "D" | null;

type RecordQuestionAttemptInput = {
  userId: string;
  questionId: number;
  mode: AttemptMode;
  selectedOption: AttemptOption;
  isCorrect: boolean | null;
  isSkipped: boolean;
  answeredAt?: string;
};

function buildProgressPayload(input: RecordQuestionAttemptInput) {
  const isAnswered = !input.isSkipped && input.selectedOption !== null;

  return {
    attempt_count: 1,
    correct_count: input.isCorrect === true ? 1 : 0,
    wrong_count: input.isCorrect === false && !input.isSkipped ? 1 : 0,
    skip_count: input.isSkipped ? 1 : 0,
    first_selected_option: input.selectedOption,
    first_is_correct: input.isCorrect,
    first_is_skipped: input.isSkipped,
    solved_once: isAnswered,
    solved_correctly_once: input.isCorrect === true,
  };
}

export async function recordQuestionAttemptAndProgress(input: RecordQuestionAttemptInput) {
  const answeredAt = input.answeredAt ?? new Date().toISOString();

  const { error: attemptError } = await supabaseAdmin.from("question_attempts").insert([
    {
      user_id: input.userId,
      question_id: input.questionId,
      mode: input.mode,
      selected_option: input.selectedOption,
      is_correct: input.isCorrect,
      is_skipped: input.isSkipped,
      answered_at: answeredAt,
    },
  ]);

  if (attemptError) {
    throw new Error(attemptError.message);
  }

  const { data: existingProgress, error: progressError } = await supabaseAdmin
    .from("question_progress")
    .select(
      "attempt_count, correct_count, wrong_count, skip_count, first_attempt_at, first_selected_option, first_is_correct, first_is_skipped, solved_once, solved_correctly_once"
    )
    .eq("user_id", input.userId)
    .eq("question_id", input.questionId)
    .maybeSingle();

  if (progressError) {
    throw new Error(progressError.message);
  }

  if (!existingProgress) {
    const base = buildProgressPayload(input);
    const { error } = await supabaseAdmin.from("question_progress").insert([
      {
        user_id: input.userId,
        question_id: input.questionId,
        first_attempt_at: answeredAt,
        last_attempt_at: answeredAt,
        ...base,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabaseAdmin
    .from("question_progress")
    .update({
      last_attempt_at: answeredAt,
      attempt_count: Number(existingProgress.attempt_count ?? 0) + 1,
      correct_count: Number(existingProgress.correct_count ?? 0) + (input.isCorrect === true ? 1 : 0),
      wrong_count:
        Number(existingProgress.wrong_count ?? 0) + (input.isCorrect === false && !input.isSkipped ? 1 : 0),
      skip_count: Number(existingProgress.skip_count ?? 0) + (input.isSkipped ? 1 : 0),
      solved_once: Boolean(existingProgress.solved_once) || (!input.isSkipped && input.selectedOption !== null),
      solved_correctly_once: Boolean(existingProgress.solved_correctly_once) || input.isCorrect === true,
    })
    .eq("user_id", input.userId)
    .eq("question_id", input.questionId);

  if (error) {
    throw new Error(error.message);
  }
}
