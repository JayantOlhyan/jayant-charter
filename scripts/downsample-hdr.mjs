import fs from "node:fs";
import path from "node:path";

/**
 * Downsamples a 32-bit RLE Radiance RGBE .hdr image by 2x (1024x512 -> 512x256)
 * while preserving full HDR floating-point luminance for studio IBL reflections.
 */
function decodeRadianceHdr(buffer) {
  let offset = 0;
  // Parse header until blank line
  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf(0x0a, offset);
    if (lineEnd === -1) break;
    const line = buffer.toString("ascii", offset, lineEnd).trim();
    offset = lineEnd + 1;
    if (line === "") break;
  }

  const resEnd = buffer.indexOf(0x0a, offset);
  const resLine = buffer.toString("ascii", offset, resEnd).trim();
  offset = resEnd + 1;

  const match = /-Y\s+(\d+)\s+\+X\s+(\d+)/.exec(resLine);
  if (!match) throw new Error(`Unsupported HDR resolution header: ${resLine}`);
  const height = Number(match[1]);
  const width = Number(match[2]);

  const floats = new Float32Array(width * height * 3);
  const scanline = new Uint8Array(width * 4);

  for (let y = 0; y < height; y++) {
    const b0 = buffer[offset++];
    const b1 = buffer[offset++];
    const b2 = buffer[offset++];
    const b3 = buffer[offset++];
    if (b0 !== 2 || b1 !== 2 || ((b2 << 8) | b3) !== width) {
      throw new Error(`Unsupported HDR scanline format at row ${y}`);
    }

    for (let ch = 0; ch < 4; ch++) {
      let ptr = 0;
      while (ptr < width) {
        const count = buffer[offset++];
        if (count > 128) {
          const run = count - 128;
          const val = buffer[offset++];
          for (let i = 0; i < run; i++) {
            scanline[ch * width + ptr++] = val;
          }
        } else {
          for (let i = 0; i < count; i++) {
            scanline[ch * width + ptr++] = buffer[offset++];
          }
        }
      }
    }

    for (let x = 0; x < width; x++) {
      const r = scanline[x];
      const g = scanline[width + x];
      const b = scanline[2 * width + x];
      const e = scanline[3 * width + x];
      const idx = (y * width + x) * 3;
      if (e > 0) {
        const f = Math.pow(2, e - 128 - 8);
        floats[idx] = (r + 0.5) * f;
        floats[idx + 1] = (g + 0.5) * f;
        floats[idx + 2] = (b + 0.5) * f;
      }
    }
  }

  return { width, height, floats };
}

function encodeRadianceHdr(width, height, floats) {
  const header = Buffer.from(
    `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
    "ascii"
  );
  const body = Buffer.alloc(width * height * 4);
  let ptr = 0;

  for (let i = 0; i < width * height; i++) {
    const r = floats[i * 3];
    const g = floats[i * 3 + 1];
    const b = floats[i * 3 + 2];
    const max = Math.max(r, g, b);
    if (max < 1e-32) {
      body[ptr++] = 0;
      body[ptr++] = 0;
      body[ptr++] = 0;
      body[ptr++] = 0;
    } else {
      const exp = Math.floor(Math.log2(max)) + 1;
      const scale = Math.pow(2, -exp) * 256;
      body[ptr++] = Math.min(255, Math.floor(r * scale));
      body[ptr++] = Math.min(255, Math.floor(g * scale));
      body[ptr++] = Math.min(255, Math.floor(b * scale));
      body[ptr++] = exp + 128;
    }
  }

  return Buffer.concat([header, body]);
}

const srcPath = "/Users/jayantolhyan/Documents/ChatGPT/Private jets/models/hawker-4000-realistic/studio.hdr";
const outPath = path.join(process.cwd(), "public", "models", "v1", "studio-env.hdr");

const src = decodeRadianceHdr(fs.readFileSync(srcPath));
const dstW = Math.floor(src.width / 2);
const dstH = Math.floor(src.height / 2);
const dstFloats = new Float32Array(dstW * dstH * 3);

for (let y = 0; y < dstH; y++) {
  for (let x = 0; x < dstW; x++) {
    const outIdx = (y * dstW + x) * 3;
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const srcIdx = ((y * 2 + dy) * src.width + (x * 2 + dx)) * 3;
        dstFloats[outIdx] += src.floats[srcIdx] * 0.25;
        dstFloats[outIdx + 1] += src.floats[srcIdx + 1] * 0.25;
        dstFloats[outIdx + 2] += src.floats[srcIdx + 2] * 0.25;
      }
    }
  }
}

const outBuf = encodeRadianceHdr(dstW, dstH, dstFloats);
fs.writeFileSync(outPath, outBuf);
console.log(
  `Downsampled studio-env.hdr: ${src.width}x${src.height} -> ${dstW}x${dstH} (${Math.round(
    outBuf.length / 1024
  )} KB raw)`
);
