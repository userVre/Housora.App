import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Verified_Brand_Outreach_Database.xlsx';
const outputPath='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Outreach_Database_Revised.xlsx';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const allSheet=wb.worksheets.getItem('All 120+ Brands');
const used=allSheet.getUsedRange(true).values;
const oldHeaders=used[1].slice(0,20);
let rows=used.slice(2).filter(r=>r[0]).map(r=>Object.fromEntries(oldHeaders.map((h,i)=>[h,r[i]??''])));

const contacted=new Map([
 ['Deconovo','Email'],['LightArtsy','Email'],['Rawlune','Email'],['Zyvorah','Email'],['Acclaim Lighting','Email'],['FUFU&GAGA','Email']
]);
const appended=[
 {'Brand Name':'Zyvorah','Category':'Home decor & furniture','Official Website':'https://zyvorah.com','Best Verified Contact Email':'hello@zyvorah.com','Alternative Contact Method':'Instagram DM / contact form','Program Type':'General brand outreach','Paid Sponsorship Explicitly Mentioned?':'Unclear','Affiliate Program?':'Unclear','Gifted Product Collaboration?':'Unclear','International Creators Accepted?':'Unclear','US-only Restriction?':'Unclear','Minimum Followers, if stated':'Not stated','Commission Rate, if stated':'Not stated','Contact Person or Department, if stated':'Not stated','Best Outreach Angle for Housora':'a styled-room transformation featuring a focused product story','Short Notes':'Previously contacted from Gmail Sent. Not included in actionable lists.','Priority Score from 1 to 10':0,'Source / Proof URL':'https://zyvorah.com'},
 {'Brand Name':'Acclaim Lighting','Category':'Lighting','Official Website':'https://www.acclaim-lighting.com','Best Verified Contact Email':'sales@acclaim-lighting.com','Alternative Contact Method':'Contact form','Program Type':'General brand outreach','Paid Sponsorship Explicitly Mentioned?':'Unclear','Affiliate Program?':'Unclear','Gifted Product Collaboration?':'Unclear','International Creators Accepted?':'Unclear','US-only Restriction?':'Unclear','Minimum Followers, if stated':'Not stated','Commission Rate, if stated':'Not stated','Contact Person or Department, if stated':'Sales','Best Outreach Angle for Housora':'showing how different lighting choices change the same room','Short Notes':'Previously contacted from Gmail Sent. Not included in actionable lists.','Priority Score from 1 to 10':0,'Source / Proof URL':'https://www.acclaim-lighting.com'},
 {'Brand Name':'FUFU&GAGA','Category':'Furniture & storage','Official Website':'https://www.fufugaga.com','Best Verified Contact Email':'market@fufugaga.com','Alternative Contact Method':'Contact form','Program Type':'General brand outreach','Paid Sponsorship Explicitly Mentioned?':'Unclear','Affiliate Program?':'Unclear','Gifted Product Collaboration?':'Unclear','International Creators Accepted?':'Unclear','US-only Restriction?':'Unclear','Minimum Followers, if stated':'Not stated','Commission Rate, if stated':'Not stated','Contact Person or Department, if stated':'Marketing','Best Outreach Angle for Housora':'a furniture and layout transformation built around storage','Short Notes':'Previously contacted from Gmail Sent. Not included in actionable lists.','Priority Score from 1 to 10':0,'Source / Proof URL':'https://www.fufugaga.com'}
];
for(const a of appended) if(!rows.some(r=>r['Brand Name']===a['Brand Name'])) rows.push(a);

