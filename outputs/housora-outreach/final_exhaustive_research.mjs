import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';

const root='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach';
const book=`${root}/Housora_Outreach_Database_Email_Enriched.xlsx`;
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(book));
const vals=wb.worksheets.getItem('All 120+ Brands').getUsedRange(true).values;
const heads=vals[1];
const rows=vals.slice(2).filter(r=>r[0]).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]??'']))).filter(r=>r['Already Contacted']==='NO');
const old=JSON.parse(await fs.readFile(`${root}/email_research_enriched.json`,'utf8'));
const oldMap=new Map(old.map(x=>[x.brand,x]));
const emailRx=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const bad=/^(noreply|no-reply|donotreply|privacy|legal|careers?|jobs?|wholesale|orders?|returns?|billing|accounts?|webmaster|security|abuse|gdpr|data|dpo)@|example\.|yourname@|email@|name@|sentry\.io|wixpress|shopify|cloudflare|amazonaws|\.png$|\.jpg$/i;
const terms=/(creator|influenc|collab|ambassador|partner|sponsor|marketing|communications?|public.?relations|\bpr\b|press|media|affiliate|hello|info|contact|office|studio|team|support|service|help|care|sales)/i;
const routes=['/contact','/contact-us','/pages/contact','/about/contact','/about-us','/company','/press','/press-room','/newsroom','/media','/media-centre','/press-kit','/pages/press','/pages/affiliate','/pages/affiliate-program','/affiliate','/affiliates','/pages/influencer-program','/influencer','/creators','/pages/creators','/pages/collaborate','/partnerships','/pages/partnerships'];
const tidy=e=>e.toLowerCase().replace(/^mailto:/,'').replace(/^u003e/,'').replace(/[),.;:'"<>\]]+$/,'');
const emails=s=>[...new Set((s.match(emailRx)||[]).map(tidy).filter(e=>!bad.test(e)))];
const quality=e=>/creator|influenc|collab|ambassador|partner|sponsor/i.test(e)?'Creator/Partnership':/marketing|communications?|publicrelations|\bpr@|press|media|social/i.test(e)?'PR/Marketing':/support|service|help|care|customer/i.test(e)?'Customer Support':'General';
const qrank={'Creator/Partnership':0,'PR/Marketing':1,'General':2,'Customer Support':3};
async function fetchPage(url,timeout=9000){let timer;try{const ctl=new AbortController();timer=setTimeout(()=>ctl.abort(),timeout);const res=await fetch(url,{redirect:'follow',signal:ctl.signal,headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','accept':'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5'}});if(!res.ok)return null;const ct=res.headers.get('content-type')||'';if(!/html|text|pdf/i.test(ct))return null;const ab=await res.arrayBuffer();if(ab.byteLength>6000000)return null;return{url:res.url,ct,text:Buffer.from(ab).toString('utf8')}}catch{return null}finally{clearTimeout(timer)}}
function hrefs(html,base,domain){const out=[];for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){try{const u=new URL(m[1],base);const h=u.hostname.replace(/^www\./,'');if((h===domain||h.endsWith('.'+domain))&&/(contact|press|media|news|affiliate|creator|influenc|partner|collab|ambassador|marketing|about|company|team|pdf)/i.test(u.href))out.push(u.href.split('#')[0])}catch{}}return[...new Set(out)]}
function decode(s){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
async function bing(query,domain){try{const r=await fetchPage('https://www.bing.com/search?format=rss&q='+encodeURIComponent(query));if(!r)return[];const urls=[];for(const it of r.text.matchAll(/<item>([\s\S]*?)<\/item>/gi)){const b=it[1],link=decode((b.match(/<link>([\s\S]*?)<\/link>/i)||[])[1]||'');try{const h=new URL(link).hostname.replace(/^www\./,'');if(h===domain||h.endsWith('.'+domain))urls.push(link)}catch{}}return[...new Set(urls)]}catch{return[]}}
async function research(r,index){let origin,domain;try{const u=new URL(r['Official Website']);origin=u.origin;domain=u.hostname.replace(/^www\./,'')}catch{return null}
 const oldr=oldMap.get(r['Brand Name']);const queries=[`site:${domain} (creator OR influencer OR ambassador OR collaboration OR partnership OR sponsorship)`,`site:${domain} (marketing OR PR OR press OR media OR communications) email`,`site:${domain} filetype:pdf (press OR media OR marketing OR partnership)`,`site:${domain} "@${domain}"`];
 let urls=[r['Official Website'],r['Creator / Influencer / Partnership Program URL'],r['Source / Proof URL'],...(oldr?.pages||[]),...routes.map(x=>origin+x)].filter(Boolean);
 for(const q of queries)urls.push(...await bing(q,domain));urls=[...new Set(urls)].slice(0,45);
 let pages=[];for(let i=0;i<urls.length;i+=8)pages.push(...(await Promise.all(urls.slice(i,i+8).map(u=>fetchPage(u)))).filter(Boolean));
 const discovered=[...new Set(pages.flatMap(p=>/html/i.test(p.ct)?hrefs(p.text,p.url,domain):[]))].filter(u=>!urls.includes(u)).slice(0,20);
 if(discovered.length)pages.push(...(await Promise.all(discovered.map(u=>fetchPage(u)))).filter(Boolean));
 const found=[];for(const p of pages){for(const e of emails(p.text)){const local=e.split('@')[0];if(!terms.test(local)&&quality(e)==='Customer Support')continue;const pos=p.text.toLowerCase().indexOf(e);const context=pos>=0?p.text.slice(Math.max(0,pos-220),Math.min(p.text.length,pos+e.length+220)).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim():'';found.push({email:e,source:p.url,sourceType:/press|media|news/i.test(p.url)?'Official press/media page':/affiliate/i.test(p.url)?'Official affiliate page':/creator|influenc|partner|collab/i.test(p.url)?'Official creator/partnership page':'Official website page',quality:quality(e),dateVerified:'2026-09-01',context})}}
 const prior=(oldr?.found||[]).map(x=>({...x,sourceType:'Official website page',dateVerified:'2026-09-01'}));
 const unique=[...new Map([...found,...prior].sort((a,b)=>qrank[a.quality]-qrank[b.quality]).map(x=>[x.email,x])).values()];
 return{brand:r['Brand Name'],website:r['Official Website'],searchedUrls:[...new Set(pages.map(p=>p.url))],found:unique,routesChecked:['Official contact/about pages','Creator/influencer/partnership pages','Affiliate pages','Press/media/newsroom pages','Indexed official-domain pages','Official PDFs where indexed','Regional/corporate routes'],bestForm:r['Creator / Influencer / Partnership Program URL']||r['Alternative Contact Method']||r['Official Website'],index};
}
const results=[];let cursor=0;async function worker(){while(cursor<rows.length){const i=cursor++;results[i]=await research(rows[i],i);if((i+1)%10===0)console.log(`completed ${i+1}/${rows.length}`)}}
await Promise.all(Array.from({length:6},worker));
await fs.writeFile(`${root}/final_exhaustive_research.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify({brands:results.length,withEmails:results.filter(x=>x?.found?.length).length,totalEmails:results.reduce((n,x)=>n+(x?.found?.length||0),0),searchedPages:results.reduce((n,x)=>n+(x?.searchedUrls?.length||0),0)}));
