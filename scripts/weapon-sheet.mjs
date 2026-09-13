import { createWriteStream, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const GLYPHS = {
  "ember-mallet": ["................","..........bbb...",".........bbbbb..","hhHHh...bbccbb..","hhHHh...bbbbbb..",".........bbbbb..","..........bbb...","................"],
  "ice-peen": ["................",".............c..","...........bbc..","hhHHhhhhhbbbbb..","hhHHhhhhhbbbb...","...........bb...","................","................"],
  "storm-hammer": ["................",".........bbbbbb.","........bbccbbb.","hhHHhhh.bbbbbbb.","hhHHhhh.bbbbbb..",".........bbbb...","................","................"],
  "void-maul": ["................",".......bbbbbbbb.","......bbbcccbbb.","hhHHh.bbbbbbbbb.","hhHHh.bbbbbbbb..","......bbbbbbb...",".......bbbbb....","................"],
  "thorn-hammer": ["................","....b......b.c..","...b.b....b.bb..","hhHHhhhhhbbbbb..","hhHHhhhhhbbbb...","...b.b....bbb...","....b......b....","................"],
  "blast-sledge": ["................","......bbbbbbbbb.",".....bbbcccbbbb.","hhHH.bbbbbbbbbb.","hhHH.bbbbbbbbb..",".....bbbbbbbb...","......bbbbbb....","................"],
  "gold-hammer": ["................","........cbbbbbc.",".......bbbbbbbb.","hhHHhh.bbcccbb..","hhHHhh.bbbbbbb..",".......bbbbbb...","........bbbb....","................"],
  "night-maul": ["................","......bb....bb..",".....bbbbccbbb..","hhHHhbbbbbbbbb..","hhHHhbbbbbbbb...",".....bbbbbbb....","......bbbbb.....","................"],
  "root-mallet": ["................",".........bb.b...","........bbbbbb..","hHhHh..bbccbbb..","hHhHh..bbbbbb...","........bbb.b...",".........bb.....","................"],
  "bone-hammer": ["................","............c...","...........bb...","hHhHhHhHhHbbb...","hHhHhHhHhHbbb...","...........bb...","............c...","................"],
  "moon-peen": ["................","..............c.","............bbc.","hhHHhhhhhhhbbb..","hhHHhhhhhhhbb...","............b...","................","................"],
  "ash-sledge": ["................",".....bbbbbbbbbb.","....bbb.c.bbbbb.","hhHHbbbbbbbbbbb.","hhHHbbbbbbbbbb..","....bbbbbbbbb...",".....bbbbbbb....","................"],
  "rime-hammer": ["................","........cbbbbc..",".......bbcccbb..","hhHHhh.bbbbbbb..","hhHHhh.bbbbbb...",".......cbbbb....","................","................"],
  "bramble-maul": ["................","....b..bbbb..b..","...b..bbccbb.b..","hhHHh.bbbbbbb...","hhHHh.bbbbbb....","...b...bbbb.b...","....b...bb.b....","................"],
  "star-hammer": ["................","..............c.","..........b..bc.","hhHHhhhhhhbbbb..","hhHHhhhhhhbbb...","..........b..b..","................","................"],
};

const HAMMERS = [
  ["ember-mallet", "#e08a3c", "Ember mallet"],
  ["ice-peen", "#9ad8ea", "Ice peen"],
  ["storm-hammer", "#f0d24a", "Storm hammer"],
  ["void-maul", "#7a48b8", "Void maul"],
  ["thorn-hammer", "#6fbf6a", "Thorn hammer"],
  ["blast-sledge", "#d45a32", "Blast sledge"],
  ["gold-hammer", "#f0d24a", "Gold hammer"],
  ["night-maul", "#4a4c48", "Night maul"],
  ["root-mallet", "#8a6a38", "Root mallet"],
  ["bone-hammer", "#ecece8", "Bone hammer"],
  ["moon-peen", "#d8c4f0", "Moon peen"],
  ["ash-sledge", "#8aa0b8", "Ash sledge"],
  ["rime-hammer", "#c5eaf6", "Rime hammer"],
  ["bramble-maul", "#3d7a45", "Bramble maul"],
  ["star-hammer", "#fff4c8", "Star hammer"],
];

const PX = 8;
const GW = 16;
const GH = 8;
const COLS = 5;
const PAD = 16;
const CELL_W = GW * PX + 24;
const CELL_H = GH * PX + 28;
const W = PAD * 2 + COLS * CELL_W;
const ROWS = Math.ceil(HAMMERS.length / COLS);
const H = PAD * 2 + ROWS * CELL_H;

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const bg = [22, 17, 13, 255];
const data = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) data.set(bg, i * 4);

function plot(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 4;
  data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a;
}

function fill(x, y, w, h, r, g, b) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) plot(x + i, y + j, r, g, b);
}

HAMMERS.forEach(([id, color, name], n) => {
  const col = n % COLS;
  const row = Math.floor(n / COLS);
  const cx = PAD + col * CELL_W + 8;
  const cy = PAD + row * CELL_H + 4;
  const rows = GLYPHS[id];
  const ore = hex(color);
  const cry = hex("#fff4c8");
  const hnd = [42, 28, 20];
  const hlt = [106, 74, 48];
  for (let j = 0; j < rows.length; j++) {
    for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][i];
      if (ch === ".") continue;
      const rgb = ch === "h" ? hnd : ch === "H" ? hlt : ch === "c" ? cry : ore;
      fill(cx + i * PX, cy + j * PX, PX, PX, rgb[0], rgb[1], rgb[2]);
    }
  }
});

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, payload) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, payload])));
  return Buffer.concat([len, t, payload, crc]);
}

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0;
  data.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
mkdirSync("/workspace/artifacts", { recursive: true });
const out = "/workspace/artifacts/wispwood-weapons.png";
createWriteStream(out).end(png);
console.log(out, W, H);
