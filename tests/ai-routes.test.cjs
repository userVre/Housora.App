const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { NextResponse } = require('next/server');

function route(file, { signedIn = true, duplicate = false, noCredits = false } = {}) {
  const calls = { consume: [], refund: [], fetch: [] };
  const credits = {
    consumeCredits: async (...args) => { calls.consume.push(args); if (noCredits) throw Error('Not enough credits'); return { eventId: 'usage:1', subscriptionUsed: args[1], purchasedUsed: 0, duplicate }; },
    refundCredits: async (...args) => calls.refund.push(args),
    refundUsageEvent: async (...args) => calls.refund.push(args),
  };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const fakeRequire = name => name === 'next/server' ? { NextResponse }
    : name === '@clerk/nextjs/server' ? { auth: async () => ({ userId: signedIn ? 'user-test' : null }) }
    : name.endsWith('/credits') ? credits
    : name.endsWith('/ai-costs') ? { AI_COSTS: { detection: 1, imageEdit: 4, model3d: 12 } }
    : name.endsWith('/cache') ? { hashImage: () => 'image-hash', hashGeneration: () => 'generation-hash', getCachedSegmentation: async () => null, saveCachedSegmentation: async () => {}, getCachedGeneration: async () => null, saveCachedGeneration: async () => {} }
    : name.endsWith('/tripo-tracking') ? { createTripoTrackingToken: () => 'signed-token', verifyTripoTrackingToken: () => ({ usageEventId: 'usage:1' }) }
    : name.endsWith('/model-storage') ? { persistModel: async () => 'https://storage.example.com/model.glb' }
    : name.endsWith('/cost-model') ? { HOUSORA_CREDIT_COSTS: { model3d: 12 }, tripoCostUSD: () => null, warnIfProviderCostExceedsAllowed: () => {} }
    : name.endsWith('/composite-object-edit') ? { compositeObjectEdit: async () => Buffer.from('test') }
    : name.endsWith('/image-storage') ? { storeProjectImage: async () => 'https://storage.example.com/image.png' }
    : name.endsWith('/durable-ai') ? { enqueueAi: async () => ({ requestId: 'job-1', status: 'queued' }) }
    : name.includes('convex/_generated/api') ? { api: { tripoRequests: { getByRequestServer: {}, saveServer: {} } } }
    : name.includes('convex/browser') ? { ConvexHttpClient: class { async query() { return null; } async mutation() { return null; } } }
    : require(name);
  const responses = [];
  const fetch = async (...args) => { calls.fetch.push(args); if (!responses.length) throw Error('Unexpected provider request'); return responses.shift(); };
  new Function('require', 'module', 'exports', 'fetch', source)(fakeRequire, module, module.exports, fetch);
  return { ...module.exports, calls, responses };
}
const json = value => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });
const requestId = '12345678-1234-1234-1234-123456789012';
function detection(overrides = {}) { return new Request('http://localhost/api/ai/segment', { method: 'POST', body: JSON.stringify({ image: 'data:image/jpeg;base64,YQ==', autoDetect: true, confirmed: true, requestId, ...overrides }) }); }
function model(confirmed = true, sourceKind = 'furniture-upload', sourceBox) { const form = new FormData(); form.set('image', new File(['image'], 'test.jpg', { type: 'image/jpeg' })); form.set('requestId', requestId); form.set('confirmed', String(confirmed)); form.set('sourceKind', sourceKind); if (sourceBox) form.set('sourceBox', JSON.stringify(sourceBox)); return new Request('http://localhost/api/tripo/generate', { method: 'POST', body: form }); }
process.env.MODAL_SAM_ENDPOINT = 'https://test.modal.run';
process.env.MODAL_PROXY_KEY = 'test-key';
process.env.MODAL_PROXY_SECRET = 'test-secret';
process.env.TRIPO_API_KEY = 'test-key';
process.env.GROK_IMAGE_KEY = 'test-key';

test('Grok preserves URL reference images through the edit endpoint', async () => {
  const r = route('app/api/ai/edit/route.ts');
  r.responses.push(json({ data: [{ url: 'https://example.com/result.png' }] }));
  const response = await r.POST(new Request('http://localhost/api/ai/edit', { method: 'POST', body: JSON.stringify({ image: 'https://example.com/source.png', prompt: 'Change the wall', requestId, confirmed: true }) }));
  assert.equal(response.status, 200);
  assert.equal(r.calls.fetch[0][0], 'https://api.x.ai/v1/images/edits');
  assert.equal(JSON.parse(r.calls.fetch[0][1].body).image.url, 'https://example.com/source.png');
  assert.equal(r.calls.consume.length, 1);
});

