import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { buildRateLimitKey } from "@/lib/server/request";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { QUESTION_IMAGE_BUCKET, createQuestionImagePath } from "@/lib/questionImages";
import { validateRequiredString } from "@/lib/server/validation";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

async function ensureBucket() {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

  if (error) {
    return { error };
  }

  const exists = buckets?.some((bucket) => bucket.name === QUESTION_IMAGE_BUCKET);
  if (exists) {
    return { error: null };
  }

  const result = await supabaseAdmin.storage.createBucket(QUESTION_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE}`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  return { error: result.error };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limiter = checkRateLimit(buildRateLimitKey(request, "question-image", auth.user.id), 10, 10 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Çok sık görsel yükleniyor. Biraz sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const normalizedQuestionText = validateRequiredString(formData.get("normalizedQuestionText"), {
    field: "Soru anahtarı",
    min: 10,
    max: 5000,
  });
  const file = formData.get("file");

  if (!normalizedQuestionText.ok) {
    return NextResponse.json({ error: normalizedQuestionText.error }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Görsel dosyası gelmedi." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "Sadece görsel yükleyebilirsin." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Görsel 2 MB sınırını geçiyor." }, { status: 400 });
  }

  const bucketResult = await ensureBucket();
  if (bucketResult.error) {
    return NextResponse.json({ error: "Görsel alanı hazırlanamadı." }, { status: 500 });
  }

  const path = createQuestionImagePath(normalizedQuestionText.value);
  const bytes = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) {
    return NextResponse.json({ error: "Görsel yüklenemedi." }, { status: 500 });
  }

  const publicUrl = supabaseAdmin.storage.from(QUESTION_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;

  return NextResponse.json({ path, publicUrl });
}
