// 旧バージョン(SQLite/node:sqlite版)の data/app.db を、新バージョン
// (Dexie/IndexedDB版)の「データ管理」画面にある「インポート」機能が読み込める
// JSON形式にダンプする、一度きりの移行用スクリプト。
//
// 実行: node scripts/export-sqlite-to-json.cjs
// → diet-tracker-export.json が生成される。これを新アプリの「データ管理」画面の
//   インポートで読み込むと、既存のお客様データが反映される。
"use strict";

const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const DB_PATH = path.join(__dirname, "..", "data", "app.db");
const OUT_PATH = path.join(__dirname, "..", "diet-tracker-export.json");

if (!fs.existsSync(DB_PATH)) {
  console.error(`data/app.db が見つかりません: ${DB_PATH}`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH, { readOnly: true });

function all(sql) {
  return db.prepare(sql).all();
}

const clients = all(
  `select id, name, birthdate, height_cm, gender, activity_level, pfc_preset,
          target_monthly_weight_change_kg, target_weight_change_kg,
          target_period_months, target_weight_kg, memo, created_at
   from clients`,
).map((row) => ({
  id: row.id,
  name: row.name,
  birthdate: row.birthdate,
  heightCm: row.height_cm,
  gender: row.gender,
  activityLevel: row.activity_level,
  pfcPreset: row.pfc_preset,
  targetMonthlyWeightChangeKg: row.target_monthly_weight_change_kg,
  targetWeightChangeKg: row.target_weight_change_kg,
  targetPeriodMonths: row.target_period_months,
  targetWeightKg: row.target_weight_kg,
  memo: row.memo,
  createdAt: row.created_at,
}));

const orphanedMeasurementsCount = all(
  `select count(*) as c from measurements where client_id is null`,
)[0].c;
const measurements = all(
  `select id, client_id, recorded_at, weight_kg, body_fat_pct, muscle_mass_kg,
          visceral_fat_level, bmr_kcal, memo
   from measurements where client_id is not null`,
).map((row) => ({
  id: row.id,
  clientId: row.client_id,
  recordedAt: row.recorded_at,
  weightKg: row.weight_kg,
  bodyFatPct: row.body_fat_pct,
  muscleMassKg: row.muscle_mass_kg,
  visceralFatLevel: row.visceral_fat_level,
  bmrKcal: row.bmr_kcal,
  memo: row.memo,
}));

const foods = all(
  `select id, category, name, serving_label, kcal, protein_g, fat_g, carb_g from foods`,
).map((row) => ({
  id: row.id,
  category: row.category,
  name: row.name,
  servingLabel: row.serving_label,
  kcal: row.kcal,
  proteinG: row.protein_g,
  fatG: row.fat_g,
  carbG: row.carb_g,
}));

const orphanedMealLogsCount = all(
  `select count(*) as c from meal_logs where client_id is null`,
)[0].c;
const mealLogs = all(
  `select id, client_id, recorded_at, meal_type, food_id, food_name, quantity,
          kcal, protein_g, fat_g, carb_g, memo
   from meal_logs where client_id is not null`,
).map((row) => ({
  id: row.id,
  clientId: row.client_id,
  recordedAt: row.recorded_at,
  mealType: row.meal_type,
  foodId: row.food_id,
  foodName: row.food_name,
  quantity: row.quantity,
  kcal: row.kcal,
  proteinG: row.protein_g,
  fatG: row.fat_g,
  carbG: row.carb_g,
  memo: row.memo,
}));

const usualMeals = all(
  `select id, client_id, meal_type, food_id, food_name, quantity, kcal, protein_g, fat_g, carb_g
   from usual_meals`,
).map((row) => ({
  id: row.id,
  clientId: row.client_id,
  mealType: row.meal_type,
  foodId: row.food_id,
  foodName: row.food_name,
  quantity: row.quantity,
  kcal: row.kcal,
  proteinG: row.protein_g,
  fatG: row.fat_g,
  carbG: row.carb_g,
}));

const exercises = all(`select id, category, name, mets from exercises`).map((row) => ({
  id: row.id,
  category: row.category,
  name: row.name,
  mets: row.mets,
}));

const usualExercises = all(
  `select id, client_id, exercise_id, exercise_name, mets, duration_min, frequency_per_week
   from usual_exercises`,
).map((row) => ({
  id: row.id,
  clientId: row.client_id,
  exerciseId: row.exercise_id,
  exerciseName: row.exercise_name,
  mets: row.mets,
  durationMin: row.duration_min,
  frequencyPerWeek: row.frequency_per_week,
}));

const exportedData = {
  version: 1,
  exportedAt: new Date().toISOString(),
  clients,
  measurements,
  foods,
  mealLogs,
  usualMeals,
  exercises,
  usualExercises,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(exportedData, null, 2), "utf-8");

console.log(`書き出し完了: ${OUT_PATH}`);
console.log(
  `  お客様 ${clients.length}件 / 測定記録 ${measurements.length}件 / ` +
    `食品マスタ ${foods.length}件 / 食事記録 ${mealLogs.length}件 / ` +
    `普段の食事 ${usualMeals.length}件 / 運動マスタ ${exercises.length}件 / ` +
    `普段の運動 ${usualExercises.length}件`,
);

if (orphanedMeasurementsCount > 0 || orphanedMealLogsCount > 0) {
  console.warn(
    `\n警告: 過去に削除されたお客様に紐づいていた記録のため、書き出し対象から除外しました ` +
      `(測定記録 ${orphanedMeasurementsCount}件 / 食事記録 ${orphanedMealLogsCount}件)。`,
  );
}
