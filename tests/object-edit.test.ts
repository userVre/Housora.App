import { test, expect } from "vitest";
import sharp from "sharp";
import { compositeObjectEdit } from "../lib/composite-object-edit";

test("object compositing preserves every unmasked original pixel", async () => {
  const original = await sharp({ create: { width: 2, height: 1, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
  const edited = await sharp({ create: { width: 2, height: 1, channels: 3, background: { r: 0, g: 0, b: 255 } } }).png().toBuffer();
  const mask = await sharp(Buffer.from([0,255]), { raw: { width:2,height:1,channels:1 } }).png().toBuffer();
  const result = await sharp(await compositeObjectEdit(original, edited, mask)).raw().toBuffer();
  expect([...result]).toEqual([255,0,0,0,0,255]);
});
