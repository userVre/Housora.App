// Explicitly authorized one-off smoke checks. The ledger prevents resubmission.
const { loadEnvConfig } = require('@next/env');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const dir = path.join(process.cwd(), 'outputs', 'provider-check-2026-09-04');
const ledgerPath = path.join(dir, 'results.json');
let ledger = {};
const save = () => fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2));
const report = (name, value) => { ledger[name] = value; console.log(name, JSON.stringify(value)); return save(); };
async function run(name, fn) {
  if (ledger[name] && !(process.argv.includes('--network-retry') && ledger[name].reason === 'request_failed' && ledger[name].errorType === 'TypeError')) { console.log(name, 'Already attempted; not submitting again.'); return; }
  await report(name, { status: 'attempt_started', at: new Date().toISOString() });
  try { await fn(); } catch (e) { await report(name, { status: 'failed', reason: e.name === 'TimeoutError' ? 'timeout_outcome_unknown' : 'request_failed', errorType: e.name, networkCode: e.cause?.code || null }); }
}
async function main() {
  await fs.mkdir(dir, { recursive: true });
  ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8').catch(() => '{}'));
  const input = await sharp('public/pictures/interior-design-cover.png').resize(1024,1024,{fit:'inside'}).jpeg({quality:82}).toBuffer();
  const image = `data:image/jpeg;base64,${input.toString('base64')}`;
  const which = process.argv[2];
  if (which === 'grok') await run('grok', async () => {
    const key = process.env.GROK_IMAGE_KEY || process.env.XAI_API_KEY;
    if (!key) return report('grok', {status:'missing_configuration'});
    const response = await fetch('https://api.x.ai/v1/images/edits', {method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'grok-imagine-image-2.0',image:{url:image,type:'image_url'},prompt:'Change only the sofa upholstery to muted sage green. Preserve the room architecture, furniture positions, lighting, camera angle and all other objects.',n:1}),signal:AbortSignal.timeout(285000)});
    const body = await response.json().catch(()=>({}));
    const result = body.data?.[0];
    await report('grok',{status:response.ok && Boolean(result?.url || result?.b64_json)?'success':'failed',httpStatus:response.status,errorCode:body.error?.code || body.code || null,hasImage:Boolean(result?.url || result?.b64_json)});
    if (result?.b64_json) await fs.writeFile(path.join(dir,'grok-edit.png'),Buffer.from(result.b64_json,'base64'));
    else if (result?.url) { const asset=await fetch(result.url,{signal:AbortSignal.timeout(60000)}); if(asset.ok) await fs.writeFile(path.join(dir,'grok-edit.png'),Buffer.from(await asset.arrayBuffer())); }
  });
  if (which === 'sam') await run('sam', async () => {
    if (!process.env.MODAL_SAM_ENDPOINT || !process.env.MODAL_PROXY_KEY || !process.env.MODAL_PROXY_SECRET) return report('sam',{status:'missing_configuration'});
    const response=await fetch(process.env.MODAL_SAM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Modal-Key':process.env.MODAL_PROXY_KEY,'Modal-Secret':process.env.MODAL_PROXY_SECRET},body:JSON.stringify({image,auto_detect:true,mode:'Interior',prompt:'',max_masks:8,threshold:0.5}),signal:AbortSignal.timeout(285000)});
    const body=await response.json().catch(()=>({}));
    const objects=Array.isArray(body.objects)?body.objects:[];
    await report('sam',{status:response.ok && objects.length?'success':'failed',httpStatus:response.status,autoDetect:body.auto_detect===true,objects:objects.map(o=>({label:o.label,hasMask:!!o.mask,hasThumbnail:!!o.thumbnail}))});
    const item=objects.find(o=>/chair|sofa|table/i.test(o.label) && o.thumbnail);
    if(item) await fs.writeFile(path.join(dir,'furniture.png'),Buffer.from(item.thumbnail.split(',')[1],'base64'));
  });
  if (which === 'tripo') await run('tripo', async () => {
    const key=process.env.TRIPO_API_KEY;
    if(!key) return report('tripo',{status:'missing_configuration'});
    let furniture; try { furniture=await fs.readFile(path.join(dir,'furniture.png')); } catch { return report('tripo',{status:'blocked_no_isolated_furniture_image',submitted:false}); }
    const form=new FormData(); form.append('file',new Blob([furniture],{type:'image/png'}),'furniture.png');
    const uploaded=await fetch('https://api.tripo3d.ai/v2/openapi/upload',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form,signal:AbortSignal.timeout(60000)});
    const upload=await uploaded.json().catch(()=>({}));
    if(!uploaded.ok || !upload.data?.image_token) return report('tripo',{status:'upload_failed',httpStatus:uploaded.status,code:upload.code,submitted:false});
    const response=await fetch('https://api.tripo3d.ai/v2/openapi/task',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({type:'image_to_model',model_version:'v3.1-20260211',file:{type:'png',file_token:upload.data.image_token},texture:true,pbr:true,face_limit:10000,enable_image_autofix:true}),signal:AbortSignal.timeout(60000)});
    const body=await response.json().catch(()=>({}));
    await report('tripo',{status:response.ok && body.data?.task_id?'submitted':'failed',httpStatus:response.status,code:body.code,taskId:body.data?.task_id || null});
  });
  if(which==='tripo-status' && ledger.tripo?.taskId) {
    const response=await fetch(`https://api.tripo3d.ai/v2/openapi/task/${encodeURIComponent(ledger.tripo.taskId)}`,{headers:{Authorization:`Bearer ${process.env.TRIPO_API_KEY}`},signal:AbortSignal.timeout(30000)});
    const body=await response.json().catch(()=>({}));
    const data=body.data || {};
    await report('tripo',{...ledger.tripo,status:data.status || 'poll_failed',progress:data.progress,httpStatus:response.status,hasModel:!!(data.output?.pbr_model || data.output?.model)});
    const url=data.output?.pbr_model || data.output?.model;
    if(data.status==='success' && typeof url==='string') { const asset=await fetch(url,{signal:AbortSignal.timeout(60000)}); if(asset.ok) await fs.writeFile(path.join(dir,'model.glb'),Buffer.from(await asset.arrayBuffer())); }
  }
}
main().catch(e=>{console.error('Check failed:',e.name);process.exitCode=1;});
