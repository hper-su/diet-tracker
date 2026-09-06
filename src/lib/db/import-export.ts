import { db, type ClientRecord, type MeasurementRecord, type MealLogRecord } from "./client";
import type { Food } from "./foods";
import type { UsualMeal } from "./usual-meals";
import type { Exercise } from "./exercises";
import type { UsualExercise } from "./usual-exercises";

export const EXPORT_FORMAT_VERSION = 1;

export type ExportedData = {
  version: typeof EXPORT_FORMAT_VERSION;
  exportedAt: string;
  clients: ClientRecord[];
  measurements: MeasurementRecord[];
  foods: Food[];
  mealLogs: MealLogRecord[];
  usualMeals: UsualMeal[];
  exercises: Exercise[];
  usualExercises: UsualExercise[];
};

// 他端末への移行・バックアップ用に、全テーブルの内容を1つのJSONにまとめる。
export async function exportAllData(): Promise<ExportedData> {
  const [clients, measurements, foods, mealLogs, usualMeals, exercises, usualExercises] =
    await Promise.all([
      db.clients.toArray(),
      db.measurements.toArray(),
      db.foods.toArray(),
      db.mealLogs.toArray(),
      db.usualMeals.toArray(),
      db.exercises.toArray(),
      db.usualExercises.toArray(),
    ]);

  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    clients,
    measurements,
    foods,
    mealLogs,
    usualMeals,
    exercises,
    usualExercises,
  };
}

function isExportedData(value: unknown): value is ExportedData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    data.version === EXPORT_FORMAT_VERSION &&
    Array.isArray(data.clients) &&
    Array.isArray(data.measurements) &&
    Array.isArray(data.foods) &&
    Array.isArray(data.mealLogs) &&
    Array.isArray(data.usualMeals) &&
    Array.isArray(data.exercises) &&
    Array.isArray(data.usualExercises)
  );
}

export class ImportFormatError extends Error {
  constructor() {
    super(
      "ファイルの形式が正しくありません。このアプリからエクスポートしたJSONファイルを選択してください。",
    );
    this.name = "ImportFormatError";
  }
}

// インポートは既存データを全て置き換える(お客様データをこの端末に丸ごと
// 反映するための機能のため、マージではなく上書きにする)。
export async function importAllData(raw: unknown): Promise<void> {
  if (!isExportedData(raw)) {
    throw new ImportFormatError();
  }

  await db.transaction(
    "rw",
    [
      db.clients,
      db.measurements,
      db.foods,
      db.mealLogs,
      db.usualMeals,
      db.exercises,
      db.usualExercises,
    ],
    async () => {
      await Promise.all([
        db.clients.clear(),
        db.measurements.clear(),
        db.foods.clear(),
        db.mealLogs.clear(),
        db.usualMeals.clear(),
        db.exercises.clear(),
        db.usualExercises.clear(),
      ]);

      await Promise.all([
        db.clients.bulkAdd(raw.clients),
        db.measurements.bulkAdd(raw.measurements),
        db.foods.bulkAdd(raw.foods),
        db.mealLogs.bulkAdd(raw.mealLogs),
        db.usualMeals.bulkAdd(raw.usualMeals),
        db.exercises.bulkAdd(raw.exercises),
        db.usualExercises.bulkAdd(raw.usualExercises),
      ]);
    },
  );
}
