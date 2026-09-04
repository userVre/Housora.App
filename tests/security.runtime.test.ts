/// <reference types="vite/client" />
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
// In-memory Convex test implementation, not deployed Clerk sessions.
const modules = import.meta.glob("../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "alice" });
  const bob = t.withIdentity({ subject: "bob" });
  const clientId = await alice.mutation(api.projects.createClient, { name: "Client" });
  const projectId = await alice.mutation(api.projects.createProject, { clientId, name: "Home" });
  return { t, alice, bob, projectId, clientId };
}
test("signed-out and cross-account access is rejected", async () => {
  const { t, bob, projectId } = await setup();
  await expect(t.query(api.projects.listProjects, {})).rejects.toThrow();
  await expect(bob.query(api.projects.getProject, { projectId })).rejects.toThrow();
});
test("collaborator can see shared projects", async () => {
  const { alice, bob, projectId } = await setup();
  await alice.mutation(api.projects.addMember, { projectId, userId: "bob", role: "collaborator" });
  expect(await bob.query(api.projects.listProjects, {})).toHaveLength(1);
});
test("viewer cannot create rooms or grant membership", async () => {
  const { alice, bob, projectId } = await setup();
  await alice.mutation(api.projects.addMember, { projectId, userId: "bob", role: "client_viewer" });
  await expect(bob.mutation(api.projects.createRoom, { projectId, name: "Room", type: "Interior" })).rejects.toThrow();
  await expect(bob.mutation(api.projects.addMember, { projectId, userId: "other", role: "designer" })).rejects.toThrow();
});
test("furniture and saved designs are isolated", async () => {
  const { alice, bob } = await setup();
  await alice.mutation(api.furniture.save, { source: "retailer_catalog", externalId: "chair", name: "Chair" });
  await alice.mutation(api.savedDesigns.save, { designId: "design", title: "Room", image: "image", mode: "Interior", savedAt: new Date().toISOString() });
  expect(await bob.query(api.furniture.list, {})).toEqual([]);
  expect(await bob.query(api.savedDesigns.list, {})).toEqual([]);
  await bob.mutation(api.savedDesigns.remove, { designId: "design" });
  expect(await alice.query(api.savedDesigns.list, {})).toHaveLength(1);
});
test("wrong-table IDs cannot authorize project operations", async () => {
  const { alice, clientId } = await setup();
  await expect(alice.query(api.projects.getProject, { projectId: clientId })).rejects.toThrow();
});
test("unmetered background provider dispatch is blocked", async () => {
  const { alice } = await setup();
  await expect(alice.mutation(api.jobs.enqueue, { type: "edit", requestId: "test", inputHash: "hash", image: "image", prompt: "edit" })).rejects.toThrow("Background generation");
});

test("saving updates one project and persists its image versions", async () => {
  const { alice } = await setup();
  const base = { designId: "room-design", title: "Room", mode: "Interior" as const, savedAt: new Date().toISOString() };
  const first = await alice.mutation(api.savedDesigns.save, { ...base, image: "first" });
  const second = await alice.mutation(api.savedDesigns.save, { ...base, image: "second", prompt: "Sage walls" });
  expect(second).toEqual(first);
  const saved = await alice.query(api.savedDesigns.list, {});
  expect(saved).toHaveLength(1);
  expect(saved[0].prompt).toBe("Sage walls");
  expect(await alice.query(api.roomVersions.list, second)).toHaveLength(2);
});

test("a project cannot overwrite another project's approval", async () => {
  const { alice, bob, projectId } = await setup();
  const roomId = await alice.mutation(api.projects.createRoom, { projectId, name: "Room", type: "Interior" });
  const versionId = await alice.mutation(api.roomVersions.create, { projectId, roomId, image: "image" });
  const clientId = await bob.mutation(api.projects.createClient, { name: "Other" });
  const otherProject = await bob.mutation(api.projects.createProject, { clientId, name: "Other" });
  await alice.mutation(api.collab.setApproval, { projectId, versionId, status: "approved" });
  await expect(bob.mutation(api.collab.setApproval, { projectId: otherProject, versionId, status: "rejected" })).rejects.toThrow();
  expect((await alice.query(api.collab.getApproval, { versionId }))?.status).toBe("approved");
});

test("repeated membership updates do not break access queries", async () => {
  const { alice, bob, projectId } = await setup();
  await alice.mutation(api.projects.addMember, { projectId, userId: "bob", role: "designer" });
  await alice.mutation(api.projects.addMember, { projectId, userId: "bob", role: "collaborator" });
  expect(await bob.query(api.projects.checkAccess, { projectId })).toBe("collaborator");
});

test("saved model library is owner scoped", async () => {
  const { t, alice, bob } = await setup();
  await t.run(async ctx => {
    const storageId = await ctx.storage.store(new Blob(["glTF"], { type: "model/gltf-binary" }));
    await ctx.db.insert("generatedModels", { ownerId: "alice", taskId: "task", storageId, createdAt: Date.now() });
  });
  expect(await alice.query(api.models.list, {})).toHaveLength(1);
  expect(await bob.query(api.models.list, {})).toEqual([]);
});

test("public project preview expires and revokes without exposing members", async () => {
  const { t, alice, projectId } = await setup();
  const roomId = await alice.mutation(api.projects.createRoom, { projectId, name: "Living room", type: "Interior" });
  await alice.mutation(api.roomVersions.create, { projectId, roomId, image: "https://example.com/room.png" });
  await t.run(async ctx => { await ctx.db.insert("shareLinks", { projectId, token: "test-share", role: "viewer", createdBy: "alice", createdAt: Date.now(), expiresAt: Date.now() + 60000 }); });
  const preview = await t.query(api.collab.getSharedProject, { token: "test-share" });
  expect(preview).toEqual({ name: "Home", rooms: [{ name: "Living room", image: "https://example.com/room.png" }] });
  await alice.mutation(api.collab.revokeShareLink, { token: "test-share" });
  expect(await t.query(api.collab.getSharedProject, { token: "test-share" })).toBeNull();
});

test("a version cannot be attached to another project's room", async () => {
  const { alice, projectId, clientId } = await setup();
  const other = await alice.mutation(api.projects.createProject, { clientId, name: "Other" });
  const roomId = await alice.mutation(api.projects.createRoom, { projectId: other, name: "Room", type: "Interior" });
  await expect(alice.mutation(api.roomVersions.create, { projectId, roomId, image: "image" })).rejects.toThrow("Room does not belong");
});
