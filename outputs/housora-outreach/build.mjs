import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const raw = `Wayfair|Furniture & decor|https://www.wayfair.com
Ruggable|Rugs|https://ruggable.co.uk
Deconovo|Curtains|https://deconovo.com
LightArtsy|Lighting|https://lightartsy.com
Plaid Crafts|Decorative paint & DIY|https://plaidonline.com
Lamps Plus|Lighting & furniture|https://www.lampsplus.com
IKEA|Furniture & decor|https://www.ikea.com
Rawlune|Home decor|https://www.rawlune.com
Lumira Furniture|Furniture|https://lumirafurn.com
Decor On Decor|Home decor|https://decorondecor.com
Fredesigner|Furniture & decor|https://www.fredesigner.com
Arteverk|Rugs|https://www.arteverk.com
Lowe's|Home improvement|https://www.lowes.com
Benjamin Moore|Paint|https://www.benjaminmoore.com
Wallpaperdirect|Wallpaper|https://www.wallpaperdirect.com
Article|Furniture & decor|https://www.article.com
West Elm|Furniture & decor|https://www.westelm.com
Pottery Barn|Furniture & decor|https://www.potterybarn.com
CB2|Furniture & decor|https://www.cb2.com
Crate & Barrel|Furniture & decor|https://www.crateandbarrel.com
Burrow|Furniture|https://burrow.com
Joybird|Furniture|https://joybird.com
Castlery|Furniture|https://www.castlery.com
Albany Park|Furniture|https://www.albanypark.com
Sundays|Furniture|https://www.sundays-company.com
Sabai|Furniture|https://sabai.design
Floyd|Furniture|https://floydhome.com
Inside Weather|Furniture|https://insideweather.com
Maiden Home|Furniture|https://www.maidenhome.com
Sixpenny|Furniture|https://sixpenny.com
Lulu and Georgia|Furniture & decor|https://www.luluandgeorgia.com
McGee & Co.|Furniture & decor|https://www.mcgeeandco.com
Arhaus|Furniture & decor|https://www.arhaus.com
RH|Furniture & decor|https://rh.com
Design Within Reach|Furniture|https://www.dwr.com
HAY|Furniture & accessories|https://www.hay.com
Herman Miller|Furniture|https://www.hermanmiller.com
Knoll|Furniture|https://www.knoll.com
Kartell|Furniture & lighting|https://www.kartell.com
Vitra|Furniture & accessories|https://www.vitra.com
USM|Modular furniture|https://www.usm.com
Muuto|Furniture & lighting|https://www.muuto.com
Ferm Living|Furniture & decor|https://fermliving.com
Menu / Audo Copenhagen|Furniture & lighting|https://audocph.com
Hem|Furniture|https://hem.com
Tom Dixon|Lighting & accessories|https://www.tomdixon.net
Flos|Lighting|https://flos.com
Artemide|Lighting|https://www.artemide.com
Anglepoise|Lighting|https://www.anglepoise.com
GUBI|Furniture & lighting|https://gubi.com
Louis Poulsen|Lighting|https://www.louispoulsen.com
Gantri|Lighting|https://www.gantri.com
Schoolhouse|Lighting & decor|https://www.schoolhouse.com
Rejuvenation|Lighting & hardware|https://www.rejuvenation.com
Mitzi|Lighting|https://mitzi.com
Tala|Lighting|https://tala.co.uk
Pooky|Lighting|https://www.pooky.com
Lights.com|Lighting|https://www.lights.com
Lumens|Lighting & furniture|https://www.lumens.com
2Modern|Furniture & lighting|https://www.2modern.com
YLighting|Lighting|https://www.ylighting.com
Rugs USA|Rugs|https://www.rugsusa.com
Revival Rugs|Rugs|https://www.revivalrugs.com
Rifle Paper Co.|Wallpaper & decor|https://riflepaperco.com
Loloi Rugs|Rugs|https://www.loloirugs.com
The Rug Company|Rugs|https://www.therugcompany.com
RugVista|Rugs|https://www.rugvista.com
Benisouk|Moroccan rugs|https://benisouk.com
Salam Hello|Moroccan rugs|https://salamhello.com
Beni Rugs|Moroccan rugs|https://www.benirugs.com
Cold Picnic|Rugs & textiles|https://coldpicnic.com
Tumble|Rugs|https://www.tumbleliving.com
RugPadUSA|Rug pads|https://www.rugpadusa.com
Flor|Modular flooring|https://www.flor.com
Chilewich|Floor mats & textiles|https://www.chilewich.com
Tempaper|Wallpaper|https://tempaper.com
Spoonflower|Wallpaper & textiles|https://www.spoonflower.com
Graham & Brown|Wallpaper & paint|https://www.grahambrown.com
Milton & King|Wallpaper|https://www.miltonandking.com
Wallshoppe|Wallpaper|https://www.wallshoppe.com
Chasing Paper|Wallpaper|https://chasingpaper.com
WallPops|Wallpaper|https://www.wallpops.com
York Wallcoverings|Wallpaper|https://www.yorkwallcoverings.com
Cole & Son|Wallpaper|https://cole-and-son.com
Sanderson Design Group|Wallpaper & textiles|https://sandersondesigngroup.com
Morris & Co.|Wallpaper & textiles|https://morrisandco.sandersondesigngroup.com
Borastapeter|Wallpaper|https://www.borastapeter.com
Photowall|Wallpaper & wall art|https://www.photowall.com
Rebel Walls|Wallpaper|https://rebelwalls.com
Wallsauce|Wall murals|https://www.wallsauce.com
Farrow & Ball|Paint & wallpaper|https://www.farrow-ball.com
Clare|Paint|https://www.clare.com
Backdrop|Paint & wallpaper|https://www.backdrophome.com
Lick|Paint & wallpaper|https://www.lick.com
Little Greene|Paint & wallpaper|https://www.littlegreene.com
Sherwin-Williams|Paint|https://www.sherwin-williams.com
Behr|Paint|https://www.behr.com
Valspar|Paint|https://www.valspar.com
Dulux|Paint|https://www.dulux.co.uk
COAT Paints|Paint|https://coatpaints.com
Edward Bulmer Natural Paint|Paint|https://www.edwardbulmerpaint.co.uk
Fireclay Tile|Tiles|https://www.fireclaytile.com
Heath Ceramics|Tiles & ceramics|https://www.heathceramics.com
Clé Tile|Tiles|https://www.cletile.com
TileBar|Tiles|https://www.tilebar.com
Porcelanosa|Tiles & fixtures|https://www.porcelanosa.com
Marazzi|Tiles|https://www.marazziusa.com
Bedrosians|Tiles|https://www.bedrosians.com
Mandarin Stone|Tiles|https://www.mandarinstone.com
Zia Tile|Tiles|https://www.ziatile.com
Cosentino|Surfaces|https://www.cosentino.com
Caesarstone|Surfaces|https://www.caesarstoneus.com
Cambria|Surfaces|https://www.cambriausa.com
Kohler|Bathroom & kitchen fixtures|https://www.kohler.com
Moen|Bathroom & kitchen fixtures|https://www.moen.com
Delta Faucet|Bathroom & kitchen fixtures|https://www.deltafaucet.com
Grohe|Bathroom & kitchen fixtures|https://www.grohe.com
Hansgrohe|Bathroom & kitchen fixtures|https://www.hansgrohe.com
Brizo|Bathroom & kitchen fixtures|https://www.brizo.com
Rohl|Bathroom & kitchen fixtures|https://www.houseofrohl.com
TOTO|Bathroom fixtures|https://www.totousa.com
Duravit|Bathroom fixtures|https://www.duravit.com
Villeroy & Boch|Bathroom & tableware|https://www.villeroy-boch.com
Native Trails|Kitchen & bath fixtures|https://www.nativetrailshome.com
Signature Hardware|Fixtures & hardware|https://www.signaturehardware.com
Emtek|Decorative hardware|https://www.emtek.com
Plank Hardware|Decorative hardware|https://plankhardware.com
Corston|Decorative hardware|https://www.corston.com
Buster + Punch|Hardware & lighting|https://www.busterandpunch.com
The Container Store|Storage & organization|https://www.containerstore.com
Open Spaces|Storage & organization|https://www.getopenspaces.com
Yamazaki Home|Storage & organization|https://theyamazakihome.com
Elfa|Storage|https://elfa.com
California Closets|Storage|https://www.californiaclosets.com
The Home Edit|Storage & organization|https://thehomeedit.com
Neat Method|Organization|https://neatmethod.com
Umbra|Home accessories|https://www.umbra.com
Hawkins New York|Home accessories|https://www.hawkinsnewyork.com
Maison Flaneur|Artisan home decor|https://www.maisonflaneur.com
The Citizenry|Artisan home decor|https://www.the-citizenry.com
St. Frank|Artisan home decor|https://www.stfrank.com
Goodee|Artisan home decor|https://www.goodeeworld.com
Novica|Artisan home decor|https://www.novica.com
Etsy|Artisan home decor marketplace|https://www.etsy.com
Society6|Wall art & decor|https://society6.com
Desenio|Wall art|https://desenio.com
JUNIQE|Wall art|https://www.juniqe.com
Minted|Wall art & decor|https://www.minted.com
Fy!|Home decor marketplace|https://www.iamfy.co
Marta Orozco|Wall art|https://www.martaorozco.com
Parachute|Bedding & textiles|https://www.parachutehome.com
Brooklinen|Bedding & textiles|https://www.brooklinen.com
Piglet in Bed|Bedding & textiles|https://www.pigletinbed.com
Cultiver|Bedding & textiles|https://cultiver.com
The White Company|Bedding & decor|https://www.thewhitecompany.com
LinenMe|Home textiles|https://www.linenme.com
Quince|Bedding & decor|https://www.quince.com
Coyuchi|Bedding & textiles|https://www.coyuchi.com
MagicLinen|Bedding & textiles|https://magiclinen.com
The Company Store|Bedding|https://www.thecompanystore.com
Pepper Home|Curtains & textiles|https://pepper-home.com
Everhem|Curtains|https://www.everhem.com
Half Price Drapes|Curtains|https://www.halfpricedrapes.com
The Shade Store|Window treatments|https://www.theshadestore.com
Blinds.com|Window treatments|https://www.blinds.com
SmartWings|Smart window treatments|https://www.smartwingshome.com
SwitchBot|Smart-home interiors|https://www.switch-bot.com
Philips Hue|Smart lighting|https://www.philips-hue.com
Nanoleaf|Smart lighting|https://nanoleaf.me
Govee|Smart lighting|https://www.govee.com
Caseta by Lutron|Smart lighting|https://www.casetawireless.com
Eve|Smart home|https://www.evehome.com
Planner 5D|Interior design app|https://planner5d.com
Homestyler|Interior design app|https://www.homestyler.com
Houzz|Interior design platform|https://www.houzz.com
Canva|Design tool|https://www.canva.com
Floorplanner|Interior design app|https://floorplanner.com
RoomSketcher|Interior design app|https://www.roomsketcher.com
Morpholio Board|Interior design app|https://www.morpholioapps.com
Milanote|Design planning tool|https://milanote.com
SketchUp|3D design tool|https://www.sketchup.com
Roomvo|Room visualization|https://www.roomvo.com`.trim();

