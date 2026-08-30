import { createHmac, timingSafeEqual } from "node:crypto";

type TrackingPayload = {
  taskId: string;
  ownerId: string;
  usageEventId: string;
  expiresAt: number;
};

function secret() {
  const value = process.env.TRIPO_TRACKING_SECRET || process.env.TRIPO_API_KEY;
  if (!value) throw new Error("Tripo tracking is not configured.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createTripoTrackingToken(payload: Omit<TrackingPayload, "expiresAt">) {
  const encoded = Buffer.from(JSON.stringify({
    ...payload,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyTripoTrackingToken(token: string, taskId: string, ownerId: string) {
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) throw new Error("Invalid Tripo tracking token.");
  const expected = Buffer.from(signature(encoded));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new Error("Invalid Tripo tracking token.");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TrackingPayload;
  if (payload.taskId !== taskId || payload.ownerId !== ownerId || payload.expiresAt < Date.now()) {
    throw new Error("Expired or mismatched Tripo tracking token.");
  }
  return payload;
}
