#!/usr/bin/env node
// wger(https://wger.de)の公開APIから、種目マスタに対応づけた種目の情報と、
// 筋肉ハイライト用のSVG画像を取り込み、アプリに静的データとして同梱する
// 生成スクリプト。アプリは静的書き出し(GitHub Pages)でサーバーが無いため、
// 実行時にwgerへ問い合わせず、ここで取り込んだ内容だけを使う。
//
// 出力:
//   src/lib/wger/exercises.generated.json  種目(名称・器具・主働筋/補助筋ID・画像URL)と筋肉一覧
//   public/anatomy/wger/body-*.webp       人体(前面/背面)。元SVGは座標が細かく300KB超のため、WebPへ変換
//   public/anatomy/wger/{main,secondary}-N.svg  筋肉ごとのオーバーレイSVG(各3KB程度)
//
// 使い方(認証不要):
//   node scripts/build-wger-data.mjs
//
// 対応する種目を増やすときは scripts/lib/wger-exercise-map.mjs を編集して再実行する。
// 取得はすべて先に済ませてからファイルを書き出す(途中で失敗しても、一部だけ
// 更新された中途半端な状態にならない)。
// wgerのデータ・画像は CC BY-SA(https://creativecommons.org/licenses/by-sa/3.0/)。
// 表示側で出典(wger.de)を明記すること。

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  UNMAPPED_EXERCISE_NAMES,
  WGER_EXERCISE_MAP,
  uniqueWgerIds,
} from "./lib/wger-exercise-map.mjs";
import { pickFormImages } from "./lib/wger-images.mjs";

const API = "https://wger.de/api/v2";
const STATIC = "https://wger.de/static/images/muscles";
const ENGLISH_LANGUAGE_ID = 2;
// wgerへの同時リクエスト数(公開サーバーへの負荷を抑える)。
const CONCURRENCY = 6;

// 人体図(元は200x369)を拡大表示でも粗くならない幅のWebPにする。
// 表示側は筋肉オーバーレイ(viewBox 200x*)と同じ縦横比の箱に重ねるため、
// 高さは元の縦横比(200:369)に合わせて固定する。
const BODY_WEBP_WIDTH = 720;
const BODY_WEBP_HEIGHT = Math.round((BODY_WEBP_WIDTH * 369) / 200);
const BODY_SVG_WIDTH = 200;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(rootDir, "src/lib/wger/exercises.generated.json");
const svgDir = path.join(rootDir, "public/anatomy/wger");

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

// 同時実行数を制限しつつ、items全件にfnを適用する(結果はitemsと同じ順)。
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// wgerのSVGはviewBoxを持たず固定ピクセル寸法のため、そのままではimgの表示サイズに
// 合わせて拡縮できない。ルート<svg>のwidth/heightからviewBoxを付与し、人体と
// 筋肉オーバーレイを同じ倍率で(左上基準で)重ねられるようにする。
function withViewBox(svg) {
  return svg.replace(/<svg\b[^>]*>/, (tag) => {
    if (/\sviewBox=/.test(tag)) return tag;
    const width = tag.match(/\swidth="([\d.]+)"/)?.[1];
    const height = tag.match(/\sheight="([\d.]+)"/)?.[1];
    if (!width || !height) throw new Error("SVGのwidth/heightを取得できません");
    return tag.replace(/<svg\b/, `<svg viewBox="0 0 ${width} ${height}"`);
  });
}

async function fetchSvg(url) {
  return withViewBox(await fetchText(url));
}

async function renderBodyWebp(svgUrl) {
  const svg = await fetchSvg(svgUrl);
  return sharp(Buffer.from(svg), { density: (72 * BODY_WEBP_WIDTH) / BODY_SVG_WIDTH })
    .resize(BODY_WEBP_WIDTH, BODY_WEBP_HEIGHT, { fit: "fill" })
    .webp({ quality: 80, alphaQuality: 80 })
    .toBuffer();
}

async function fetchExercise(id) {
  const info = await fetchJson(`${API}/exerciseinfo/${id}/?format=json`);
  const english =
    info.translations.find((t) => t.language === ENGLISH_LANGUAGE_ID) ?? info.translations[0];
  return {
    id: info.id,
    name: english?.name ?? `wger #${info.id}`,
    equipment: (info.equipment ?? []).map((e) => e.name),
    primaryMuscleIds: (info.muscles ?? []).map((m) => m.id).sort((a, b) => a - b),
    secondaryMuscleIds: (info.muscles_secondary ?? []).map((m) => m.id).sort((a, b) => a - b),
    images: pickFormImages(
      (info.images ?? []).map((img) => img.thumbnails?.medium ?? img.image).filter(Boolean),
    ),
  };
}

// ---- 取得(ここではまだファイルを書き換えない) ----
const muscleList = (await fetchJson(`${API}/muscle/?format=json&limit=100`)).results;
const muscles = muscleList
  .map((m) => ({ id: m.id, name: m.name, isFront: m.is_front }))
  .sort((a, b) => a.id - b.id);

const [bodyFront, bodyBack] = await Promise.all([
  renderBodyWebp(`${STATIC}/muscular_system_front.svg`),
  renderBodyWebp(`${STATIC}/muscular_system_back.svg`),
]);

const overlays = (
  await mapLimit(muscleList, CONCURRENCY, async (m) => [
    [`main-${m.id}.svg`, await fetchSvg(m.image_url_main)],
    [`secondary-${m.id}.svg`, await fetchSvg(m.image_url_secondary)],
  ])
).flat();

const exercises = await mapLimit(uniqueWgerIds(), CONCURRENCY, fetchExercise);

// ---- 書き出し ----
await mkdir(svgDir, { recursive: true });
await mkdir(path.dirname(jsonPath), { recursive: true });
await Promise.all([
  writeFile(path.join(svgDir, "body-front.webp"), bodyFront),
  writeFile(path.join(svgDir, "body-back.webp"), bodyBack),
  ...overlays.map(([name, svg]) => writeFile(path.join(svgDir, name), svg)),
  writeFile(jsonPath, `${JSON.stringify({ muscles, exercises }, null, 2)}\n`),
]);

console.log(
  `筋肉 ${muscles.length}件 / 種目 ${exercises.length}件 / 人体図(WebP)2枚 / 筋肉SVG ${overlays.length}枚を出力しました。`,
);
console.log(`マスタ種目のうちwgerに対応づけたもの: ${WGER_EXERCISE_MAP.size}件`);
console.log(`未対応: ${UNMAPPED_EXERCISE_NAMES.length}件`);
for (const ex of exercises) {
  const names = [...WGER_EXERCISE_MAP].filter(([, v]) => v === ex.id).map(([k]) => k);
  console.log(
    `  ${names.join("/")} -> #${ex.id} ${ex.name} 主働:[${ex.primaryMuscleIds}] 補助:[${ex.secondaryMuscleIds}] 画像${ex.images.length}`,
  );
}
