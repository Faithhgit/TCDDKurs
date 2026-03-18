import { NextRequest, NextResponse } from "next/server";

import { classRoster } from "@/lib/courseData";
import { buildQuestionLeaderboard } from "@/lib/leaderboard";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const authResult = await requireUser(request);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const [{ data: users, error: usersError }, { data: questions, error: questionsError }] =
    await Promise.all([
      supabaseAdmin.from("users").select("id, name, role, is_active"),
      supabaseAdmin.from("questions").select("created_by_user_id, status"),
    ]);

  if (usersError || questionsError) {
    return NextResponse.json({ error: "Liderlik bilgisi alınamadı." }, { status: 500 });
  }

  const items = buildQuestionLeaderboard(
    users ?? [],
    (questions ?? []) as Array<{ created_by_user_id: string; status: "pending" | "approved" | "rejected" }>,
    classRoster.map((student) => student.name)
  );

  return NextResponse.json({
    items,
    topThree: items.slice(0, 3),
  });
}
