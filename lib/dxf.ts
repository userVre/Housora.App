// Pure codebase DXF export — no external API
// Minimal DXF writer for floor plan: walls as LINE, doors as ARC, windows as LINE, dims as TEXT

export type FloorPlanForDxf = {
  walls?: { x1:number; y1:number; x2:number; y2:number }[];
  doors?: { x:number; y:number; w:number }[];
  windows?: { x1:number; y1:number; x2:number; y2:number }[];
  dimensions?: { w:number; h:number };
};

export function generateDxf(plan: FloorPlanForDxf): string {
  const lines: string[] = [];
  const add = (...s: string[]) => lines.push(...s);
  add("0","SECTION","2","HEADER","9","$ACADVER","1","AC1021","0","ENDSEC");
  add("0","SECTION","2","TABLES","0","ENDSEC");
  add("0","SECTION","2","ENTITIES");
  // walls
  for (const w of plan.walls || []) {
    add("0","LINE","8","WALLS","10",String(w.x1),"20",String(w.y1),"11",String(w.x2),"21",String(w.y2));
  }
  // windows
  for (const w of plan.windows || []) {
    add("0","LINE","8","WINDOWS","10",String(w.x1),"20",String(w.y1),"11",String(w.x2),"21",String(w.y2));
  }
  // doors as insert point
  for (const d of plan.doors || []) {
    add("0","CIRCLE","8","DOORS","10",String(d.x),"20",String(d.y),"40",String(d.w/2));
  }
  // dimensions text
  if (plan.dimensions) {
    add("0","TEXT","8","DIMS","10","0","20","-10","40","2.5","1",`${plan.dimensions.w} x ${plan.dimensions.h} m`);
  }
  add("0","ENDSEC","0","EOF");
  return lines.join("\n");
}
