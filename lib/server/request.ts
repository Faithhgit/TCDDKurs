import { NextRequest } from "next/server";

export function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function buildRateLimitKey(request: NextRequest, scope: string, suffix?: string) {
  const ip = getRequestIp(request);
  return suffix ? `${scope}:${ip}:${suffix}` : `${scope}:${ip}`;
}
