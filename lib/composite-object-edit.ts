import sharp from "sharp";

/** Keep original pixels outside the SAM mask; black = preserve, white = edit. */
export async function compositeObjectEdit(original: Buffer, edited: Buffer, mask: Buffer) {
  const options = { limitInputPixels: 20_000_000 };
  const base = await sharp(original, options).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = base.info;
  const changed = await sharp(edited, options).resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const alpha = await sharp(mask, options).resize(width, height, { fit: "fill" }).removeAlpha().greyscale().raw().toBuffer();
  const output = Buffer.alloc(base.data.length);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const weight = alpha[pixel] / 255;
    for (let channel = 0; channel < channels; channel++) {
      const index = pixel * channels + channel;
      output[index] = Math.round(base.data[index] * (1 - weight) + changed[index] * weight);
    }
  }
  return sharp(output, { raw: { width, height, channels } }).png().toBuffer();
}
