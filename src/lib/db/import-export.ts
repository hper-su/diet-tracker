import Dexie from "dexie";
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
  constructor(message?: string) {
    super(
      message ??
        "ファイルの形式が正しくありません。このアプリからエクスポートしたJSONファイルを選択してください。",
    );
    this.name = "ImportFormatError";
  }
}

const MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);
const EXERCISE_CATEGORIES = new Set(["生活活動", "運動"]);

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// isExportedDataは全体の形(配列かどうか)しか見ていないため、手編集・他端末での
// マージ・旧バージョンのエクスポート等で個々のレコードの内容がおかしい場合を
// ここで弾く。参照先が無いfoodId/exerciseIdは(既存の「食品削除時にnullにする」
// 挙動と同じ扱いで)nullに補正し、参照先の無いclientIdなど補正できないものは
// エラーにする。
function validateAndSanitize(data: ExportedData): ExportedData {
  const clientIds = new Set(data.clients.map((c) => c.id));
  const foodIds = new Set(data.foods.map((f) => f.id));
  const exerciseIds = new Set(data.exercises.map((e) => e.id));

  for (const client of data.clients) {
    if (!Number.isInteger(client.id) || client.id <= 0 || !client.name) {
      throw new ImportFormatError("お客様データの形式が正しくありません。");
    }
  }

  for (const food of data.foods) {
    if (
      !Number.isInteger(food.id) ||
      food.id <= 0 ||
      !food.name ||
      !isFiniteNonNegative(food.kcal) ||
      !isFiniteNonNegative(food.proteinG) ||
      !isFiniteNonNegative(food.fatG) ||
      !isFiniteNonNegative(food.carbG)
    ) {
      throw new ImportFormatError("食品マスタのデータ形式が正しくありません。");
    }
  }

  for (const exercise of data.exercises) {
    if (
      !Number.isInteger(exercise.id) ||
      exercise.id <= 0 ||
      !EXERCISE_CATEGORIES.has(exercise.category) ||
      !exercise.name ||
      !(typeof exercise.mets === "number" && exercise.mets > 0)
    ) {
      throw new ImportFormatError("運動マスタのデータ形式が正しくありません。");
    }
  }

  for (const measurement of data.measurements) {
    if (!clientIds.has(measurement.clientId)) {
      throw new ImportFormatError(
        "測定記録に、存在しないお客様を参照している行があります。",
      );
    }
  }

  const mealLogs = data.mealLogs.map((log) => {
    if (!clientIds.has(log.clientId)) {
      throw new ImportFormatError(
        "食事記録に、存在しないお客様を参照している行があります。",
      );
    }
    if (!MEAL_TYPES.has(log.mealType) || !(log.quantity > 0)) {
      throw new ImportFormatError("食事記録のデータ形式が正しくありません。");
    }
    return log.foodId != null && !foodIds.has(log.foodId)
      ? { ...log, foodId: null }
      : log;
  });

  const usualMeals = data.usualMeals.map((meal) => {
    if (!clientIds.has(meal.clientId)) {
      throw new ImportFormatError(
        "普段の食事に、存在しないお客様を参照している行があります。",
      );
    }
    if (!MEAL_TYPES.has(meal.mealType) || !(meal.quantity > 0)) {
      throw new ImportFormatError("普段の食事のデータ形式が正しくありません。");
    }
    return meal.foodId != null && !foodIds.has(meal.foodId)
      ? { ...meal, foodId: null }
      : meal;
  });

  const usualExercises = data.usualExercises.map((habit) => {
    if (!clientIds.has(habit.clientId)) {
      throw new ImportFormatError(
        "普段の運動習慣に、存在しないお客様を参照している行があります。",
      );
    }
    if (!(habit.durationMin > 0) || !(habit.frequencyPerWeek > 0) || !(habit.mets > 0)) {
      throw new ImportFormatError("普段の運動習慣のデータ形式が正しくありません。");
    }
    return habit.exerciseId != null && !exerciseIds.has(habit.exerciseId)
      ? { ...habit, exerciseId: null }
      : habit;
  });

  return { ...data, mealLogs, usualMeals, usualExercises };
}

// インポートは既存データを全て置き換える(お客様データをこの端末に丸ごと
// 反映するための機能のため、マージではなく上書きにする)。
export async function importAllData(raw: unknown): Promise<void> {
  if (!isExportedData(raw)) {
    throw new ImportFormatError();
  }
  const data = validateAndSanitize(raw);

  try {
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
          db.clients.bulkAdd(data.clients),
          db.measurements.bulkAdd(data.measurements),
          db.foods.bulkAdd(data.foods),
          db.mealLogs.bulkAdd(data.mealLogs),
          db.usualMeals.bulkAdd(data.usualMeals),
          db.exercises.bulkAdd(data.exercises),
          db.usualExercises.bulkAdd(data.usualExercises),
        ]);
      },
    );
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) {
      throw new ImportFormatError(
        "食品マスタまたは運動マスタに、同じ分類・名前の重複データが含まれているためインポートできませんでした。",
      );
    }
    throw error;
  }
}
