import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
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

const COLLECTIONS = [
  "clients",
  "measurements",
  "foods",
  "mealLogs",
  "usualMeals",
  "exercises",
  "usualExercises",
  "protocolChecks",
] as const;

// バックアップ・共有DBの障害時復旧用に、全コレクションの内容を1つのJSONにまとめる。
export async function exportAllData(): Promise<ExportedData> {
  const [
    clientsSnap,
    measurementsSnap,
    foodsSnap,
    mealLogsSnap,
    usualMealsSnap,
    exercisesSnap,
    usualExercisesSnap,
    protocolChecksSnap,
  ] = await Promise.all(COLLECTIONS.map((name) => getDocs(collection(db, name))));

  const clients: ClientRecord[] = clientsSnap.docs.map((d) => {
    const { createdAt, ...rest } = d.data() as Record<string, unknown> & {
      createdAt?: Timestamp;
    };
    return {
      ...(rest as Omit<ClientRecord, "id" | "createdAt">),
      id: d.id,
      createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
    };
  });

  // measurements/mealLogs/usualMeals/usualExercises/protocolChecksのcreatedAtは
  // Firestore内部の並び順用フィールド(元のPostgres版のidの代わり)であり、
  // エクスポート形式には含めない(インポート時にimportAllData側で作り直す)。
  function stripCreatedAt<T extends { createdAt?: unknown }>(
    data: T,
  ): Omit<T, "createdAt"> {
    const { createdAt: _createdAt, ...rest } = data;
    return rest;
  }

  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    clients,
    measurements: measurementsSnap.docs.map(
      (d) => ({ id: d.id, ...stripCreatedAt(d.data()) }) as MeasurementRecord,
    ),
    foods: foodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Food),
    mealLogs: mealLogsSnap.docs.map(
      (d) => ({ id: d.id, ...stripCreatedAt(d.data()) }) as MealLogRecord,
    ),
    usualMeals: usualMealsSnap.docs.map(
      (d) => ({ id: d.id, ...stripCreatedAt(d.data()) }) as UsualMeal,
    ),
    exercises: exercisesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Exercise),
    usualExercises: usualExercisesSnap.docs.map(
      (d) => ({ id: d.id, ...stripCreatedAt(d.data()) }) as UsualExercise,
    ),
    protocolChecks: protocolChecksSnap.docs.map(
      (d) => ({ id: d.id, ...stripCreatedAt(d.data()) }) as ProtocolCheckRecord,
    ),
  };
}

