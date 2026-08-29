"use client";

import posthog from "posthog-js";
import { useAuth, useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "../convex/_generated/api";

export function PostHogProvider({ children, apiKey, host }: { children: React.ReactNode; apiKey?: string; host?: string }) {
  const { isSignedIn } = useAuth();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const preferences = useQuery(
    api.preferences.getMine,
    isSignedIn && isConvexAuthenticated ? {} : "skip",
  );
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!apiKey || !preferences?.analyticsConsent) {
      if (initialized.current) posthog.opt_out_capturing();
      return;
    }
    if (!initialized.current) {
      posthog.init(apiKey, {
        api_host: host || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: !preferences.replayConsent,
        mask_all_text: true,
        mask_all_element_attributes: true,
      });
      initialized.current = true;
    }
    posthog.opt_in_capturing();
    if (user?.id) posthog.identify(user.id);
    if (preferences.replayConsent) posthog.startSessionRecording();
    else posthog.stopSessionRecording();
  }, [apiKey, host, preferences?.analyticsConsent, preferences?.replayConsent, user?.id]);

  useEffect(() => {
    if (initialized.current && preferences?.analyticsConsent) posthog.capture("page_viewed", { path: pathname });
  }, [pathname, preferences?.analyticsConsent]);

  useEffect(() => {
    if (!isSignedIn && initialized.current) posthog.reset();
  }, [isSignedIn]);

  return children;
}
