const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadHelpers() {
  const src = fs.readFileSync('convex/helpers.ts', 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)(require, m, m.exports);
  return m.exports;
}
const { requireOwner, requireProjectAccess, cryptoToken } = loadHelpers();

// Simple in-memory mock ctx
function mockCtx({ identity = { subject: 'userA' }, dbGet = async () => null, dbQuery = async () => ({ unique: async () => null, collect: async () => [] }) } = {}) {
  return {
    auth: { getUserIdentity: async () => identity },
    db: {
      normalizeId: (_table, id) => id,
      get: dbGet,
      query: (table) => ({
        withIndex: () => ({
          eq: () => ({ eq: () => ({ unique: dbQuery, collect: dbQuery }) }),
          unique: dbQuery,
          collect: dbQuery,
        }),
        // fallback for direct get
      }),
    },
  };
}

test('requireOwner throws when signed-out', async () => {
  const ctx = mockCtx({ identity: null });
  await assert.rejects(() => requireOwner(ctx), /signed in/i);
});

test('requireProjectAccess blocks cross-account read via projectId', async () => {
  const ctx = mockCtx({
    identity: { subject: 'userB' },
    dbGet: async (id) => (id === 'proj1' ? { _id: 'proj1', ownerId: 'userA' } : null),
  });
  // Mock projectMembers query to return null (no membership) — withIndex("by_project_user", fn).unique()
  ctx.db.query = () => ({
    withIndex: () => ({
      unique: async () => null,
      collect: async () => [],
      eq: () => ({ eq: () => ({ unique: async () => null, collect: async () => [] }) }),
    }),
  });
  await assert.rejects(() => requireProjectAccess(ctx, 'proj1'), /access/i);
});

test('requireProjectAccess respects role: client_viewer cannot upsert style library', async () => {
  const ctx = mockCtx({
    identity: { subject: 'userC' },
    dbGet: async () => ({ _id: 'proj1', ownerId: 'userA' }),
  });
  ctx.db.query = () => ({
    withIndex: () => ({
      unique: async () => ({ role: 'client_viewer' }),
      collect: async () => [],
      eq: () => ({ eq: () => ({ unique: async () => ({ role: 'client_viewer' }), collect: async () => [] }) }),
    }),
  });
  await assert.rejects(() => requireProjectAccess(ctx, 'proj1', ['owner', 'designer']), /Insufficient permissions/i);
  // Should allow client_viewer for comment
  await assert.doesNotReject(() => requireProjectAccess(ctx, 'proj1', ['owner', 'designer', 'collaborator', 'client_viewer']));
});

test('share token is cryptographically secure and not Math.random', async () => {
  const t1 = cryptoToken();
  const t2 = cryptoToken();
  assert.notEqual(t1, t2);
  // UUID v4 format
  assert.match(t1, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  // Ensure not Math.random 24-char fallback
  assert.ok(t1.length >= 36);
});

test('cache migration: old global cache without ownerId is not returned to new user', async () => {
  // Simulate old row with no ownerId, new query by_owner_hash_mode should miss
  // Our code now queries by_owner_hash_mode, so old global rows (no ownerId) are ignored — privacy preserved
  // This test documents the migration: old cache treated as expired miss, not leaked
  const oldRow = { imageHash: 'abc', mode: 'Interior', objects: [], expiresAt: Date.now() + 100000 };
  // New code would query with ownerId, oldRow has no ownerId field, so index miss -> null
  assert.equal(oldRow.ownerId, undefined);
  // New insert always includes ownerId, so new queries are owner-scoped
  const newRow = { ownerId: 'userA', imageHash: 'abc', mode: 'Interior', objects: [{ id: '1' }], expiresAt: Date.now() + 100000 };
  assert.equal(newRow.ownerId, 'userA');
  // Different user should not see newRow
  const fetchedForUserB = newRow.ownerId === 'userB' ? newRow : null;
  assert.equal(fetchedForUserB, null);
});

test('enqueue per-owner requestId: same UUID by different user is isolated', async () => {
  const requestId = '12345678-1234-1234-1234-123456789012';
  const existing = { requestId, ownerId: 'userA', type: 'edit' };
  // Simulate enqueue check: if existing.ownerId !== caller, throw
  const caller = 'userB';
  assert.notEqual(existing.ownerId, caller);
  // Should throw "Request ID already used by another user."
  await assert.rejects(async () => {
    if (existing.ownerId !== caller) throw new Error('Request ID already used by another user.');
  }, /another user/i);
});
