// Isolated browser test: production object panel, mocked balance and provider.
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const build = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {DetectedObjects} from './components/detected-objects'; createRoot(document.getElementById('root')).render(<DetectedObjects hasImage mode="Interior" image="/photo.png" onUpload={()=>{}} onCreate3d={()=>{window.selected3d=true}} />);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic',
    plugins: [{ name: 'test-adapters', setup(b) {
      b.onResolve({filter:/^(next\/image|convex\/react)$/}, a => ({path:a.path,namespace:'test'}));
      b.onResolve({filter:/convex\/_generated\/api$/}, a => ({path:a.path,namespace:'test'}));
      b.onLoad({filter:/.*/,namespace:'test'}, a => ({contents: a.path==='next/image' ? `import React from 'react'; export default function Image({fill,unoptimized,sizes,...p}) { return React.createElement('img',p); }` : a.path==='convex/react' ? `export function useQuery(){return {total:12}}` : `export const api={credits:{getMyBalance:'balance'}}`,loader:'js',resolveDir:process.cwd()}));
    }}]
  });
  const server=http.createServer((req,res)=>{
    if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(build.outputFiles[0].contents)}
    else if(req.url==='/photo.png'){res.setHeader('Content-Type','image/png');res.end(fs.readFileSync('public/pictures/interior-design-room-living-room.png'))}
    else res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--night-line:#42443c;--night-panel:#20221d;--night-text:#f0f0e9;--font-body:Arial;--radius-lg:20px}body{background:#151612;color:#eee;font-family:Arial}#root{max-width:390px;margin:auto}img{max-width:100%;height:100%;object-fit:cover}button{cursor:pointer;color:inherit;background:#30332b;border:1px solid #666;padding:12px}${fs.readFileSync('app/object-tools.css','utf8')}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`);
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
