"use client";

import { authorizedFetch } from "./clientApi";

type AnswerOption = "A" | "B" | "C" | "D";
type AttemptMode = "classic" | "true_false";
type QuizEndedReason = "user_finished" | "time_up" | "cancelled";

export async function recordQuestionAttempt(input: {
  questionId: number;
  mode: AttemptMode;
  selectedOption: AnswerOption;
  isCorrect: boolean;
}) {
  const response = await authorizedFetch("/api/question-attempts", {
    method: "POST",
    body: JSON.stringify({
      question_id: input.questionId,
      mode: input.mode,
      selected_option: input.selectedOption,
      is_correct: input.isCorrect,
    }),
  });

  if (!response.ok) {
    throw new Error("Question attempt could not be recorded.");
  }
}

export async function startQuizAttempt(input: {
  topicId: number | null;
  questionIds: number[];
  durationSeconds: number;
}) {
  const response = await authorizedFetch("/api/quiz-attempts", {
    method: "POST",
    body: JSON.stringify({
      topic_id: input.topicId,
      question_ids: input.questionIds,
      duration_seconds: input.durationSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error("Quiz attempt could not be created.");
  }

  const payload = (await response.json().catch(() => null)) as { data?: { id?: number } } | null;
  if (!payload?.data?.id) {
    throw new Error("Quiz attempt id is missing.");
  }

  return payload.data.id;
}

export async function recordQuizAnswer(input: {
  quizAttemptId: number;
  questionId: number;
  selectedOption: AnswerOption;
  isCorrect: boolean;
}) {
  const response = await authorizedFetch(`/api/quiz-attempts/${input.quizAttemptId}/items`, {
    method: "PATCH",
    body: JSON.stringify({
      question_id: input.questionId,
      selected_option: input.selectedOption,
      is_correct: input.isCorrect,
    }),
  });

  if (!response.ok) {
    throw new Error("Quiz answer could not be recorded.");
  }
}

export async function finishQuizAttempt(input: {
  quizAttemptId: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  elapsedSeconds: number;
  endedReason: QuizEndedReason;
}) {
  const response = await authorizedFetch(`/api/quiz-attempts/${input.quizAttemptId}/finish`, {
    method: "PATCH",
    body: JSON.stringify({
      answered_count: input.answeredCount,
      correct_count: input.correctCount,
      wrong_count: input.wrongCount,
      skipped_count: input.skippedCount,
      elapsed_seconds: input.elapsedSeconds,
      ended_reason: input.endedReason,
    }),
  });

  if (!response.ok) {
    throw new Error("Quiz attempt could not be finished.");
  }
}
