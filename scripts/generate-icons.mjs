// PWAインストール用アイコンのプレースホルダーを生成する一度きりのスクリプト。
// 正式なロゴができたら public/icon-192.png / icon-512.png / apple-touch-icon.png を
// 差し替えれば良い(このスクリプトの再実行は不要)。
// 実行: node scripts/generate-icons.mjs (要 devDependencies の sharp)
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
mkdirSync(PUBLIC_DIR, { recursive: true });

function svgIcon(size) {
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#0f172a"/>
    <text x="50%" y="54%" font-family="'Hiragino Sans','Yu Gothic','Noto Sans JP',sans-serif" font-weight="700" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">食</text>
  </svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(Buffer.from(svgIcon(size))).png().toFile(path.join(PUBLIC_DIR, file));
  console.log(`generated public/${file}`);
}