const concepts={
 curtains:'a real-room curtain transformation comparing lengths, fabrics and light control',lighting:'a Reel showing how different lighting changes the mood of the same room',rugs:'the same room styled with different rugs so viewers can compare the impact',wallpaper:'the same room visualized with several wallpaper directions and an audience vote',furniture:'a furniture and layout transformation that makes the space feel more intentional',paint:'a color transformation showing how one palette changes the room',tiles:'a surface makeover comparing tile patterns, scale and grout choices',bathroom:'a bathroom concept transformation focused on finishes and function',kitchen:'a kitchen concept refresh focused on finishes and practical details',storage:'a small-space organization transformation with a clear before and after',bedding:'a bedroom refresh built around color, texture and layering','smart home':'a practical room upgrade showing how the technology improves atmosphere or comfort','interior design app':'a concise room-redesign tutorial using the tool','wall art':'a gallery-wall transformation comparing layouts and scale',hardware:'a detail-led cabinet or door refresh',textiles:'a layered room refresh using texture and color'
};
function concept(cat){const c=String(cat).toLowerCase();for(const [k,v] of Object.entries(concepts))if(c.includes(k))return v;return 'a transformation-style Reel showing how the product changes the feel of a room';}
const openings=[
 n=>`Hi ${n} team, I run Housora, an interior design and home-inspiration page built around strong room transformations.`,
 n=>`Hello ${n} team, I’m the creator behind Housora, where I share interior ideas and transformation-led home content.`,
 n=>`Hi ${n}, I create room-transformation and home-inspiration content through Housora for an audience with a strong US/UK segment.`
];
function message(r,i){const paid=r['Paid Sponsorship Explicitly Mentioned?']==='Yes';const ask=paid?'I’m interested in exploring a paid collaboration through your creator program.':'I’d love to explore a creator partnership with your team.';const proof=i%3===0?'Housora’s Instagram generated more than 1.7M views in the last 30 days. ':i%3===1?'My audience includes a strong US/UK segment and is heavily female on Instagram. ':'';return `${openings[i%openings.length](r['Brand Name'])} ${ask} A natural concept would be ${concept(r['Category'])}. ${proof}If the idea is relevant, I can share audience insights, recent performance and a concise content proposal.`;}