const brands = raw.split('\n').map(x=>{const [name,category,website]=x.split('|');return {name,category,website};});
const special={
 'Wayfair':{program:'https://www.wayfair.com/m/creators',type:'Creator + affiliate; paid opportunities for high performers',paid:'Yes',aff:'Yes',gift:'Unclear',intl:'Unclear',us:'Unclear',proof:'https://www.wayfair.com/m/creators',score:10,alt:'Creator application'},
 'Deconovo':{program:'https://deconovo.com/pages/creator-partnership',type:'Gifted + paid + affiliate',paid:'Yes',aff:'Yes',gift:'Yes',intl:'Unclear',us:'No',min:'50K+ for paid; affiliate open to all',proof:'https://deconovo.com/pages/creator-partnership',score:10,alt:'Creator application'},
 'LightArtsy':{program:'https://lightartsy.com/pages/influencer-program',type:'Gifted + paid + affiliate',paid:'Yes',aff:'Yes',gift:'Yes',intl:'Unclear',us:'No',min:'5K+',email:'creators@lightartsy.com',dept:'Creator Partnerships',proof:'https://lightartsy.com/pages/influencer-program',score:10,alt:'Email'},
 'Plaid Crafts':{program:'https://plaidonline.com/influencer-program',type:'Influencer; gifted + paid campaigns',paid:'Yes',aff:'Unclear',gift:'Yes',intl:'Unclear',us:'Unclear',proof:'https://plaidonline.com/influencer-program',score:10,alt:'Application form'},
 'Rawlune':{program:'https://www.rawlune.com/pages/collaborate-with-rawlune',type:'Gifted + paid + affiliate',paid:'Yes',aff:'Yes',gift:'Yes',intl:'Unclear',us:'Yes',proof:'https://www.rawlune.com/pages/collaborate-with-rawlune',score:6,alt:'Creator application',notes:'Program says it is primarily focused on the U.S. market.'},
 'Lumira Furniture':{program:'https://lumirafurn.com/pages/creator-program',type:'Creator affiliate + path to paid usage',paid:'Yes',aff:'Yes',gift:'Unclear',intl:'Unclear',us:'Unclear',commission:'Up to 8%',proof:'https://lumirafurn.com/pages/creator-program',score:9,alt:'Creator application'},
 'Decor On Decor':{program:'https://decorondecor.com/pages/collab',type:'Creator affiliate; free products and paid opportunities',paid:'Yes',aff:'Yes',gift:'Yes',intl:'Unclear',us:'Unclear',commission:'15%',proof:'https://decorondecor.com/pages/collab',score:9,alt:'Collab application'},
 'Fredesigner':{program:'https://www.fredesigner.com/pages/creator-affiliate-program',type:'Paid creator + affiliate + usage rights',paid:'Yes',aff:'Yes',gift:'Unclear',intl:'Unclear',us:'Unclear',proof:'https://www.fredesigner.com/pages/creator-affiliate-program',score:9,alt:'Creator application'},
 'Arteverk':{program:'https://www.arteverk.com/pages/brand-ambassadors',type:'Ambassador + affiliate',paid:'No',aff:'Yes',gift:'Unclear',intl:'Unclear',us:'Unclear',proof:'https://www.arteverk.com/pages/brand-ambassadors',score:8,alt:'Ambassador application'},
 "Lowe's":{program:'https://www.lowes.com/l/creator',type:'Creator / influencer affiliate',paid:'Unclear',aff:'Yes',gift:'Unclear',intl:'No',us:'Yes',proof:'https://www.lowes.com/l/creator',score:5,alt:'Creator application',notes:'U.S.-market program; treat as restricted for Morocco-based outreach.'},
 'Ruggable':{program:'https://ruggable.co.uk/pages/creators',type:'Creator collaboration',paid:'Unclear',aff:'No',gift:'Yes',intl:'No',us:'No',proof:'https://ruggable.co.uk/pages/creators',score:9,alt:'Creator application',notes:'UK page explicitly seeks UK-based creators.'},
 'Lamps Plus':{program:'https://www.lampsplus.com/partners/',type:'Gifted influencer + affiliate + strategic partnerships',paid:'Unclear',aff:'Yes',gift:'Yes',intl:'No',us:'Yes',proof:'https://www.lampsplus.com/partners/',score:5,alt:'Partnership page',notes:'Affiliate program explicitly U.S.-only in eligible states.'},
 'IKEA':{program:'https://www.ikea.com/us/en/customer-service/knowledge/articles/61b90c27-99e1-4104-g950-832f428e7dgb.html',type:'Local influencer collaborations',paid:'Unclear',aff:'Yes',gift:'Unclear',intl:'Unclear',us:'Unclear',commission:'Up to 5% on IKEA Spain affiliate page',proof:'https://www.ikea.com/es/en/campaigns/home-fanatic-recommend-ikea-pub9a336260/',score:9,alt:'Instagram DM',notes:'Programs are country-specific; contact the relevant national IKEA account.'},
 'Benjamin Moore':{type:'Direct PR outreach',paid:'Unclear',aff:'No',gift:'Unclear',intl:'Unclear',us:'No',email:'pressrequests@benjaminmoore.com',dept:'Corporate Communications',proof:'https://www.benjaminmoore.com/en-us/press/benjamin-moore-fifth-annual-contractor-appreciation-month',score:9,alt:'Email'},
 'Wallpaperdirect':{type:'Direct outreach',paid:'Unclear',aff:'Unclear',gift:'Unclear',intl:'Yes',us:'No',email:'help@wallpaperdirect.com',dept:'Customer Services (routing contact)',proof:'https://blog.wallpaperdirect.com/fruit-wallpaper-design-the-new-still-life/',score:9,alt:'Instagram DM @wallpaperdirect'},
 'Article':{program:'https://www.article.com/help-center',type:'Partnership inquiry / direct outreach',paid:'Unclear',aff:'Unclear',gift:'Unclear',intl:'No',us:'No',proof:'https://www.article.com/help-center',score:8,alt:'Contact form',notes:'Ships primarily in North America; content concept should not depend on product delivery to Morocco.'}
};
const angles={
 'Rugs':'washability, sizing and before/after floor styling','Furniture':'a room-layout transformation Reel comparing configurations','Lighting':'a lighting-layer makeover showing mood changes','Curtains':'a window makeover comparing fabric, length and light control','Wallpaper':'a wall-transformation Reel with audience voting','Paint':'a color-palette transformation with before/after renders','Tiles':'a surface makeover comparing patterns and grout choices','Bedding':'a bedroom refresh focused on texture and color','Storage':'a small-space organization transformation','Smart':'a practical smart-room upgrade','Interior design app':'a screen-recorded room redesign tutorial','Home decor':'a styled-room transformation with audience voting','Bathroom':'a bathroom concept makeover','Kitchen':'a kitchen concept makeover','Wall art':'a gallery-wall layout transformation','Hardware':'a detail-led cabinet or door refresh','Home textiles':'a texture-layering room refresh'};