test('detection requires auth and explicit confirmation without charging', async () => {
  for (const options of [{ signedIn: false }, {}]) {
    const r = route('app/api/ai/segment/route.ts', options);
    assert.ok((await r.POST(detection({ confirmed: false }))).status >= 400);
    assert.equal(r.calls.consume.length, 0); assert.equal(r.calls.fetch.length, 0);
  }
});
test('duplicate detection cannot dispatch or refund the original request', async () => {
  const r = route('app/api/ai/segment/route.ts', { duplicate: true });
  assert.equal((await r.POST(detection())).status, 409);
  assert.equal(r.calls.fetch.length, 0); assert.equal(r.calls.refund.length, 0);
});
test('empty detection returns credit and does not fabricate objects', async () => {
  const r = route('app/api/ai/segment/route.ts'); r.responses.push(json({ auto_detect: true, objects: [] }));
  const response = await r.POST(detection());
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).objects, []);
  assert.equal(r.calls.consume[0][1], 1); assert.equal(r.calls.refund.length, 1);
});
test('real detections are returned without a second charge', async () => {
  const objects = [{ id: 'chair-1', label: 'chair', score: .95, box: [.1, .2, .4, .8], thumbnail: 'crop', mask: 'mask' }];
  const r = route('app/api/ai/segment/route.ts'); r.responses.push(json({ auto_detect: true, objects }));
  assert.deepEqual((await (await r.POST(detection())).json()).objects, objects);
  assert.equal(r.calls.consume.length, 1); assert.equal(r.calls.refund.length, 0);
  assert.equal(JSON.parse(r.calls.fetch[0][1].body).auto_detect, true);
});
test('old Modal deployment or provider failure refunds detection', async () => {
  for (const response of [json({ masks: [] }), new Response('error', { status: 500 })]) {
    const r = route('app/api/ai/segment/route.ts'); r.responses.push(response);
    assert.ok((await r.POST(detection())).status >= 400); assert.equal(r.calls.refund.length, 1);
  }
});
test('insufficient credits never calls Modal', async () => {
  const r = route('app/api/ai/segment/route.ts', { noCredits: true });
  assert.ok((await r.POST(detection())).status >= 400); assert.equal(r.calls.fetch.length, 0);
});
test('3D requires confirmation and blocks duplicate task dispatch', async () => {
  const r = route('app/api/tripo/generate/route.ts'); assert.equal((await r.POST(model(false))).status, 400); assert.equal(r.calls.consume.length, 0);
  const duplicate = route('app/api/tripo/generate/route.ts', { duplicate: true }); assert.equal((await duplicate.POST(model())).status, 409); assert.equal(duplicate.calls.fetch.length, 0);
});
test('3D rejects room images and oversized SAM crops before charging', async () => {
  const room = route('app/api/tripo/generate/route.ts');
  assert.equal((await room.POST(model(true, 'room-photo'))).status, 400);
  assert.equal(room.calls.consume.length, 0); assert.equal(room.calls.fetch.length, 0);
  const crop = route('app/api/tripo/generate/route.ts');
  assert.equal((await crop.POST(model(true, 'sam-crop', [0, 0, 1, 1]))).status, 400);
  assert.equal(crop.calls.consume.length, 0); assert.equal(crop.calls.fetch.length, 0);
});
test('3D uploads to multipart endpoint, charges 12 and returns secure tracking', async () => {
  const r = route('app/api/tripo/generate/route.ts'); r.responses.push(json({ code: 0, data: { image_token: 'file' } }), json({ code: 0, data: { task_id: 'task-1234' } }));
  const response = await r.POST(model()); assert.equal(response.status, 200); assert.equal((await response.json()).trackingToken, 'signed-token');
  assert.ok(r.calls.fetch[0][0].endsWith('/upload')); assert.equal(r.calls.consume[0][1], 12); assert.equal(r.calls.refund.length, 0);
});
test('Tripo application error in HTTP 200 is an error and refunds', async () => {
  const r = route('app/api/tripo/generate/route.ts'); r.responses.push(json({ code: 100, message: 'Invalid image' }));
  assert.equal((await r.POST(model())).status, 502); assert.equal(r.calls.refund.length, 1);
});

test('completed 3D task returns persisted model URL', async () => {
  const r = route('app/api/tripo/tasks/[taskId]/route.ts');
  r.responses.push(json({ code: 0, data: { status: 'success', output: { pbr_model: 'https://provider.example/model.glb' } } }));
  const response = await r.GET(new Request('http://localhost/api/tripo/tasks/task-1234?trackingToken=test'), { params: Promise.resolve({ taskId: 'task-1234' }) });
  const body = await response.json();
  assert.equal(body.persisted, true);
  assert.equal(body.modelUrl, 'https://storage.example.com/model.glb');
  assert.equal(r.calls.refund.length, 0);
});
