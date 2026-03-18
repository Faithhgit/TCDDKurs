import { NextRequest, NextResponse } from "next/server";

import { requireManager } from "@/lib/server/auth";
import { writeAuditLog } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  isRecord,
  validateEnum,
  validateOptionalString,
  validatePositiveNumber,
  validateRequiredString,
} from "@/lib/server/validation";

function getQuestionId(id: string) {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const questionId = getQuestionId(id);
  if (!questionId) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
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

  const optionA = validateRequiredString(rawBody.option_a, {
    field: "A şıkkı",
    min: 1,
    max: 500,
  });
  if (!optionA.ok) {
    return NextResponse.json({ error: optionA.error }, { status: 400 });
  }

  const optionB = validateRequiredString(rawBody.option_b, {
    field: "B şıkkı",
    min: 1,
    max: 500,
  });
  if (!optionB.ok) {
    return NextResponse.json({ error: optionB.error }, { status: 400 });
  }

  const optionC = validateRequiredString(rawBody.option_c, {
    field: "C şıkkı",
    min: 1,
    max: 500,
  });
  if (!optionC.ok) {
    return NextResponse.json({ error: optionC.error }, { status: 400 });
  }

  const optionD = validateRequiredString(rawBody.option_d, {
    field: "D şıkkı",
    min: 1,
    max: 500,
  });
  if (!optionD.ok) {
    return NextResponse.json({ error: optionD.error }, { status: 400 });
  }

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

  const body = {
    topic_id: topicId.value,
    question_text: questionText.value,
    option_a: optionA.value,
    option_b: optionB.value,
    option_c: optionC.value,
    option_d: optionD.value,
    correct_option: correctOption.value,
    explanation: explanation.value,
    created_by_name: createdByName.value,
    normalized_question_text: normalizedQuestionText.value,
    status: status.value,
  };

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update(body)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "question_updated",
    target_type: "question",
    target_id: String(questionId),
    summary: `Soru düzenlendi: ${data.question_text}`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const questionId = getQuestionId(id);
  if (!questionId) {
    return NextResponse.json({ error: "Geçersiz soru id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("questions").delete().eq("id", questionId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "question_deleted",
    target_type: "question",
    target_id: String(questionId),
    summary: `Soru silindi. id=${questionId}`,
  });

  return NextResponse.json({ success: true });
}
