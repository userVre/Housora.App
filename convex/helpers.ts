import { v } from "convex/values";

export async function requireOwner(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

export async function requireProjectAccess(
  ctx: any,
  projectId: string,
  allowed?: Array<"owner" | "designer" | "collaborator" | "client_viewer">,
): Promise<{ ownerId: string; role: string | null }> {
  const ownerId = await requireOwner(ctx);
  const project = await ctx.db.get(projectId as any);
  if (!project) throw new Error("Project not found.");
  // Legacy projects table uses userId, housoraProjects uses ownerId
  const projectOwner = (project as any).ownerId ?? (project as any).userId;
  if (projectOwner === ownerId) return { ownerId, role: "owner" };
  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q: any) => q.eq("projectId", projectId).eq("userId", ownerId))
    .unique();
  const role = membership?.role ?? null;
  if (!role) throw new Error("You do not have access to this project.");
  if (allowed && !allowed.includes(role as any)) throw new Error("Insufficient permissions.");
  return { ownerId, role };
}

export function cryptoToken(): string {
  // Node 20+ has crypto.randomUUID
  const g: any = globalThis as any;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // fallback
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}
