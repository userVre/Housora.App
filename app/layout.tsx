import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthGate } from "../components/auth-gate";
import { ConfigurationRequired } from "../components/configuration-required";
import { ConvexClientProvider } from "./convex-client-provider";
import { PostHogProvider } from "../components/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housora — From space to approved design",
  description:
    "AI interior design workspace for concepts, client approvals, products, specifications and budgets.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#11120F",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const rawConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  // Convex URL must not have trailing slash - ConvexReactClient is strict on some deployments
  const convexUrl = rawConvexUrl?.replace(/\/+$/, "");
  const missing = [
    !clerkKey ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" : null,
    !convexUrl ? "NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL)" : null,
  ].filter((value): value is string => Boolean(value));
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {clerkKey && convexUrl ? (
          <ClerkProvider publishableKey={clerkKey}>
            <ConvexClientProvider url={convexUrl}>
              <PostHogProvider apiKey={process.env.NEXT_POSTHOG_KEY} host={process.env.NEXT_POSTHOG_HOST}>
                <AuthGate>{children}</AuthGate>
              </PostHogProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <ConfigurationRequired missing={missing} />
        )}
      </body>
    </html>
  );
}
