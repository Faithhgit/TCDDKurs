import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isRecord, validateRequiredString } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limiter = checkRateLimit(`bug-report:${auth.user.id}`, 3, 15 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Çok fazla hata bildirimi gönderdiniz. Biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const rawBody = (await request.json()) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const message = validateRequiredString(rawBody.message, {
    field: "Hata bildirimi",
    min: 8,
    max: 1200,
  });
  if (!message.ok) {
    return NextResponse.json({ error: message.error }, { status: 400 });
  }

  const createdByName = auth.profile.name?.trim() || auth.profile.email?.trim() || "Kullanıcı";

  const { data, error } = await supabaseAdmin
    .from("bug_reports")
    .insert([
      {
        message: message.value,
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
