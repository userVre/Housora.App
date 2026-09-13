/** Convert an opaque grayscale segmentation mask into a white alpha mask. */
export function maskLuminanceToAlpha(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    const luminance = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.round((luminance * data[i + 3]) / 255);
  }
  return data;
}
