/// <reference types="vite/client" />
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const setup = () => {
  const t = convexTest(schema, modules);
  return { t, designer: t.withIdentity({ subject: "designer" }), stranger: t.withIdentity({ subject: "stranger" }) };
};
async function makeProject(user: any) {
  const clientId = await user.mutation(api.projects.createClient, { name: "Test client" });
  return await user.mutation(api.projects.createProject, { clientId, name: "Test project" });
}

test("spec items round-trip with validation", async () => {
  const { designer } = setup();
  const projectId = await makeProject(designer);
  await expect(designer.mutation(api.specItems.add, { projectId, name: "   " })).rejects.toThrow();
  const id = await designer.mutation(api.specItems.add, { projectId, name: "Luna sofa", quantity: 2, retailPrice: 150, supplier: "Menu · LU-286", link: "https://example.com/sofa" });
  expect(id).toBeTruthy();
  const rows = await designer.query(api.specItems.list, { projectId });
  expect(rows).toHaveLength(1);
  expect(rows[0].name).toBe("Luna sofa");
  expect(rows[0].status).toBe("to_source");
  await designer.mutation(api.specItems.setStatus, { itemId: rows[0]._id, status: "approved" });
  expect((await designer.query(api.specItems.list, { projectId }))[0].status).toBe("approved");
  await designer.mutation(api.specItems.remove, { itemId: rows[0]._id });
  expect(await designer.query(api.specItems.list, { projectId })).toHaveLength(0);
});

test("spec items are project-private", async () => {
  const { designer, stranger } = setup();
  const projectId = await makeProject(designer);
  await expect(stranger.query(api.specItems.list, { projectId })).rejects.toThrow();
  await expect(stranger.mutation(api.specItems.add, { projectId, name: "Sneaky" })).rejects.toThrow();
});

test("budgets save/get round-trip with clamping", async () => {
  const { designer, stranger } = setup();
  const projectId = await makeProject(designer);
  const defaults = await designer.query(api.budgets.get, { projectId });
  expect(defaults.taxRate).toBe(0);
  await designer.mutation(api.budgets.save, { projectId, clientBudget: 25000, taxRate: 8, shippingFlat: 200, contingencyPct: 10 });
  const saved = await designer.query(api.budgets.get, { projectId });
  expect(saved.clientBudget).toBe(25000);
  expect(saved.taxRate).toBe(8);
  await expect(stranger.query(api.budgets.get, { projectId })).rejects.toThrow();
});

test("room dimensions validate ranges", async () => {
  const { designer } = setup();
  const projectId = await makeProject(designer);
  const roomId = await designer.mutation(api.projects.createRoom, { projectId, name: "Living room", type: "Interior" });
  const rooms = await designer.query(api.projects.listRooms, { projectId });
  expect(rooms.length).toBeGreaterThan(0);
  await expect(
    designer.mutation(api.projects.updateRoom, { roomId: rooms[0]._id, dimensions: { w: 0, h: 3 } }),
  ).rejects.toThrow();
  await designer.mutation(api.projects.updateRoom, { roomId: rooms[0]._id, dimensions: { w: 4.8, h: 3.6, ceiling: 2.7 } });
  const updated = await designer.query(api.projects.listRooms, { projectId });
  expect(updated[0].dimensions).toMatchObject({ w: 4.8, h: 3.6, ceiling: 2.7 });
});
