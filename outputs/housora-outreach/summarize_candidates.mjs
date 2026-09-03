import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/final_exhaustive_research.json','utf8'));
const badDomain=/(shopify|sentry|wix|cloudflare|amazon|google|schema|example|email\.com|address\.com|domain\.com|godaddy|zendesk|gorgias|recharge|yotpo|klaviyo|facebook|instagram|tiktok|youtube|pinterest|linkedin|\.(png|jpe?g|gif|svg|webp|ico)$)/i;
const badLocal=/^(privacy|legal|careers?|jobs?|wholesale|orders?|returns?|billing|accounts?|webmaster|security|abuse|gdpr|data|dpo|webtest|test|name|yourname|example|email)$/i;
let lines=['Brand\tEmail\tQuality\tSource\tContext'];
for(const r of data){let n=0;for(const x of r.found||[]){const [local,dom]=x.email.split('@');if(!dom||badDomain.test(dom)||badLocal.test(local)||/^u003e/.test(local))continue;lines.push([r.brand,x.email,x.quality,x.source,(x.context||'').replace(/[\t\r\n]+/g,' ').slice(0,350)].join('\t'));if(++n>=8)break}}
await fs.writeFile('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/candidate_review.tsv',lines.join('\n'));
console.log({rows:lines.length-1});
