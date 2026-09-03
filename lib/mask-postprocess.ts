// SAM 3.1 post-processing: mask smoothing + edge feather for messy photos
// Pure canvas — no new API. Called on mask dataUrl before compositing.

export async function smoothMask(maskDataUrl: string, opts?: { feather?: number; closeRadius?: number }): Promise<string> {
  const feather = opts?.feather ?? 1.8;
  const closeRadius = opts?.closeRadius ?? 2;
  const img = await loadImage(maskDataUrl);
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  // 1) morphological close (dilate then erode) to fill pinholes
  if (closeRadius > 0) {
    const data = ctx.getImageData(0, 0, w, h);
    const bin = toBinary(data);
    dilate(bin, w, h, closeRadius);
    erode(bin, w, h, closeRadius);
    fromBinary(data, bin);
    ctx.putImageData(data, 0, 0);
  }
  // 2) feather edge via blur
  ctx.globalCompositeOperation = "source-in";
  (ctx as any).filter = `blur(${feather}px)`;
  ctx.drawImage(canvas, 0, 0);
  (ctx as any).filter = "none";
  ctx.globalCompositeOperation = "source-over";
  // re-threshold to binary after blur for clean alpha
  const out = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < out.data.length; i += 4) {
    const a = out.data[i + 3];
    const v = a > 90 ? 255 : 0;
    out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
    out.data[i + 3] = v;
  }
  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}
function toBinary(d: ImageData): Uint8Array {
  const b = new Uint8Array(d.width * d.height);
  for (let i = 0, p = 0; i < b.length; i++, p += 4) b[i] = d.data[p + 3] > 128 ? 1 : 0;
  return b;
}
function fromBinary(d: ImageData, b: Uint8Array) {
  for (let i = 0, p = 0; i < b.length; i++, p += 4) {
    const v = b[i] ? 255 : 0;
    d.data[p] = d.data[p + 1] = d.data[p + 2] = v;
    d.data[p + 3] = v ? 255 : 0;
  }
}
function dilate(bin: Uint8Array, w: number, h: number, r: number) {
  const copy = bin.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (copy[y * w + x]) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) bin[ny * w + nx] = 1;
    }
  }
}
function erode(bin: Uint8Array, w: number, h: number, r: number) {
  const copy = bin.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let keep = true;
    for (let dy = -r; dy <= r && keep; dy++) for (let dx = -r; dx <= r && keep; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h || !copy[ny * w + nx]) keep = false;
    }
    bin[y * w + x] = keep ? 1 : 0;
  }
}