rows.forEach((r,i)=>{
 r['Already Contacted']=contacted.has(r['Brand Name'])?'YES':'NO';
 r['Contacted Via']=contacted.get(r['Brand Name'])||'';
 r['Suggested First Message']=message(r,i);
 if(r['Brand Name']==='LightArtsy'){
   r['Best Verified Contact Email']='support@lightartsy.com'; r['Alternative Contact Method']='Contact form / support@lightartsy.com';
   r['Short Notes']='Creator program remains live, but creators@lightartsy.com bounced twice with mailbox unavailable. Official site publishes support@lightartsy.com as the current general contact. Already contacted; excluded from actionable tabs.';
   r['Source / Proof URL']='https://lightartsy.com/collections/entry-foyer-lighting';
 }
 if(r['Brand Name']==='Deconovo'){
   r['Best Verified Contact Email']='partnership@deconovo.com'; r['Contact Person or Department, if stated']='Creator Partnerships';
   r['International Creators Accepted?']='Unclear'; r['US-only Restriction?']='No';
   r['Short Notes']='Official page: U.S. creators preferred for gifting; affiliate program is open globally via Awin. Already contacted by email; excluded from actionable tabs.';
 }
 if(r['Brand Name']==='Rawlune') r['Short Notes']='Program is primarily focused on the U.S. market. Already contacted by email; excluded from actionable tabs.';
});
rows.sort((a,b)=>(b['Priority Score from 1 to 10']||0)-(a['Priority Score from 1 to 10']||0)||a['Brand Name'].localeCompare(b['Brand Name']));
const headers=[...oldHeaders.slice(0,19),'Already Contacted','Contacted Via',oldHeaders[19]];
const fresh=rows.filter(r=>r['Already Contacted']==='NO');
const configs=[
 ['Top Targets',fresh.slice(0,30)],['All 120+ Brands',rows],['Paid Collab Programs',fresh.filter(r=>r['Paid Sponsorship Explicitly Mentioned?']==='Yes')],
 ['Email Outreach',fresh.filter(r=>r['Best Verified Contact Email'])],['International Friendly',fresh.filter(r=>r['US-only Restriction?']!=='Yes'&&r['International Creators Accepted?']!=='No')],
 ['US Only / Restricted',fresh.filter(r=>r['US-only Restriction?']==='Yes'||r['International Creators Accepted?']==='No')],['DM / Contact Form Only',fresh.filter(r=>!r['Best Verified Contact Email'])]
];
const widths=[20,20,27,34,29,25,31,17,14,18,18,16,18,18,23,40,46,12,35,18,18,60];
for(const [idx,[name,data]] of configs.entries()){
 const sh=wb.worksheets.getItem(name); for(const t of [...sh.tables.items]) t.delete();
 const ur=sh.getUsedRange(); if(ur) ur.clear({applyTo:'all'}); sh.getRange('A1:V1').unmerge();
 sh.showGridLines=false; sh.freezePanes.unfreeze(); sh.freezePanes.freezeRows(2); sh.freezePanes.freezeColumns(2);
 sh.getRange('A1:V1').merge(); sh.getCell(0,0).values=[[`${name} — Housora Brand Outreach Database`]];
 sh.getCell(0,0).format={fill:'#173F3A',font:{bold:true,color:'#FFFFFF',size:15},verticalAlignment:'center'}; sh.getRange('A1:V1').format.rowHeight=30;
 sh.getRangeByIndexes(1,0,1,headers.length).values=[headers]; sh.getRangeByIndexes(1,0,1,headers.length).format={fill:'#DCEBE7',font:{bold:true,color:'#173F3A'},wrapText:true,verticalAlignment:'center',borders:{bottom:{style:'medium',color:'#79A89D'}}}; sh.getRange('A2:V2').format.rowHeight=48;
 if(data.length){sh.getRangeByIndexes(2,0,data.length,headers.length).values=data.map(r=>headers.map(h=>r[h]??'')); const body=sh.getRangeByIndexes(2,0,data.length,headers.length); body.format={font:{size:10,color:'#253330'},verticalAlignment:'top',wrapText:true,borders:{insideHorizontal:{style:'thin',color:'#E4E8E7'}}}; sh.getRangeByIndexes(2,17,data.length,1).conditionalFormats.add('colorScale',{colors:['#FDE2E2','#FFF1C9','#CDEBDD'],thresholds:['min','50%','max']}); for(const c of [2,3,18])sh.getRangeByIndexes(2,c,data.length,1).format={font:{color:'#176C61',underline:true,size:10},wrapText:true,verticalAlignment:'top'}; const table=sh.tables.add(`A2:V${data.length+2}`,true,`RevisedT${idx+1}`);table.style='TableStyleMedium4';table.showBandedRows=true;}
 widths.forEach((w,c)=>sh.getRangeByIndexes(0,c,Math.max(3,data.length+2),1).format.columnWidth=w); if(data.length)sh.getRangeByIndexes(2,0,data.length,headers.length).format.rowHeight=72;
}
const oldContact=wb.worksheets.getItemOrNullObject?wb.worksheets.getItemOrNullObject('Already Contacted'):null;
let cs; try{cs=wb.worksheets.getItem('Already Contacted');}catch{cs=wb.worksheets.add('Already Contacted');}
if(cs.getUsedRange())cs.getUsedRange().clear({applyTo:'all'}); cs.showGridLines=false; cs.freezePanes.freezeRows(1);
const cHeads=['Brand Name','Category','Contacted Via','Email Used','Status / Note']; const cRows=rows.filter(r=>r['Already Contacted']==='YES').map(r=>[r['Brand Name'],r['Category'],'Email',r['Best Verified Contact Email'],r['Short Notes']]);
cs.getRangeByIndexes(0,0,1,5).values=[cHeads];cs.getRangeByIndexes(1,0,cRows.length,5).values=cRows;cs.getRange('A1:E1').format={fill:'#8B3A3A',font:{bold:true,color:'#FFFFFF'},wrapText:true};cs.getRange(`A2:E${cRows.length+1}`).format={wrapText:true,verticalAlignment:'top'};[22,22,16,30,70].forEach((w,c)=>cs.getRangeByIndexes(0,c,cRows.length+1,1).format.columnWidth=w);cs.tables.add(`A1:E${cRows.length+1}`,true,'AlreadyContactedT').style='TableStyleMedium3';
await fs.mkdir('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach',{recursive:true});
const out=await SpreadsheetFile.exportXlsx(wb);await out.save(outputPath);
console.log(JSON.stringify({totalRows:rows.length,newActionable:fresh.length,removedFromActionable:rows.length-fresh.length,top20:fresh.slice(0,20).map(r=>({brand:r['Brand Name'],method:r['Best Verified Contact Email']?'Email':r['Creator / Influencer / Partnership Program URL']?'Apply':'DM / contact form',paid:r['Paid Sponsorship Explicitly Mentioned?']})),tabs:configs.map(x=>[x[0],x[1].length])}));
for(const [name] of [...configs,['Already Contacted',[]]]){const img=await wb.render({sheetName:name,range:name==='Already Contacted'?'A1:E8':'A1:V12',scale:.6,format:'png'});await fs.writeFile(`C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/revised_${name.replace(/[^a-z0-9]+/gi,'_')}.png`,new Uint8Array(await img.arrayBuffer()));}
console.log((await wb.inspect({kind:'table',range:'All 120+ Brands!A1:V10',include:'values,formulas',tableMaxRows:10,tableMaxCols:22,maxChars:5000})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:100},summary:'final formula scan'})).ndjson);
