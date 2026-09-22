import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  belongsToClient,
  chunkedBatchInsert,
  subscribeToCollectionByClient,
} from "./firestore-helpers";
import type { DailyMealTotal } from "@/lib/health/meal-totals";

export const MEAL_LOGS_COLLECTION = "mealLogs";
const COLLECTION = MEAL_LOGS_COLLECTION;

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealLog = {
  id: string;
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

type MealLogDoc = Omit<MealLog, "id"> & {
  clientId: string;
  createdAt?: Timestamp | null;
};

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

function fromDoc(id: string, data: MealLogDoc): MealLog {
  const { clientId: _clientId, createdAt: _createdAt, ...rest } = data;
  return { id, ...rest };
}

export async function listMealLogsByDate(
  clientId: string,
  recordedAt: string,
): Promise<MealLog[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      where("recordedAt", "==", recordedAt),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs
    .map((d) => fromDoc(d.id, d.data() as MealLogDoc))
    .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType]);
}

export function subscribeToMealLogs(clientId: string, callback: () => void): Unsubscribe {
  return subscribeToCollectionByClient(db, COLLECTION, clientId, callback);
}

// listMealLogTotalsByDateRangeは食事記録タブを開くたびに(サマリー範囲+
// 履歴一覧の最大730日分の)2回、過去分もまるごと読み直していた。過去分は
// その日の記録をその場で編集しない限り書き換わらないため、クライアント単位で
// 「日付ごとの合計」全体をメモリ上にキャッシュし、呼び出し側が指定する範囲は
// そのキャッシュから絞り込むだけにする(その日の記録一覧・編集
// (listMealLogsByDate)は即座に反映する必要があるためキャッシュしない)。
//
// foods.ts(食品マスタ)と異なりlocalStorageへは永続化しない。food.ts側はほぼ
// 全お客様共通で編集頻度が低い1つのコレクションだが、こちらはクライアントごとに
// 分かれ、かつ案A(携帯Claude Code等からの直接登録)のように別プロセスから
// 頻繁に書き込まれる可能性がある。ページ再読み込み後も古いディスクキャッシュを
// 使い回してしまうと、再読み込み直後に登録直後のonSnapshotの初回発火
// (下記の理由で無視する)と重なり、新しい記録が最大10分反映されなくなる
// おそれがあるため、タブを開いている間のメモリキャッシュのみに留める。
const dailyTotalsCache = new Map<string, Promise<DailyMealTotal[]>>();
// 一度開いたクライアントのリアルタイム購読を張りっぱなしにすると、1つの
// タブで多数のお客様ページを渡り歩いた場合にFirestoreの購読が際限なく
// 増え続けてしまうため、直近アクセスしたクライアントだけ購読を保持する
// LRU(Map挿入順を利用)で上限を設ける。
const MAX_ARMED_CLIENTS = 20;
const dailyTotalsUnsubscribes = new Map<string, Unsubscribe>();

function armDailyTotalsCacheInvalidation(clientId: string) {
  const existing = dailyTotalsUnsubscribes.get(clientId);
  if (existing) {
    // LRU: 最近使ったものとして挿入順の末尾に移動する。
    dailyTotalsUnsubscribes.delete(clientId);
    dailyTotalsUnsubscribes.set(clientId, existing);
    return;
  }
  // onSnapshotは登録直後、実際の変更の有無にかかわらず必ず1回「現在の状態」で
  // 発火する。これを変更通知として扱うと、直前に作ったばかりのキャッシュを
  // 即座に破棄してしまい、キャッシュの意味が無くなるため、最初の1回は無視する
  // (このキャッシュはディスクに永続化しないため、armDailyTotalsCacheInvalidation
  // と同じlistAllDailyTotals呼び出しの中で必ず最新データを取得し直しており、
  // 直後の初回発火は常にその取得結果と同じはずである)。
  let isFirstSnapshot = true;
  const unsubscribe = subscribeToCollectionByClient(db, COLLECTION, clientId, () => {
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }
    dailyTotalsCache.delete(clientId);
  });
  dailyTotalsUnsubscribes.set(clientId, unsubscribe);

  if (dailyTotalsUnsubscribes.size > MAX_ARMED_CLIENTS) {
    const oldestClientId = dailyTotalsUnsubscribes.keys().next().value;
    if (oldestClientId !== undefined) {
      dailyTotalsUnsubscribes.get(oldestClientId)?.();
      dailyTotalsUnsubscribes.delete(oldestClientId);
      dailyTotalsCache.delete(oldestClientId);
    }
  }
}

