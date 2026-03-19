import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from("question_progress")
    .select("question_id")
    .eq("user_id", auth.user.id)
    .eq("solved_once", true);

  if (error) {
    return NextResponse.json({ error: "Çözülen soru bilgisi alınamadı." }, { status: 500 });
  }

  return NextResponse.json({
    questionIds: (data ?? []).map((item) => Number(item.question_id)),
  });
}
