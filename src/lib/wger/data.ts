// wger(https://wger.de)から取り込んだ種目・筋肉の静的データ。
// exercises.generated.json は scripts/build-wger-data.mjs が生成する
// (手で編集しない。対応種目を増やすときは scripts/lib/wger-exercise-map.mjs を編集して再生成)。
// wgerのデータ・画像は CC BY-SA。表示する画面では WgerAttribution で出典を明記する。

import generated from "./exercises.generated.json";

export type WgerMuscle = {
  id: number;
  name: string; // ラテン語の解剖学名
  nameEn: string; // 一般名(無いものは空文字)
  isFront: boolean; // 全身図の前面(true)/背面(false)のどちらに載る筋肉か
};

export type WgerExercise = {
  id: number;
  name: string; // 英語名
  category: string;
  equipment: string[];
  primaryMuscleIds: number[];
  secondaryMuscleIds: number[];
  images: string[];
};

export const WGER_MUSCLES = generated.muscles as WgerMuscle[];
export const WGER_EXERCISES = generated.exercises as WgerExercise[];

// wgerの15筋肉の日本語名。wgerの筋肉区分は粗いため、アプリ側の詳細な部位
// (src/lib/anatomy.ts)とは1対1にならない(対応は anatomy-map.ts)。
export const WGER_MUSCLE_JA: Record<number, string> = {
  1: "上腕二頭筋",
  2: "三角筋前部",
  3: "前鋸筋",
  4: "大胸筋",
  5: "上腕三頭筋",
  6: "腹直筋",
  7: "腓腹筋",
  8: "大臀筋",
  9: "僧帽筋",
  10: "大腿四頭筋",
  11: "ハムストリングス",
  12: "広背筋",
  13: "上腕筋",
  14: "外腹斜筋",
  15: "ヒラメ筋",
};

export function wgerMuscleLabel(id: number): string {
  return WGER_MUSCLE_JA[id] ?? WGER_MUSCLES.find((m) => m.id === id)?.name ?? `筋肉#${id}`;
}

const exerciseById = new Map(WGER_EXERCISES.map((exercise) => [exercise.id, exercise]));

export function getWgerExercise(id: number | null | undefined): WgerExercise | null {
  if (id == null) return null;
  return exerciseById.get(id) ?? null;
}

export function wgerExercisePageUrl(id: number): string {
  return `https://wger.de/en/exercise/${id}/view/`;
}

export const WGER_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/3.0/deed.ja";
