import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const book='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Outreach_Database_Revised.xlsx';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(book));
const vals=wb.worksheets.getItem('All 120+ Brands').getUsedRange(true).values;
const heads=vals[1];
const rows=vals.slice(2).filter(r=>r[0]).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]??'']))).filter(r=>r['Already Contacted']==='NO');
const banned=/^(noreply|no-reply|donotreply|privacy|legal|careers?|jobs?|wholesale|orders?|returns?|billing|accounts?|webmaster|security|abuse|gdpr|data|dpo)@/i;
const imageExt=/\.(png|jpe?g|gif|svg|webp|ico)$/i;
const priority=[/creator|influenc|collab|ambassador/i,/partner|sponsor/i,/marketing|communications?|\bpr\b|press|media/i,/affiliate/i,/hello|info|contact|office|studio|team/i,/support|service|help|care/i];
const quality=e=>priority[0].test(e)?'Creator/Partnership':priority[1].test(e)?'Creator/Partnership':priority[2].test(e)?'PR/Marketing':priority[3].test(e)?'General':priority[4].test(e)?'General':'Customer Support';
const rank=e=>{let i=priority.findIndex(x=>x.test(e));return i<0?99:i};
function cleanEmail(e){return e.toLowerCase().replace(/^mailto:/,'').split('?')[0].replace(/[),.;:'"<>\]]+$/,'').trim()}
function extract(html){const set=new Set();for(const m of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)){const e=cleanEmail(m[0]);if(!banned.test(e)&&!imageExt.test(e)&&!e.includes('example.')&&!e.includes('sentry.io'))set.add(e)}return [...set]}
function links(html,base){const out=[];for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){try{const u=new URL(m[1],base);if(u.origin===new URL(base).origin&&/(contact|press|media|affiliate|creator|influenc|partner|collab|ambassador|about|company)/i.test(u.pathname))out.push(u.href.split('#')[0])}catch{}}return [...new Set(out)]}
async function fetchPage(url){let t;try{const c=new AbortController();t=setTimeout(()=>c.abort(),6000);const r=await fetch(url,{signal:c.signal,redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; HousoraResearch/1.0)','accept':'text/html,application/xhtml+xml'}});if(!r.ok||!String(r.headers.get('content-type')).includes('text/html'))return null;return {url:r.url,html:(await r.text()).slice(0,1000000)}}catch{return null}finally{clearTimeout(t)}}
const common=['/pages/contact','/contact','/contact-us','/about/contact','/press','/media','/pages/affiliate-program','/pages/influencer-program','/pages/collaborate'];
async function research(r){let seed=[r['Creator / Influencer / Partnership Program URL'],r['Source / Proof URL'],r['Official Website']].filter(Boolean);let origin;try{origin=new URL(r['Official Website']).origin}catch{return {...r,found:[]}};seed.push(...common.slice(0,4).map(p=>origin+p));seed=[...new Set(seed)].slice(0,6);let pages=(await Promise.all(seed.map(fetchPage))).filter(Boolean);const extra=[...new Set(pages.flatMap(p=>links(p.html,p.url)).slice(0,2))];if(extra.length)pages.push(...(await Promise.all(extra.map(fetchPage))).filter(Boolean));const found=[];for(const p of pages)for(const e of extract(p.html))found.push({email:e,source:p.url,quality:quality(e),rank:rank(e),context:/(creator|influenc|collab|partner|press|media|affiliate)/i.test(p.url)?'targeted page':'official website'});const unique=[...new Map(found.sort((a,b)=>a.rank-b.rank).map(x=>[x.email,x])).values()];return {brand:r['Brand Name'],website:r['Official Website'],existing:r['Best Verified Contact Email'],found:unique,pages:pages.map(p=>p.url)}}
const results=[];let next=0;async function worker(){while(next<rows.length){const i=next++;const x=await research(rows[i]);results[i]=x;if((i+1)%10===0)console.log(`researched ${i+1}/${rows.length}`)}}
await Promise.all(Array.from({length:25},()=>worker()));
await fs.writeFile('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/email_research.json',JSON.stringify(results,null,2));
const count=results.filter(x=>x.found.length).length;console.log(JSON.stringify({brands:rows.length,withCandidates:count,totalCandidates:results.reduce((n,x)=>n+x.found.length,0)}));
