import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { runChunkedBatches } from "./firestore-helpers";
import type {
  ClientRecord,
  MeasurementRecord,
  MealLogRecord,
  ProtocolCheckRecord,
} from "./client";
import type { Food } from "./foods";
import type { UsualMeal } from "./usual-meals";
import { isActivityLevel } from "@/lib/health/activity-level";

export const EXPORT_FORMAT_VERSION = 1;

export type ExportedData = {
  version: typeof EXPORT_FORMAT_VERSION;
  exportedAt: string;
  clients: ClientRecord[];
  measurements: MeasurementRecord[];
  foods: Food[];
  mealLogs: MealLogRecord[];
  usualMeals: UsualMeal[];
  protocolChecks: ProtocolCheckRecord[];
};

const COLLECTIONS = [
  "clients",
  "measurements",
  "foods",
  "mealLogs",
  "usualMeals",
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

  // measurements/mealLogs/usualMeals/protocolChecksのcreatedAtは
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

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// 旧Postgres版はUNIQUE(category, name)制約で食品マスタの重複登録を
// 防いでいたが、Firestoreには同等の制約が無い。手編集・他端末とのマージ等で
// 重複が紛れ込んだJSONをそのまま取り込むと、食品選択のコンボボックスに
// 同名の候補が並んでしまうため、インポート時にも同じ制約をここで再現する。
function assertNoDuplicateKey<T>(
  rows: T[],
  keyOf: (row: T) => string,
  message: string,
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) {
      throw new ImportFormatError(message);
    }
    seen.add(key);
  }
}

// 旧Supabase版のバックアップJSONは数値idのまま(id/clientId/foodId)
// なので、Firestoreのドキュメントid(文字列)として扱えるよう先に文字列化する。
// 新しいFirestore版のエクスポートは最初から文字列idなので、この変換は素通りする。
function normalizeLegacyIds(
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
    protocolChecks: mapArray(raw.protocolChecks, ["id", "clientId"]),
  };
}

// isExportedDataは全体の形(配列かどうか)しか見ていないため、手編集・他端末での
// マージ・旧バージョンのエクスポート等で個々のレコードの内容がおかしい場合を
// ここで弾く。参照先が無いfoodIdは(既存の「食品削除時にnullにする」
// 挙動と同じ扱いで)nullに補正し、参照先の無いclientIdなど補正できないものは
// エラーにする。
export function validateAndSanitize(
  data: Omit<ExportedData, "protocolChecks"> & {
    protocolChecks?: ProtocolCheckRecord[];
  },
): ExportedData {
  const clientIds = new Set(data.clients.map((c) => c.id));
  const foodIds = new Set(data.foods.map((f) => f.id));
  const protocolChecks = data.protocolChecks ?? [];

  for (const check of protocolChecks) {
    if (!clientIds.has(check.clientId)) {
      throw new ImportFormatError(
        "動作チェックに、存在しないお客様を参照している行があります。",
      );
    }
  }

  for (const client of data.clients) {
    if (
      !isNonEmptyId(client.id) ||
      !client.name ||
      !isActivityLevel(client.activityLevel)
    ) {
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
  assertNoDuplicateKey(
    data.foods,
    (food) => `${food.category} ${food.name}`,
    "食品マスタに、分類・食品名が重複している行があります。",
  );

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
    // 「1日の合計の手入力修正」の調整行は差分を保存するため、栄養値は負数も許可する。
    if (
      !MEAL_TYPES.has(log.mealType) ||
      !(log.quantity > 0) ||
      typeof log.recordedAt !== "string" ||
      !log.recordedAt ||
      !isFiniteNumber(log.kcal) ||
      !isFiniteNumber(log.proteinG) ||
      !isFiniteNumber(log.fatG) ||
      !isFiniteNumber(log.carbG)
    ) {
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
    if (
      !MEAL_TYPES.has(meal.mealType) ||
      !(meal.quantity > 0) ||
      !isFiniteNonNegative(meal.kcal) ||
      !isFiniteNonNegative(meal.proteinG) ||
      !isFiniteNonNegative(meal.fatG) ||
      !isFiniteNonNegative(meal.carbG)
    ) {
      throw new ImportFormatError("普段の食事のデータ形式が正しくありません。");
    }
    return meal.foodId != null && !foodIds.has(meal.foodId)
      ? { ...meal, foodId: null }
      : meal;
  });

  return { ...data, mealLogs, usualMeals, protocolChecks };
}

async function deleteDocsByIds(collectionName: string, ids: string[]): Promise<void> {
  await runChunkedBatches(db, ids, (batch, id) => {
    batch.delete(doc(db, collectionName, id));
  });
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
// 自動採番はしない)。これにより、クライアント側で持っているclientId/foodIdの
// 参照値をそのまま使い続けられ、旧→新idの付け替えが不要になる。
async function setAllDocs<T extends { id: string }>(
  collectionName: string,
  rows: T[],
  extra?: (row: T, index: number) => Record<string, unknown>,
): Promise<void> {
  await runChunkedBatches(db, rows, (batch, row, index) => {
    const { id, ...rest } = row;
    batch.set(doc(db, collectionName, id), { ...rest, ...extra?.(row, index) });
  });
}

// 1コレクションぶんを「新データで上書き→新データに無い古い行だけ削除」の順で
// 置き換える。先に全削除してから再投入する方式だと、再投入の途中で失敗した
// 場合にそのコレクションのデータが失われてしまう。この順序なら、上書きの途中で
// 失敗しても(そのコレクションが新旧混在になるだけで)何も失われず、削除の途中で
// 失敗しても新データは既に反映済みなので、再インポートすれば復旧できる。
async function replaceCollection<T extends { id: string }>(
  collectionName: string,
  rows: T[],
  extra?: (row: T, index: number) => Record<string, unknown>,
): Promise<void> {
  const existingIds = (await getDocs(collection(db, collectionName))).docs.map((d) => d.id);
  await setAllDocs(collectionName, rows, extra);
  const newIds = new Set(rows.map((row) => row.id));
  const staleIds = existingIds.filter((id) => !newIds.has(id));
  await deleteDocsByIds(collectionName, staleIds);
}

// インポートは既存データを全て置き換える(共有DBの内容を丸ごと差し替えるための
// 機能のため、マージではなく上書きにする)。Firestoreには複数コレクションに
// またがる一括トランザクションが無いため、コレクションごとに直列で
// replaceCollection(上書き→古い行だけ削除)を行う(Postgres版のような
// 単一トランザクションでの完全な原子性ではないが、上記の順序により
// 「失敗時に何かが失われる」ケースを避けている)。
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
  await replaceCollection("measurements", data.measurements, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("mealLogs", data.mealLogs, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("usualMeals", data.usualMeals, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
  await replaceCollection("protocolChecks", data.protocolChecks, (row, index) => ({
    createdAt: orderingTimestamp(row.id, index),
  }));
}
