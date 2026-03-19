import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

type QuestionStatus = "pending" | "approved" | "rejected";
type AttemptMode = "classic" | "true_false" | "quiz";

function buildEmptyModeStats() {
  return {
    classic: { total: 0, correct: 0, wrong: 0, skipped: 0 },
    true_false: { total: 0, correct: 0, wrong: 0, skipped: 0 },
    quiz: { total: 0, correct: 0, wrong: 0, skipped: 0 },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.user.id;

  const [questionsRes, attemptsRes, quizzesRes] = await Promise.all([
    supabaseAdmin
      .from("questions")
      .select("id, status")
      .eq("created_by_user_id", userId),
    supabaseAdmin
      .from("question_attempts")
      .select("id, question_id, mode, selected_option, is_correct, is_skipped, answered_at")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false }),
    supabaseAdmin
      .from("quiz_attempts")
      .select("id, topic_id, total_questions, answered_count, correct_count, wrong_count, skipped_count, duration_seconds, elapsed_seconds, status, ended_reason, started_at, finished_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  if (questionsRes.error || attemptsRes.error || quizzesRes.error) {
    return NextResponse.json({ error: "Profil istatistikleri alinamadi." }, { status: 500 });
  }

  const questions = (questionsRes.data ?? []) as Array<{ id: number; status: QuestionStatus }>;
  const attempts = (attemptsRes.data ?? []) as Array<{
    id: number;
    question_id: number;
    mode: AttemptMode;
    selected_option: "A" | "B" | "C" | "D" | null;
    is_correct: boolean | null;
    is_skipped: boolean;
    answered_at: string;
  }>;
  const quizzes = (quizzesRes.data ?? []) as Array<{
    id: number;
    topic_id: number | null;
    total_questions: number;
    answered_count: number;
    correct_count: number;
    wrong_count: number;
    skipped_count: number;
    duration_seconds: number;
    elapsed_seconds: number | null;
    status: string;
    ended_reason: string | null;
    started_at: string;
    finished_at: string | null;
  }>;

  const contribution = questions.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "pending") acc.pending += 1;
      if (item.status === "approved") acc.approved += 1;
      if (item.status === "rejected") acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const modeStats = buildEmptyModeStats();
  const solving = attempts.reduce(
    (acc, attempt) => {
      acc.total += 1;
      if (attempt.is_skipped) {
        acc.skipped += 1;
      } else if (attempt.is_correct === true) {
        acc.correct += 1;
      } else {
        acc.wrong += 1;
      }

      const modeBucket = modeStats[attempt.mode];
      modeBucket.total += 1;
      if (attempt.is_skipped) {
        modeBucket.skipped += 1;
      } else if (attempt.is_correct === true) {
        modeBucket.correct += 1;
      } else {
        modeBucket.wrong += 1;
      }

      return acc;
    },
    { total: 0, correct: 0, wrong: 0, skipped: 0 }
  );

  const topicIds = Array.from(
    new Set([
      ...quizzes.map((item) => item.topic_id).filter((value): value is number => Boolean(value)),
    ])
  );
  const topicDetailsResFinal = topicIds.length
    ? await supabaseAdmin.from("topics").select("id, title").in("id", topicIds)
    : { data: [], error: null };

  if (topicDetailsResFinal.error) {
    return NextResponse.json({ error: "Profil detaylari alinamadi." }, { status: 500 });
  }

  const topicMap = new Map(
    ((topicDetailsResFinal.data ?? []) as Array<{ id: number; title: string }>).map((item) => [item.id, item.title])
  );

  const quizHistory = quizzes.map((quiz) => ({
    ...quiz,
    topicTitle: quiz.topic_id ? topicMap.get(quiz.topic_id) ?? null : null,
  }));

  return NextResponse.json({
    contribution,
    solving: {
      ...solving,
      accuracy: solving.total > 0 ? Math.round((solving.correct / solving.total) * 100) : 0,
      modeStats,
    },
    quizHistory,
  });
}