// exportしているのはテスト容易性のため(importAllDataはFirestoreへの通信を
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

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonEmptyId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// 旧Supabase版のバックアップJSONは数値idのまま(id/clientId/foodId/exerciseId)
// なので、Firestoreのドキュメントid(文字列)として扱えるよう先に文字列化する。
// 新しいFirestore版のエクスポートは最初から文字列idなので、この変換は素通りする。
export function normalizeLegacyIds(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  function toIdString(value: unknown): unknown {
    return value == null ? value : String(value);
  }
  function mapArray(value: unknown, keys: string[]): unknown {
    if (!Array.isArray(value)) return value;
    return value.map((row) => {
      if (typeof row !== "object" || row === null) return row;
      const next = { ...(row as Record<string, unknown>) };
      for (const key of keys) {
        if (key in next) next[key] = toIdString(next[key]);
      }
      return next;
    });
  }
  return {
    ...raw,
    clients: mapArray(raw.clients, ["id"]),
    measurements: mapArray(raw.measurements, ["id", "clientId"]),
    foods: mapArray(raw.foods, ["id"]),
    mealLogs: mapArray(raw.mealLogs, ["id", "clientId", "foodId"]),
    usualMeals: mapArray(raw.usualMeals, ["id", "clientId", "foodId"]),
    exercises: mapArray(raw.exercises, ["id"]),
    usualExercises: mapArray(raw.usualExercises, ["id", "clientId", "exerciseId"]),
    protocolChecks: mapArray(raw.protocolChecks, ["id", "clientId"]),
  };
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
    if (!isNonEmptyId(client.id) || !client.name) {
      throw new ImportFormatError("お客様データの形式が正しくありません。");
    }
  }

  for (const food of data.foods) {
    if (
      !isNonEmptyId(food.id) ||
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
      !isNonEmptyId(exercise.id) ||
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

const BATCH_SIZE = 450;

async function deleteAllDocs(collectionName: string): Promise<void> {
  const snap = await getDocs(collection(db, collectionName));
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const d of snap.docs.slice(i, i + BATCH_SIZE)) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}

// 同じ日付・同じお客様内での並び順を復元するためのcreatedAt代用値。
// 旧Supabase版の連番id("42"など)は登録順を表していたため、その数値をそのまま
// ミリ秒に変換して使うと元の順序を保てる。Firestore生まれのid(ランダムな
// 英数字文字列)はNumber()がNaNになるため、その場合は現在時刻+配列内の
// 位置(index)をずらして使う(同一ループ内でTimestamp.now()を繰り返すと
// ほぼ同時刻になり、元の順序が復元後に崩れてしまうため)。
function orderingTimestamp(id: string, index: number): Timestamp {
  const n = Number(id);
  return Number.isFinite(n) ? Timestamp.fromMillis(n) : Timestamp.fromMillis(Date.now() + index);
}

// 各レコードのidをそのままFirestoreのドキュメントIDとして使う(addDocによる
// 自動採番はしない)。これにより、クライアント側で持っているclientId/foodId/
// exerciseIdの参照値をそのまま使い続けられ、旧→新idの付け替えが不要になる。
async function setAllDocs<T extends { id: string }>(
  collectionName: string,
  rows: T[],
  extra?: (row: T, index: number) => Record<string, unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    rows.slice(i, i + BATCH_SIZE).forEach((row, offset) => {
      const { id, ...rest } = row;
      batch.set(doc(db, collectionName, id), { ...rest, ...extra?.(row, i + offset) });
    });
    await batch.commit();
  }
}

// 1コレクションぶんの「全削除→再投入」をまとめて行う。削除と再投入を
// コレクションごとに直列で行うことで、途中のコレクションで失敗しても、
// まだ手を付けていない後続のコレクションは削除前の(古いままの)データが
// 残る(全コレクションを先に削除してから再投入する場合に比べ、失敗時に
// 失われるデータの範囲を最小限にできる)。
async function replaceCollection<T extends { id: string }>(
  collectionName: string,
  rows: T[],
  extra?: (row: T, index: number) => Record<string, unknown>,
): Promise<void> {
  await deleteAllDocs(collectionName);
  await setAllDocs(collectionName, rows, extra);
}

// インポートは既存データを全て置き換える(共有DBの内容を丸ごと差し替えるための
// 機能のため、マージではなく上書きにする)。Firestoreには複数コレクションに
// またがる一括トランザクションが無いため、コレクションごとに「全削除→
// writeBatchで再投入」を順番に行う(Postgres版のような単一トランザクションでの
// 完全な原子性ではなくなるが、この規模のデータ量では現実的な範囲)。
export async function importAllData(raw: unknown): Promise<void> {
  if (typeof raw !== "object" || raw === null) {
    throw new ImportFormatError();
  }
  const normalized = normalizeLegacyIds(raw as Record<string, unknown>);
  if (!isExportedData(normalized)) {
    throw new ImportFormatError();
  }
  const data = validateAndSanitize(normalized);

  const clientCreatedAt = new Map(
    data.clients.map((c) => [c.id, c.createdAt] as const),
  );

  await replaceCollection("clients", data.clients, (client) => ({
    createdAt: clientCreatedAt.get(client.id)
      ? Timestamp.fromDate(new Date(clientCreatedAt.get(client.id)!))
      : serverTimestamp(),
  }));
  await replaceCollection("foods", data.foods);
  await replaceCollection("exercises", data.exercises);
  await replaceCollection("measurements", data.measurements, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("mealLogs", data.mealLogs, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("usualMeals", data.usualMeals, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("usualExercises", data.usualExercises, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("protocolChecks", data.protocolChecks, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
}
