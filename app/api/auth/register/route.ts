import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/server/rateLimit";
import { buildRateLimitKey } from "@/lib/server/request";
import { supabaseAuthClient } from "@/lib/server/supabaseAuthClient";
import { isValidEmail, isRecord, validateRequiredString } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const rawBody = (await request.json()) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const name = validateRequiredString(rawBody.name, {
    field: "Ad soyad",
    min: 2,
    max: 120,
  });
  if (!name.ok) {
    return NextResponse.json({ error: name.error }, { status: 400 });
  }

  const email = validateRequiredString(rawBody.email, {
    field: "E-posta",
    min: 5,
    max: 255,
  });
  if (!email.ok) {
    return NextResponse.json({ error: email.error }, { status: 400 });
  }

  if (!isValidEmail(email.value)) {
    return NextResponse.json({ error: "E-posta formatı geçersiz." }, { status: 400 });
  }

  const password = validateRequiredString(rawBody.password, {
    field: "Şifre",
    min: 6,
    max: 200,
  });
  if (!password.ok) {
    return NextResponse.json({ error: password.error }, { status: 400 });
  }

  const limiter = checkRateLimit(
    buildRateLimitKey(request, "auth-register", email.value.toLocaleLowerCase("tr-TR")),
    3,
    30 * 60 * 1000
  );
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Çok sık kayıt denemesi yapıldı. Biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const { data, error } = await supabaseAuthClient.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { name: name.value } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    user: data.user,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : null,
  });
}
