import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/server/audit";
import { requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: NextRequest) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [quizAttemptsCountRes, questionAttemptsCountRes, questionProgressCountRes] = await Promise.all([
    supabaseAdmin.from("quiz_attempts").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("question_attempts").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("question_progress").select("user_id", { count: "exact", head: true }),
  ]);

  const countError =
    quizAttemptsCountRes.error || questionAttemptsCountRes.error || questionProgressCountRes.error;

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const [deleteQuizAttemptsRes, deleteQuestionAttemptsRes, deleteQuestionProgressRes] = await Promise.all([
    supabaseAdmin.from("quiz_attempts").delete().gt("id", 0),
    supabaseAdmin.from("question_attempts").delete().gt("id", 0),
    supabaseAdmin.from("question_progress").delete().gt("question_id", 0),
  ]);

  const deleteError =
    deleteQuizAttemptsRes.error || deleteQuestionAttemptsRes.error || deleteQuestionProgressRes.error;

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const quizAttemptsCount = quizAttemptsCountRes.count ?? 0;
  const questionAttemptsCount = questionAttemptsCountRes.count ?? 0;
  const questionProgressCount = questionProgressCountRes.count ?? 0;

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "solve_history_reset",
    target_type: "solve_history",
    summary: `Cozum kayitlari temizlendi. Quiz: ${quizAttemptsCount}, attempts: ${questionAttemptsCount}, progress: ${questionProgressCount}`,
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      quiz_attempts: quizAttemptsCount,
      question_attempts: questionAttemptsCount,
      question_progress: questionProgressCount,
    },
  });
}
