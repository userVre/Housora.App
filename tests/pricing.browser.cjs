// Real pricing component and styles; no live billing requests or credentials.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
function css(file) {
  return fs.readFileSync(file, 'utf8').replace(/@import url\([^;]+;/g, '').replace(/@import "(.+?)";/g, (_, name) => css(path.resolve(path.dirname(file), name)));
}
(async () => {
  const bundle = await esbuild.build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {PricingPage} from './components/billing-settings'; createRoot(document.getElementById('root')).render(<PricingPage/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic',plugins:[{name:'mock-services',setup(b){
    b.onResolve({filter:/^(next\/link|convex\/react|@clerk\/nextjs)$/},a=>({path:a.path,namespace:'test'}));
    b.onResolve({filter:/convex\/_generated\/api$/},a=>({path:a.path,namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='next/link'?`import React from 'react';export default function Link(p){return React.createElement('a',p)}`:a.path==='convex/react'?`const init=async()=>{};export function useMutation(){return init}export function useQuery(){return {total:12,plan:'free'}}`:a.path==='@clerk/nextjs'?`export const useClerk=()=>({});export const useUser=()=>({});`:`export const api={credits:{getMyBalance:'balance',initialize:'initialize'}}`,loader:'js',resolveDir:process.cwd()}));
  }}]});
  const styles=css(path.resolve('app/globals.css'));
  const server=http.createServer((req,res)=>{
    if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents)}
    else res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}body{background:var(--night);padding-left:232px}@media(max-width:700px){body{padding-left:0}} </style></head><body><main id="root"></main><script src="/app.js"></script></body></html>`);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r)); let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:900}}); const errors=[]; const offers=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/checkout',async r=>{offers.push(r.request().postDataJSON().offer);await r.fulfill({status:503,json:{error:'Test checkout unavailable'}})});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button',{name:'Choose Creator',exact:true}).waitFor();
    assert.equal(await page.locator('.commerce-hero').count(),0);
    const order=await page.locator('.pricing-page > section').evaluateAll(nodes=>nodes.map(n=>n.className));
    assert.deepEqual(order,['plan-grid','topup-section','credit-cost-section']);
    for(const width of [1440,1280,390]){
      await page.setViewportSize({width,height:800}); await page.evaluate(()=>window.scrollTo(0,0));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
      if(width>900) assert.ok((await page.getByRole('button',{name:'Choose Studio',exact:true}).boundingBox()).y<750,'Plan actions above fold');
      await page.screenshot({path:`outputs/pricing-${width}.png`,fullPage:true});
    }
    await page.getByRole('button',{name:/Yearly/}).click();
    assert.equal(await page.getByText('$190/yr',{exact:true}).count(),1);
    await page.getByRole('button',{name:'Choose Creator',exact:true}).click();
    await page.getByRole('alert').waitFor(); assert.equal(offers[0],'creator_yearly');
    await page.getByRole('radio',{name:'50 credits $10',exact:true}).click();
    await page.getByRole('button',{name:'Buy 50 credits',exact:true}).click();
    await page.getByRole('alert').waitFor();assert.equal(offers[1],'credits_50');
    assert.equal(await page.locator('.credit-cost-table tbody tr').count(),7);
    assert.deepEqual(errors,[]);console.log('PASS: plans above fold, section order, 7 cost rows, mobile overflow, annual offer and 50-credit checkout/error recovery');
  }finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
