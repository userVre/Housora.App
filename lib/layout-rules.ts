// Layout intelligence — rule-based, floorPlan data assumed as input.
// No external API. Flags external partnership only for true IBC/ADA compliance.

export type RoomDims = { wM: number; hM: number; ceilingM?: number };
export type PlacedItem = { id:string; type:string; xM:number; yM:number; wM:number; hM:number; rotation?:number };
export type Violation = { code:string; severity:"warn"|"error"; message:string; items:string[] };

const CLEAR_SIDE = 0.45; // 45cm side clearance
const CIRCULATION = 0.90; // 90cm circulation
const DOOR_SWING = 0.85;

export function checkLayout(dims: RoomDims, items: PlacedItem[], doors: {xM:number;yM:number; swing:"in"|"out"}[] = []): Violation[] {
  const v:Violation[]=[];
  // clearance between furniture
  for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
    const a=items[i], b=items[j];
    const gap = Math.hypot(Math.max(0, Math.max(a.xM, b.xM) - Math.min(a.xM+a.wM, b.xM+b.wM)), Math.max(0, Math.max(a.yM,b.yM)-Math.min(a.yM+a.hM, b.yM+b.hM)));
    if(gap < CLEAR_SIDE && gap>0.01) v.push({code:"clearance", severity:"warn", message:`${a.type} too close to ${b.type} (${(gap*100).toFixed(0)}cm < 45cm)`, items:[a.id,b.id]});
  }
  // wall clearance / out of bounds
  for(const it of items){
    if(it.xM < 0.05 || it.yM < 0.05 || it.xM+it.wM > dims.wM-0.05 || it.yM+it.hM > dims.hM-0.05)
      v.push({code:"bounds", severity:"error", message:`${it.type} out of room bounds`, items:[it.id]});
  }
  // door swing
  for(const d of doors) for(const it of items){
    const dist = Math.hypot(it.xM - d.xM, it.yM - d.yM);
    if(dist < DOOR_SWING) v.push({code:"door_swing", severity:"error", message:`${it.type} blocks door swing`, items:[it.id]});
  }
  // traffic flow: need 90cm corridor from door to center
  if(doors.length && items.length){
    const center={x:dims.wM/2, y:dims.hM/2};
    const door=doors[0];
    const blocked = items.some(it=> it.xM < Math.max(door.xM,center.x) && it.xM+it.wM > Math.min(door.xM,center.x) && it.yM < Math.max(door.yM,center.y) && it.yM+it.hM > Math.min(door.yM,center.y) && it.wM>0.6);
    if(blocked) v.push({code:"circulation", severity:"warn", message:"Furniture blocks main circulation path", items:[]});
  }
  return v;
}