function angle(cat){for(const [k,v] of Object.entries(angles))if(cat.includes(k))return v;return 'a transformation-style Reel showing how the product changes the room';}
let rows=brands.map((b,i)=>{const s=special[b.name]||{}; const p=s.score??Math.max(5,8-Math.floor(i/45)); const a=angle(b.category);return {
 'Brand Name':b.name,'Category':b.category,'Official Website':b.website,'Creator / Influencer / Partnership Program URL':s.program||'',
 'Best Verified Contact Email':s.email||'','Alternative Contact Method':s.alt||'Contact form or Instagram DM','Program Type':s.type||'Direct outreach target — no public creator program verified',
 'Paid Sponsorship Explicitly Mentioned?':s.paid||'Unclear','Affiliate Program?':s.aff||'Unclear','Gifted Product Collaboration?':s.gift||'Unclear','International Creators Accepted?':s.intl||'Unclear','US-only Restriction?':s.us||'Unclear',
 'Minimum Followers, if stated':s.min||'Not stated','Commission Rate, if stated':s.commission||'Not stated','Contact Person or Department, if stated':s.dept||'Not stated',
 'Best Outreach Angle for Housora':a,'Short Notes':s.notes||'Strong category fit; creator terms were not confirmed on a public official page. Pitch directly and confirm geography, compensation, usage rights and shipping.',
 'Priority Score from 1 to 10':p,'Source / Proof URL':s.proof||b.website,
 'Suggested First Message':`Hi ${b.name} team, I run Housora, an interior design content page focused on room transformations and home inspiration. I’d like to explore a paid collaboration around ${a}. I’d be happy to share audience insights and recent performance.`};});
