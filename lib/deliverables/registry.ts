export type DeliverableContext = { projectName:string; clientName:string; rooms:{name:string; before:string; after:string}[]; styleLibrary?:any };
export type Deliverable = { id:string; name:string; mime:string; render:(ctx:DeliverableContext)=>Promise<Blob> };
const registry: Deliverable[] = [];
export function register(d: Deliverable){ registry.push(d); }
export function list(){ return registry; }
export async function renderAll(ctx:DeliverableContext){ return Promise.all(registry.map(async r=>({id:r.id, blob:await r.render(ctx)}))); }
