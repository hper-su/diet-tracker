#!/usr/bin/env node
// wger(https://wger.de)の公開APIから、種目マスタに対応づけた種目の情報と、
// 筋肉ハイライト用のSVG画像を取り込み、アプリに静的データとして同梱する
// 生成スクリプト。アプリは静的書き出し(GitHub Pages)でサーバーが無いため、
// 実行時にwgerへ問い合わせず、ここで取り込んだ内容だけを使う。
//
// 出力:
//   src/lib/wger/exercises.generated.json  種目(名称・器具・主働筋/補助筋ID・画像URL)と筋肉一覧
//   public/anatomy/wger/*.svg              人体(前面/背面)と筋肉ごとのオーバーレイSVG
//
// 使い方(認証不要):
//   node scripts/build-wger-data.mjs
//
// 対応する種目を増やすときは scripts/lib/wger-exercise-map.mjs を編集して再実行する。
// wgerのデータ・画像は CC BY-SA(https://creativecommons.org/licenses/by-sa/3.0/)。
// 表示側で出典(wger.de)を明記すること。

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  UNMAPPED_EXERCISE_NAMES,
  WGER_EXERCISE_MAP,
  uniqueWgerIds,
} from "./lib/wger-exercise-map.mjs";

const API = "https://wger.de/api/v2";
const STATIC = "https://wger.de/static/images/muscles";
const ENGLISH_LANGUAGE_ID = 2;

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

const muscleList = (await fetchJson(`${API}/muscle/?format=json&limit=100`)).results;
const muscles = muscleList
  .map((m) => ({
    id: m.id,
    name: m.name,
    nameEn: m.name_en || "",
    isFront: m.is_front,
  }))
  .sort((a, b) => a.id - b.id);

await mkdir(svgDir, { recursive: true });
await writeFile(
  path.join(svgDir, "body-front.svg"),
  await fetchSvg(`${STATIC}/muscular_system_front.svg`),
);
await writeFile(
  path.join(svgDir, "body-back.svg"),
  await fetchSvg(`${STATIC}/muscular_system_back.svg`),
);
for (const m of muscleList) {
  await writeFile(path.join(svgDir, `main-${m.id}.svg`), await fetchSvg(m.image_url_main));
  await writeFile(
    path.join(svgDir, `secondary-${m.id}.svg`),
    await fetchSvg(m.image_url_secondary),
  );
}

const exercises = [];
for (const id of uniqueWgerIds()) {
  const info = await fetchJson(`${API}/exerciseinfo/${id}/?format=json`);
  const english =
    info.translations.find((t) => t.language === ENGLISH_LANGUAGE_ID) ?? info.translations[0];
  exercises.push({
    id: info.id,
    name: english?.name ?? `wger #${info.id}`,
    category: info.category?.name ?? "",
    equipment: (info.equipment ?? []).map((e) => e.name),
    primaryMuscleIds: (info.muscles ?? []).map((m) => m.id).sort((a, b) => a - b),
    secondaryMuscleIds: (info.muscles_secondary ?? []).map((m) => m.id).sort((a, b) => a - b),
    images: (info.images ?? [])
      .map((img) => img.thumbnails?.medium ?? img.image)
      .filter(Boolean),
  });
}

await mkdir(path.dirname(jsonPath), { recursive: true });
await writeFile(jsonPath, `${JSON.stringify({ muscles, exercises }, null, 2)}\n`);

console.log(`筋肉 ${muscles.length}件 / 種目 ${exercises.length}件 / SVG ${2 + muscleList.length * 2}枚を出力しました。`);
console.log(`マスタ種目のうちwgerに対応づけたもの: ${WGER_EXERCISE_MAP.size}件`);
console.log(`未対応: ${UNMAPPED_EXERCISE_NAMES.length}件`);
for (const ex of exercises) {
  const names = [...WGER_EXERCISE_MAP].filter(([, v]) => v === ex.id).map(([k]) => k);
  console.log(
    `  ${names.join("/")} -> #${ex.id} ${ex.name} 主働:[${ex.primaryMuscleIds}] 補助:[${ex.secondaryMuscleIds}] 画像${ex.images.length}`,
  );
}