async function listAllDailyTotals(clientId: string): Promise<DailyMealTotal[]> {
  armDailyTotalsCacheInvalidation(clientId);
  let cached = dailyTotalsCache.get(clientId);
  if (!cached) {
    cached = getDocs(
      query(collection(db, COLLECTION), where("clientId", "==", clientId)),
    ).then((snap) => {
      const totalsByDate = new Map<string, DailyMealTotal>();
      for (const d of snap.docs) {
        const row = d.data() as MealLogDoc;
        const existing = totalsByDate.get(row.recordedAt);
        if (existing) {
          existing.kcal += row.kcal;
          existing.proteinG += row.proteinG;
          existing.fatG += row.fatG;
          existing.carbG += row.carbG;
        } else {
          totalsByDate.set(row.recordedAt, {
            recordedAt: row.recordedAt,
            kcal: row.kcal,
            proteinG: row.proteinG,
            fatG: row.fatG,
            carbG: row.carbG,
          });
        }
      }
      return Array.from(totalsByDate.values()).sort((a, b) =>
        a.recordedAt.localeCompare(b.recordedAt),
      );
    });
    // 取得に失敗した場合はキャッシュに残さず、次回呼び出しで取得し直せるようにする。
    cached.catch(() => {
      dailyTotalsCache.delete(clientId);
    });
    dailyTotalsCache.set(clientId, cached);
  }
  return cached;
}

// 週次・月次サマリー・履歴一覧用。日付ごとの合計を、記録がある日だけ返す
// (記録がない日は呼び出し側で0埋めする)。
export async function listMealLogTotalsByDateRange(
  clientId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyMealTotal[]> {
  const all = await listAllDailyTotals(clientId);
  return all.filter((row) => row.recordedAt >= fromDate && row.recordedAt <= toDate);
}

export type InsertMealLogInput = {
  clientId: string;
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

// 複数件をまとめて登録する(食事記録フォームの複数行送信、「普段の3食から記録を作成」など)。
export async function insertMealLogs(inputs: InsertMealLogInput[]): Promise<void> {
  await chunkedBatchInsert(db, COLLECTION, inputs);
}

export type UpdateMealLogInput = {
  recordedAt: string;
  mealType: MealType;
  foodId: string | null;
  foodName: string;
  quantity: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  memo: string | null;
};

export async function updateMealLog(
  clientId: string,
  id: string,
  input: UpdateMealLogInput,
): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await updateDoc(doc(db, COLLECTION, id), { ...input });
}

export async function deleteMealLog(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

// 1日の合計を手入力で直すための「調整行」。品目とは別に1日1件だけ持ち、
// 品目合計との差分(負数可)を保存する。集計は他の記録と同じく単純に足し算される。
export const ADJUSTMENT_FOOD_NAME = "手入力調整";

export function isAdjustmentLog(log: Pick<MealLog, "foodId" | "foodName">): boolean {
  return log.foodId === null && log.foodName === ADJUSTMENT_FOOD_NAME;
}

// その日の調整行を差分amountsで置き換える(既存があれば更新、全て0なら削除)。
// dayLogsはその日の記録(呼び出し側が取得済みのもの。二重取得を避けるため受け取る)。
export async function setDailyAdjustment(
  clientId: string,
  recordedAt: string,
  dayLogs: MealLog[],
  amounts: { kcal: number; proteinG: number; fatG: number; carbG: number },
): Promise<void> {
  const [existing, ...extras] = dayLogs.filter(isAdjustmentLog);
  await Promise.all(extras.map((extra) => deleteMealLog(clientId, extra.id)));

  const isZero =
    amounts.kcal === 0 && amounts.proteinG === 0 && amounts.fatG === 0 && amounts.carbG === 0;
  if (isZero) {
    if (existing) await deleteMealLog(clientId, existing.id);
    return;
  }

  const fields = {
    recordedAt,
    mealType: "snack" as const,
    foodId: null,
    foodName: ADJUSTMENT_FOOD_NAME,
    quantity: 1,
    ...amounts,
    memo: null,
  };
  if (existing) {
    await updateMealLog(clientId, existing.id, fields);
  } else {
    await insertMealLogs([{ clientId, ...fields }]);
  }
}
