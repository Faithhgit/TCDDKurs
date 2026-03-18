import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { buildRateLimitKey } from "@/lib/server/request";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  isRecord,
  validateEnum,
  validateOptionalString,
  validatePositiveNumber,
  validateRequiredString,
} from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limiter = checkRateLimit(buildRateLimitKey(request, "question-create", auth.user.id), 10, 10 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Çok hızlı soru ekleniyor. Biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const rawBody = (await request.json()) as unknown;
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const topicId = validatePositiveNumber(rawBody.topic_id, "Konu");
  if (!topicId.ok) {
    return NextResponse.json({ error: topicId.error }, { status: 400 });
  }

  const questionText = validateRequiredString(rawBody.question_text, {
    field: "Soru metni",
    min: 10,
    max: 5000,
  });
  if (!questionText.ok) {
    return NextResponse.json({ error: questionText.error }, { status: 400 });
  }

  const optionA = validateRequiredString(rawBody.option_a, { field: "A şıkkı", min: 1, max: 500 });
  if (!optionA.ok) return NextResponse.json({ error: optionA.error }, { status: 400 });
  const optionB = validateRequiredString(rawBody.option_b, { field: "B şıkkı", min: 1, max: 500 });
  if (!optionB.ok) return NextResponse.json({ error: optionB.error }, { status: 400 });
  const optionC = validateRequiredString(rawBody.option_c, { field: "C şıkkı", min: 1, max: 500 });
  if (!optionC.ok) return NextResponse.json({ error: optionC.error }, { status: 400 });
  const optionD = validateRequiredString(rawBody.option_d, { field: "D şıkkı", min: 1, max: 500 });
  if (!optionD.ok) return NextResponse.json({ error: optionD.error }, { status: 400 });

  const correctOption = validateEnum(
    rawBody.correct_option,
    ["A", "B", "C", "D"] as const,
    "Doğru şık"
  );
  if (!correctOption.ok) {
    return NextResponse.json({ error: correctOption.error }, { status: 400 });
  }

  const explanation = validateOptionalString(rawBody.explanation, {
    field: "Açıklama",
    max: 2500,
  });
  if (!explanation.ok) {
    return NextResponse.json({ error: explanation.error }, { status: 400 });
  }

  const createdByName = validateRequiredString(rawBody.created_by_name, {
    field: "Hazırlayan",
    min: 2,
    max: 120,
  });
  if (!createdByName.ok) {
    return NextResponse.json({ error: createdByName.error }, { status: 400 });
  }

  const normalizedQuestionText = validateRequiredString(rawBody.normalized_question_text, {
    field: "Soru anahtarı",
    min: 10,
    max: 5000,
  });
  if (!normalizedQuestionText.ok) {
    return NextResponse.json({ error: normalizedQuestionText.error }, { status: 400 });
  }

  const status = validateEnum(
    rawBody.status,
    ["pending", "approved", "rejected"] as const,
    "Durum"
  );
  if (!status.ok) {
    return NextResponse.json({ error: status.error }, { status: 400 });
  }

  if (auth.user.id !== rawBody.created_by_user_id) {
    return NextResponse.json({ error: "Kullanıcı doğrulaması eşleşmedi." }, { status: 403 });
  }

  const { data: duplicate, error: duplicateError } = await supabaseAdmin
    .from("questions")
    .select("id")
    .eq("normalized_question_text", normalizedQuestionText.value)
    .limit(1);

  if (duplicateError) {
    return NextResponse.json({ error: duplicateError.message }, { status: 400 });
  }

  if (duplicate && duplicate.length > 0) {
    return NextResponse.json({ error: "Bu soru sistemde zaten var gibi görünüyor." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert([
      {
        topic_id: topicId.value,
        question_text: questionText.value,
        option_a: optionA.value,
        option_b: optionB.value,
        option_c: optionC.value,
        option_d: optionD.value,
        correct_option: correctOption.value,
        explanation: explanation.value,
        created_by_user_id: auth.user.id,
        created_by_name: createdByName.value,
        normalized_question_text: normalizedQuestionText.value,
        status: status.value,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
