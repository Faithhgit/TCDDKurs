import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limiter = checkRateLimit(`bug-report:${auth.user.id}`, 5, 10 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Çok fazla hata bildirimi gönderdiniz. Biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim() ?? "";

  if (message.length < 8) {
    return NextResponse.json({ error: "Lütfen daha açıklayıcı bir hata mesajı yazın." }, { status: 400 });
  }

  if (message.length > 1200) {
    return NextResponse.json({ error: "Hata bildirimi çok uzun." }, { status: 400 });
  }

  const createdByName = auth.profile.name?.trim() || auth.profile.email?.trim() || "Kullanıcı";

  const { data, error } = await supabaseAdmin
    .from("bug_reports")
    .insert([
      {
        message,
        created_by_user_id: auth.user.id,
        created_by_name: createdByName,
        status: "open",
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
