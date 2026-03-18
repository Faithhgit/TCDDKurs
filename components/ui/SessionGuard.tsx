"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  APP_VERSION,
  LAST_ACTIVITY_KEY,
  SESSION_IDLE_LIMIT_MS,
  SESSION_VERSION_KEY,
} from "@/lib/appConfig";
import { clearClientSessionMetadata, markSessionActiveForCurrentVersion } from "@/lib/clientSession";
import { supabase } from "@/lib/supabaseClient";

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/auth");
}

export default function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const signingOutRef = useRef(false);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    async function forceLogout() {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      clearClientSessionMetadata();
      await supabase.auth.signOut();
      router.replace("/auth/login");
    }

    async function checkVersion() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const storedVersion = localStorage.getItem(SESSION_VERSION_KEY);
      if (storedVersion !== APP_VERSION) {
        await forceLogout();
        return;
      }

      markSessionActiveForCurrentVersion();
    }

    function touchActivity() {
      const now = Date.now();
      if (now - lastWriteRef.current < 15000) {
        return;
      }
      lastWriteRef.current = now;
      markSessionActiveForCurrentVersion();
    }

    async function checkIdle() {
      if (isPublicPath(pathname)) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = raw ? Number(raw) : 0;

      if (!lastActivity) {
        markSessionActiveForCurrentVersion();
        return;
      }

      if (Date.now() - lastActivity >= SESSION_IDLE_LIMIT_MS) {
        await forceLogout();
      }
    }

    void checkVersion();

    const interval = window.setInterval(() => {
      void checkIdle();
    }, 60000);

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
      "focus",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, touchActivity, { passive: true });
    });

    const visibilityHandler = () => {
      if (!document.hidden) {
        touchActivity();
        void checkIdle();
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, touchActivity);
      });
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [pathname, router]);

  return null;
}
