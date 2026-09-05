import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { storeProjectImage } from "./image-storage";
export async function enqueueAi(args: { ownerId: string; type: "segment" | "edit"; requestId: string; inputHash: string; image: string; mask?: string; prompt?: string; mode?: string; aspectRatio?: string; projectId?: string; roomId?: string }) {
  const image = args.image.startsWith("data:") ? await storeProjectImage(args.ownerId, Buffer.from(args.image.split(",")[1], "base64")) : args.image;
  const mask = args.mask ? await storeProjectImage(args.ownerId, Buffer.from(args.mask.split(",")[1], "base64")) : undefined;
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL!);
  const serverKey = process.env.HOUSORA_SERVER_KEY || process.env.WHOP_WEBHOOK_SECRET;
  if (!serverKey) throw new Error("Internal server authentication is not configured.");
  return client.mutation(api.jobs.enqueueServer, { ...args, image, mask, serverKey });
}
