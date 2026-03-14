import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [topicsRes, pendingRes, questionsRes, usersRes, bugReportsRes] = await Promise.all([
    supabaseAdmin.from("topics").select("*").order("title", { ascending: true }),
    supabaseAdmin.from("questions").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    supabaseAdmin.from("questions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("users")
      .select("id, name, email, role, is_active, admin_note, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("bug_reports").select("*").order("created_at", { ascending: false }),
  ]);

  const error =
    topicsRes.error ?? pendingRes.error ?? questionsRes.error ?? usersRes.error ?? bugReportsRes.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    topics: topicsRes.data ?? [],
    pending: pendingRes.data ?? [],
    allQuestions: questionsRes.data ?? [],
    users: usersRes.data ?? [],
    bugReports: bugReportsRes.data ?? [],
  });
}
