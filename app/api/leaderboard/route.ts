import { NextRequest, NextResponse } from "next/server";

import { classRoster } from "@/lib/courseData";
import {
  buildCorrectLeaderboard,
  buildQuestionLeaderboard,
  buildQuizLeaderboard,
  buildSolvedLeaderboard,
} from "@/lib/leaderboard";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const authResult = await requireUser(request);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const [
    { data: users, error: usersError },
    { data: questions, error: questionsError },
    { data: progressRows, error: progressError },
    { data: quizAttempts, error: quizError },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id, name, role, is_active"),
    supabaseAdmin.from("questions").select("created_by_user_id, status"),
    supabaseAdmin.from("question_progress").select("user_id, solved_once, solved_correctly_once"),
    supabaseAdmin.from("quiz_attempts").select("user_id, correct_count, answered_count, status"),
  ]);

  if (usersError || questionsError || progressError || quizError) {
    return NextResponse.json({ error: "Liderlik bilgisi alınamadı." }, { status: 500 });
  }

  const allowedNames = classRoster.map((student) => student.name);
  const approved = buildQuestionLeaderboard(
    users ?? [],
    (questions ?? []) as Array<{ created_by_user_id: string; status: "pending" | "approved" | "rejected" }>,
    allowedNames
  );

  const solved = buildSolvedLeaderboard(
    users ?? [],
    (progressRows ?? []) as Array<{
      user_id: string;
      solved_once: boolean;
      solved_correctly_once: boolean;
    }>,
    allowedNames
  );

  const correct = buildCorrectLeaderboard(
    users ?? [],
    (progressRows ?? []) as Array<{
      user_id: string;
      solved_once: boolean;
      solved_correctly_once: boolean;
    }>,
    allowedNames
  );

  const quiz = buildQuizLeaderboard(
    users ?? [],
    (quizAttempts ?? []) as Array<{
      user_id: string;
      correct_count: number;
      answered_count: number;
      status: string;
    }>,
    allowedNames
  );

  return NextResponse.json({
    items: approved,
    topThree: approved.slice(0, 3),
    categories: {
      approved,
      solved,
      correct,
      quiz,
    },
  });
}
