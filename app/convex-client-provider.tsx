"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo, type ReactNode } from "react";

export function ConvexClientProvider({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

