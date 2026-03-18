import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const isManager = auth.profile.role === "manager";

  const [pendingRes, questionCountRes, userCountRes, reportCountRes, announcementCountRes] = await Promise.all([
    supabaseAdmin
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseAdmin.from("questions").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    isManager
      ? supabaseAdmin.from("bug_reports").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: 0, error: null }),
    supabaseAdmin.from("announcements").select("*", { count: "exact", head: true }),
  ]);

  const error =
    pendingRes.error ?? questionCountRes.error ?? userCountRes.error ?? reportCountRes.error ?? announcementCountRes.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    role: auth.profile.role,
    canManageUsers: isManager,
    canManageTopics: isManager,
    canManageReports: isManager,
    counts: {
      pending: pendingRes.count ?? 0,
      questions: questionCountRes.count ?? 0,
      users: userCountRes.count ?? 0,
      reports: reportCountRes.count ?? 0,
      announcements: announcementCountRes.count ?? 0,
    },
  });
}
