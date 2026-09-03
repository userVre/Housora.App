import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
import fs from 'node:fs/promises';
const p='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Outreach_Database_Final_Verified.xlsx';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(p));const v=wb.worksheets.getItem('All 120+ Brands').getUsedRange(true).values,h=v[1];
const rows=v.slice(2).filter(r=>r[0]).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]??'']))).filter(r=>r['Already Contacted']==='NO'&&r['Best Verified Contact Email']);
await fs.writeFile('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/final_email_review.tsv',['Brand\tEmail\tQuality\tTier\tGeo\tSource',...rows.map(r=>[r['Brand Name'],r['Best Verified Contact Email'],r['Email Quality'],r['Contact Tier'],r['Geographic Eligibility'],r['Exact Source / Proof URL']].join('\t'))].join('\n'));
console.log(rows.length);
const av=v.slice(2).filter(r=>r[0]).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]??'']))).filter(r=>r['Already Contacted']==='NO');
const pm=new Map();for(const r of av){const w=String(r['Suggested First Message']).toLowerCase().replace(/[^a-z0-9' ]/g,' ').split(/\s+/).filter(Boolean);for(let i=0;i<=w.length-5;i++){const p=w.slice(i,i+5).join(' ');pm.set(p,(pm.get(p)||0)+1)}}
console.log([...pm].sort((a,b)=>b[1]-a[1]).slice(0,40));
