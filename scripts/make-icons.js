/* Generates the extension icons (and the store's 128px mark) with no
   third-party image tooling: draws into an RGBA buffer, encodes a PNG. */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SS = 4; // supersampling factor

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Rounded rectangle coverage test in unit-square coordinates.
function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  const nearestX = Math.min(Math.max(x, left), right);
  const nearestY = Math.min(Math.max(y, top), bottom);
  if (nearestX !== x || nearestY !== y) return false;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Four bars, tallest in the middle: a voice reading aloud.
const BARS = [
  { center: 0.285, height: 0.34 },
  { center: 0.428, height: 0.62 },
  { center: 0.572, height: 0.46 },
  { center: 0.715, height: 0.24 }
];
const BAR_WIDTH = 0.088;

function draw(size) {
  const w = size * SS;
  const out = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (!insideRoundedRect(x, y, 0.02, 0.02, 0.98, 0.98, 0.22)) continue;

          // Diagonal brand gradient.
          const t = Math.min(Math.max((x + y) / 2, 0), 1);
          let pr = Math.round(47 + (111 - 47) * t);
          let pg = Math.round(109 + (91 - 109) * t);
          let pb = Math.round(246 + (255 - 246) * t);

          for (const bar of BARS) {
            const half = BAR_WIDTH / 2;
            const top = 0.5 - bar.height / 2;
            const bottom = 0.5 + bar.height / 2;
            if (insideRoundedRect(x, y, bar.center - half, top, bar.center + half, bottom, half)) {
              pr = 255; pg = 255; pb = 255;
              break;
            }
          }
          r += pr; g += pg; b += pb; a += 255;
        }
      }
      const samples = SS * SS;
      const alpha = a / samples;
      const index = (py * size + px) * 4;
      if (alpha > 0) {
        const covered = a / 255;
        out[index] = Math.round(r / covered);
        out[index + 1] = Math.round(g / covered);
        out[index + 2] = Math.round(b / covered);
        out[index + 3] = Math.round(alpha);
      }
    }
  }
  void w;
  return encodePng(size, size, out);
}

const targets = [
  ['extension/icons/icon16.png', 16],
  ['extension/icons/icon32.png', 32],
  ['extension/icons/icon48.png', 48],
  ['extension/icons/icon128.png', 128],
  ['store/assets/icon-128.png', 128]
];

for (const [file, size] of targets) {
  const full = path.resolve(__dirname, '..', file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, draw(size));
  console.log(`${file}  ${size}x${size}`);
}
