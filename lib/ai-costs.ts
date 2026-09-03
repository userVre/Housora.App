// Housora credits (not provider credits). Shared by confirmations and routes.
export const AI_COSTS = { detection: 1, imageEdit: 4, model3d: 12 } as const;

export type DetectedObject = {
  id: string;
  label: string;
  score: number;
  box: [number, number, number, number]; // normalized x0, y0, x1, y1
  mask: string;
  thumbnail: string;
};
