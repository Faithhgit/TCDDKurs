import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: NextRequest) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("audit_logs")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const deletedCount = count ?? 0;

  const { error: deleteError } = await supabaseAdmin.from("audit_logs").delete().gt("id", 0);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      audit_logs: deletedCount,
    },
  });
}
