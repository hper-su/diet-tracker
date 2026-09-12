import { supabase, selectAllRows } from "./supabase";
import type {
  ClientRecord,
  MeasurementRecord,
  MealLogRecord,
  ProtocolCheckRecord,
} from "./client";
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
  protocolChecks: ProtocolCheckRecord[];
};

// バックアップ・共有DBの障害時復旧用に、全テーブルの内容を1つのJSONにまとめる。
export async function exportAllData(): Promise<ExportedData> {
  const [
    clients,
    measurements,
    foods,
    mealLogs,
    usualMeals,
    exercises,
    usualExercises,
    protocolChecks,
  ] = await Promise.all([
    selectAllRows<ClientRecord>("clients"),
    selectAllRows<MeasurementRecord>("measurements"),
    selectAllRows<Food>("foods"),
    selectAllRows<MealLogRecord>("mealLogs"),
    selectAllRows<UsualMeal>("usualMeals"),
    selectAllRows<Exercise>("exercises"),
    selectAllRows<UsualExercise>("usualExercises"),
    selectAllRows<ProtocolCheckRecord>("protocolChecks"),
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
    protocolChecks,
  };
}

// exportしているのはテスト容易性のため(importAllDataはSupabaseへの通信を
// 伴うため、その手前までの純粋なロジックを個別に検証できるようにする)。
export function isExportedData(
  value: unknown,
): value is Omit<ExportedData, "protocolChecks"> & {
  protocolChecks?: ProtocolCheckRecord[];
} {
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
    Array.isArray(data.usualExercises) &&
    // protocolChecksはこの機能追加より前のエクスポートJSONには存在しないため、
    // 無ければ空配列として扱えるよう任意項目にする(フォーマットversionは1のまま)。
    (data.protocolChecks === undefined || Array.isArray(data.protocolChecks))
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
const UNIQUE_VIOLATION = "23505";

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// isExportedDataは全体の形(配列かどうか)しか見ていないため、手編集・他端末での
// マージ・旧バージョンのエクスポート等で個々のレコードの内容がおかしい場合を
// ここで弾く。参照先が無いfoodId/exerciseIdは(既存の「食品削除時にnullにする」
// 挙動と同じ扱いで)nullに補正し、参照先の無いclientIdなど補正できないものは
// エラーにする。
export function validateAndSanitize(
  data: Omit<ExportedData, "protocolChecks"> & {
    protocolChecks?: ProtocolCheckRecord[];
  },
): ExportedData {
  const clientIds = new Set(data.clients.map((c) => c.id));
  const foodIds = new Set(data.foods.map((f) => f.id));
  const exerciseIds = new Set(data.exercises.map((e) => e.id));
  const protocolChecks = data.protocolChecks ?? [];

  for (const check of protocolChecks) {
    if (!clientIds.has(check.clientId)) {
      throw new ImportFormatError(
        "動作チェックに、存在しないお客様を参照している行があります。",
      );
    }
  }

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

  return { ...data, mealLogs, usualMeals, usualExercises, protocolChecks };
}

// インポートは既存データを全て置き換える(共有DBの内容を丸ごと差し替えるための
// 機能のため、マージではなく上書きにする)。削除・再投入・シーケンス調整を
// Postgres側のimport_all_data関数(supabase/schema.sql参照)にまとめて1回の
// トランザクションで行うことで、途中の1テーブルだけ失敗して共有DBが
// 中途半端な状態のまま残る事態を防ぐ(失敗時はDB側で自動的に全ロールバックされる)。
export async function importAllData(raw: unknown): Promise<void> {
  if (!isExportedData(raw)) {
    throw new ImportFormatError();
  }
  const data = validateAndSanitize(raw);

  const { error } = await supabase.rpc("import_all_data", { payload: data });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new ImportFormatError(
        "食品マスタまたは運動マスタに、同じ分類・名前の重複データが含まれているためインポートできませんでした。",
      );
    }
    throw error;
  }
}
