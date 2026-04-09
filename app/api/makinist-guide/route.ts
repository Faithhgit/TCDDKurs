import { NextRequest, NextResponse } from "next/server";

import { getMakinistGuideEntries } from "@/lib/makinistGuideData";
import { requireUser } from "@/lib/server/auth";

const defaultLockedMessage =
  "Bu modül şu an hesabınıza açık değil. Erişim tanımlanması için yöneticinizle iletişime geçin.";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!auth.profile.can_access_makinist_guide) {
    return NextResponse.json(
      {
        access: false,
        message: auth.profile.makinist_guide_message?.trim() || defaultLockedMessage,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    access: true,
    entries: getMakinistGuideEntries(),
  });
}