rows.sort((a,b)=>b['Priority Score from 1 to 10']-a['Priority Score from 1 to 10']||a['Brand Name'].localeCompare(b['Brand Name']));
const headers=Object.keys(rows[0]);
const wb=Workbook.create();
const configs=[
 ['Top Targets',rows.slice(0,30)],['All 120+ Brands',rows],['Paid Collab Programs',rows.filter(r=>r['Paid Sponsorship Explicitly Mentioned?']==='Yes')],
 ['Email Outreach',rows.filter(r=>r['Best Verified Contact Email'])],['International Friendly',rows.filter(r=>r['US-only Restriction?']!=='Yes'&&r['International Creators Accepted?']!=='No')],
 ['US Only / Restricted',rows.filter(r=>r['US-only Restriction?']==='Yes'||r['International Creators Accepted?']==='No')],['DM / Contact Form Only',rows.filter(r=>!r['Best Verified Contact Email'])]
];
const widths=[20,20,27,34,29,25,31,17,14,18,18,16,18,18,23,40,46,12,35,58];
for(const [idx,[name,data]] of configs.entries()){
 const sh=wb.worksheets.add(name); sh.showGridLines=false; sh.freezePanes.freezeRows(2); sh.freezePanes.freezeColumns(2);
 sh.getRangeByIndexes(0,0,1,headers.length).merge(); sh.getCell(0,0).values=[[`${name} — Housora Brand Outreach Database`]];
 sh.getCell(0,0).format={fill:'#173F3A',font:{bold:true,color:'#FFFFFF',size:15},verticalAlignment:'center'}; sh.getRange(`A1:T1`).format.rowHeight=30;
 sh.getRangeByIndexes(1,0,1,headers.length).values=[headers];
 sh.getRangeByIndexes(1,0,1,headers.length).format={fill:'#DCEBE7',font:{bold:true,color:'#173F3A'},wrapText:true,verticalAlignment:'center',borders:{bottom:{style:'medium',color:'#79A89D'}}};
 sh.getRange(`A2:T2`).format.rowHeight=44;
 if(data.length){sh.getRangeByIndexes(2,0,data.length,headers.length).values=data.map(r=>headers.map(h=>r[h]));
   const body=sh.getRangeByIndexes(2,0,data.length,headers.length); body.format={font:{size:10,color:'#253330'},verticalAlignment:'top',wrapText:true,borders:{insideHorizontal:{style:'thin',color:'#E4E8E7'}}};
   sh.getRangeByIndexes(2,17,data.length,1).format.numberFormat='0';
   sh.getRangeByIndexes(2,17,data.length,1).conditionalFormats.add('colorScale',{colors:['#FDE2E2','#FFF1C9','#CDEBDD'],thresholds:['min','50%','max']});
   for(const col of [2,3,18]) sh.getRangeByIndexes(2,col,data.length,1).format={font:{color:'#176C61',underline:true,size:10},wrapText:true,verticalAlignment:'top'};
   const table=sh.tables.add(`A2:T${data.length+2}`,true,`T${idx+1}`); table.style='TableStyleMedium4'; table.showBandedRows=true;
 }
 widths.forEach((w,c)=>sh.getRangeByIndexes(0,c,Math.max(3,data.length+2),1).format.columnWidth=w);
 sh.getRangeByIndexes(2,0,Math.max(1,data.length),headers.length).format.rowHeight=54;
}
await fs.mkdir('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach',{recursive:true});
const out=await SpreadsheetFile.exportXlsx(wb); await out.save('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Verified_Brand_Outreach_Database.xlsx');
console.log(JSON.stringify({count:rows.length,sheets:configs.map(x=>[x[0],x[1].length]),top10:rows.slice(0,10).map(x=>x['Brand Name'])}));
for(const [name] of configs){const img=await wb.render({sheetName:name,range:'A1:T12',scale:0.65,format:'png'});await fs.writeFile(`C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/${name.replace(/[^a-z0-9]+/gi,'_')}.png`,new Uint8Array(await img.arrayBuffer()));}
const inspect=await wb.inspect({kind:'table',range:'Top Targets!A1:T12',include:'values,formulas',tableMaxRows:12,tableMaxCols:20,maxChars:4000}); console.log(inspect.ndjson);
const errs=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:100},summary:'formula scan'}); console.log(errs.ndjson);
