// Isolated browser test: production object panel, mocked balance and provider.
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
function resolveFile(specifier, resolveDir) {
  const base = path.resolve(resolveDir, specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.cjs`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function css(file) {
  return fs.readFileSync(file, 'utf8').replace(/@import url\([^;]+;/g, '').replace(/@import "(.+?)";/g, (_, name) => css(path.resolve(path.dirname(file), name)));
}

(async () => {
  const build = await esbuild.build({
    absWorkingDir: root,
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {DetectedObjects} from './components/detected-objects'; createRoot(document.getElementById('root')).render(<DetectedObjects hasImage mode="Interior" image="/photo.png" onUpload={()=>{}} onCreate3d={()=>{window.selected3d=true}} />);`, resolveDir: root, loader: 'tsx' },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic',
    plugins: [{ name: 'test-adapters', setup(b) {
      b.onResolve({filter:/^(next\/image|convex\/react)$/}, a => ({path:a.path,namespace:'test'}));
      b.onResolve({filter:/convex\/_generated\/api$/}, a => ({path:a.path,namespace:'test'}));
      b.onResolve({filter:/^\.\/components\/detected-objects$/}, () => ({path:path.join(root,'components','detected-objects.tsx')}));
      b.onResolve({filter:/^(react|react\/jsx-runtime|react-dom\/client|lucide-react)$/}, a => ({path:require.resolve(a.path,{paths:[root]})}));
      b.onResolve({filter:/^[^./]/}, a => {
        try { return {path:require.resolve(a.path,{paths:[root]})}; } catch { return null; }
      });
      b.onResolve({filter:/^\./}, a => {
        const resolved = resolveFile(a.path, a.resolveDir);
        return resolved ? {path:resolved} : null;
      });
      b.onLoad({filter:/.*/,namespace:'test'}, a => ({contents: a.path==='next/image' ? `import React from 'react'; export default function Image({fill,unoptimized,sizes,...p}) { return React.createElement('img',p); }` : a.path==='convex/react' ? `export function useQuery(){return {total:12}}` : `export const api={credits:{getMyBalance:'balance'}}`,loader:'js',resolveDir:root}));
    }}]
  });
  const styles = css(path.join(root,'app','globals.css'));
  const server=http.createServer((req,res)=>{
    if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(build.outputFiles[0].contents)}
    else if(req.url==='/photo.png'){res.setHeader('Content-Type','image/png');res.end(fs.readFileSync(path.join(root,'public','pictures','interior-design-room-living-room.png')))}
    else res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}body{background:#151612;color:#eee;font-family:Arial}#root{max-width:390px;margin:auto}${fs.readFileSync(path.join(root,'app','object-tools.css'),'utf8')}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser=await chromium.launch({headless:true,channel:'msedge'});
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    let requests=0; const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/ai/segment',async route=>{
      requests++; const body=route.request().postDataJSON(); assert.equal(body.confirmed,true); assert.equal(body.autoDetect,true);
      await route.fulfill({json:{objects:[{id:'object-1',label:'sofa',score:.96,box:[.1,.2,.7,.8],mask:'data:image/png;base64,eA==',thumbnail:'/photo.png'}]}});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('dialog').waitFor(); assert.equal(requests,0);
    await page.getByRole('button',{name:'Cancel',exact:true}).click(); assert.equal(requests,0);
    await page.getByRole('button',{name:'Auto-detect · 1 credit',exact:true}).click();
    await page.getByRole('button',{name:'Detect objects · 1 credit',exact:true}).click();
    await page.getByRole('button',{name:/sofa.*96% confidence/}).click();
    assert.equal(requests,1);
    await page.getByRole('button',{name:/Create 3D from this object/}).click();
    assert.equal(await page.evaluate(()=>window.selected3d),true);
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:800});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
      await page.screenshot({path:path.join('outputs',`real-object-panel-${width}.png`),fullPage:true});
    }
    assert.deepEqual(errors,[]); console.log('PASS: consent, cancel, real result rendering, 3D selection, desktop/mobile overflow and no browser exceptions');
  } finally {await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
