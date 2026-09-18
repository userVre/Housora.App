/// <reference types="vite/client" />
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const setup = () => {
  const t = convexTest(schema, modules);
  return { t, owner: t.withIdentity({ subject: "owner" }), mate: t.withIdentity({ subject: "mate" }) };
};

test("single-use invite join flow with revoke", async () => {
  const { owner, mate } = setup();
  const clientId = await owner.mutation(api.projects.createClient, { name: "Invite client" });
  const projectId = await owner.mutation(api.projects.createProject, { clientId, name: "Invite project" });
  await expect(
    owner.mutation(api.invites.create, { projectId, email: "not-an-email", role: "collaborator" }),
  ).rejects.toThrow();
  const token = await owner.mutation(api.invites.create, { projectId, email: "mate@studio.com", role: "collaborator" });
  expect(token).toBeTruthy();
  const pub = await mate.query(api.invites.getPublic, { token });
  expect(pub?.role).toBe("collaborator");
  expect(await mate.mutation(api.invites.accept, { token })).toBe(projectId);
  expect(await mate.query(api.specItems.list, { projectId })).toHaveLength(0);
  await expect(mate.mutation(api.invites.accept, { token })).rejects.toThrow("already used");
  const token2 = await owner.mutation(api.invites.create, { projectId, role: "client_viewer" });
  await owner.mutation(api.invites.revoke, { token: token2 });
  expect(await mate.query(api.invites.getPublic, { token: token2 })).toBeNull();
  await expect(mate.mutation(api.invites.accept, { token: token2 })).rejects.toThrow("no longer valid");
});
