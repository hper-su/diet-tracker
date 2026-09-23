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

export const TRAINING_LOGS_COLLECTION = "trainingLogs";
const COLLECTION = TRAINING_LOGS_COLLECTION;

// 重さ・回数・セット数は「25,20」「10-8-6」「15(同上)」のように、セットごとの
// 変化をそのまま書き残す運用のため、数値ではなく自由入力の文字列として保持する。
export type TrainingLog = {
  id: string;
  recordedAt: string | null; // nullは日付不明(過去データ移行分のみ発生する)
  exerciseId: string | null;
  exerciseName: string;
  weight: string;
  reps: string;
  sets: string;
  memo: string | null;
};

type TrainingLogDoc = Omit<TrainingLog, "id"> & {
  clientId: string;
  createdAt?: Timestamp | null;
};

function fromDoc(id: string, data: TrainingLogDoc): TrainingLog {
  const { clientId: _clientId, createdAt: _createdAt, ...rest } = data;
  return { id, ...rest };
}

// 日付不明の記録は履歴上「最も古い」ものとして扱う(実施日が分からない過去
// データ移行分のみ発生する。並び替え用のキーとしてのみ使い、画面表示には使わない)。
const UNKNOWN_DATE_SORT_KEY = "0000-00-00";

export function trainingLogSortKey(recordedAt: string | null): string {
  return recordedAt ?? UNKNOWN_DATE_SORT_KEY;
}

export async function listTrainingLogsByDate(
  clientId: string,
  recordedAt: string,
): Promise<TrainingLog[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      where("recordedAt", "==", recordedAt),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => fromDoc(d.id, d.data() as TrainingLogDoc));
}

export function subscribeToTrainingLogs(clientId: string, callback: () => void): Unsubscribe {
  return subscribeToCollectionByClient(db, COLLECTION, clientId, callback);
}

// 筋トレ記録タブを開くたびに全件読み直すのを避けるため、食事記録
// (listMealLogTotalsByDateRange)と同じ方式でクライアント単位のメモリキャッシュを持つ。
// 実施日一覧(履歴)・実施回数サマリー(上部)の両方をこのキャッシュから作る。
const allLogsCache = new Map<string, Promise<TrainingLog[]>>();
// 1つのタブで多数のお客様ページを渡り歩いても購読が際限なく増え続けないよう、
// 直近アクセスしたクライアントだけ購読を保持するLRU(Map挿入順を利用)で上限を設ける。
const MAX_ARMED_CLIENTS = 20;
const allLogsUnsubscribes = new Map<string, Unsubscribe>();

function armCacheInvalidation(clientId: string) {
  const existing = allLogsUnsubscribes.get(clientId);
  if (existing) {
    // LRU: 最近使ったものとして挿入順の末尾に移動する。
    allLogsUnsubscribes.delete(clientId);
    allLogsUnsubscribes.set(clientId, existing);
    return;
  }
  // onSnapshotは登録直後、実際の変更の有無にかかわらず必ず1回「現在の状態」で
  // 発火する。これを変更通知として扱うと、直前に作ったばかりのキャッシュを
  // 即座に破棄してしまい、キャッシュの意味が無くなるため、最初の1回は無視する。
  let isFirstSnapshot = true;
  const unsubscribe = subscribeToCollectionByClient(db, COLLECTION, clientId, () => {
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }
    allLogsCache.delete(clientId);
  });
  allLogsUnsubscribes.set(clientId, unsubscribe);

  if (allLogsUnsubscribes.size > MAX_ARMED_CLIENTS) {
    const oldestClientId = allLogsUnsubscribes.keys().next().value;
    if (oldestClientId !== undefined) {
      allLogsUnsubscribes.get(oldestClientId)?.();
      allLogsUnsubscribes.delete(oldestClientId);
      allLogsCache.delete(oldestClientId);
    }
  }
}

async function listAllTrainingLogs(clientId: string): Promise<TrainingLog[]> {
  armCacheInvalidation(clientId);
  let cached = allLogsCache.get(clientId);
  if (!cached) {
    cached = getDocs(
      query(collection(db, COLLECTION), where("clientId", "==", clientId)),
    ).then((snap) => snap.docs.map((d) => fromDoc(d.id, d.data() as TrainingLogDoc)));
    // 取得に失敗した場合はキャッシュに残さず、次回呼び出しで取得し直せるようにする。
    cached.catch(() => {
      allLogsCache.delete(clientId);
    });
    allLogsCache.set(clientId, cached);
  }
  return cached;
}

export type TrainingDaySummary = {
  recordedAt: string | null;
  exerciseCount: number;
  exerciseNames: string[];
};

// 履歴一覧用。記録がある日(または「日付不明」)ごとに件数と種目名をまとめる。
export async function listTrainingDates(clientId: string): Promise<TrainingDaySummary[]> {
  const all = await listAllTrainingLogs(clientId);
  const byDate = new Map<string, TrainingDaySummary>();
  for (const log of all) {
    const key = trainingLogSortKey(log.recordedAt);
    const existing = byDate.get(key);
    if (existing) {
      existing.exerciseCount += 1;
      existing.exerciseNames.push(log.exerciseName);
    } else {
      byDate.set(key, {
        recordedAt: log.recordedAt,
        exerciseCount: 1,
        exerciseNames: [log.exerciseName],
      });
    }
  }
  return Array.from(byDate.values()).sort((a, b) =>
    trainingLogSortKey(a.recordedAt).localeCompare(trainingLogSortKey(b.recordedAt)),
  );
}

export type ExerciseFrequency = {
  exerciseId: string | null;
  exerciseName: string;
  count: number;
  lastRecordedAt: string | null;
  lastWeight: string;
  lastReps: string;
  lastSets: string;
};

// 上部の「実施数が多い種目」サマリー用。日付不明の記録は「直近の記録」の
// 更新対象からは除くが、実施回数のカウントには含める。
export async function listExerciseFrequencies(clientId: string): Promise<ExerciseFrequency[]> {
  const all = await listAllTrainingLogs(clientId);
  const byExercise = new Map<string, ExerciseFrequency>();
  for (const log of all) {
    const key = log.exerciseId ?? `name:${log.exerciseName}`;
    const existing = byExercise.get(key);
    if (!existing) {
      byExercise.set(key, {
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        count: 1,
        lastRecordedAt: log.recordedAt,
        lastWeight: log.weight,
        lastReps: log.reps,
        lastSets: log.sets,
      });
      continue;
    }
    existing.count += 1;
    if (
      log.recordedAt !== null &&
      (existing.lastRecordedAt === null || log.recordedAt >= existing.lastRecordedAt)
    ) {
      existing.lastRecordedAt = log.recordedAt;
      existing.lastWeight = log.weight;
      existing.lastReps = log.reps;
      existing.lastSets = log.sets;
    }
  }
  return Array.from(byExercise.values()).sort((a, b) => b.count - a.count);
}

export type InsertTrainingLogInput = {
  clientId: string;
  recordedAt: string | null;
  exerciseId: string | null;
  exerciseName: string;
  weight: string;
  reps: string;
  sets: string;
  memo: string | null;
};

// 複数件をまとめて登録する(筋トレ記録フォームの複数行送信、過去データ移行など)。
export async function insertTrainingLogs(inputs: InsertTrainingLogInput[]): Promise<void> {
  await chunkedBatchInsert(db, COLLECTION, inputs);
}

export type UpdateTrainingLogInput = {
  recordedAt: string;
  exerciseId: string | null;
  exerciseName: string;
  weight: string;
  reps: string;
  sets: string;
  memo: string | null;
};

export async function updateTrainingLog(
  clientId: string,
  id: string,
  input: UpdateTrainingLogInput,
): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await updateDoc(doc(db, COLLECTION, id), { ...input });
}

export async function deleteTrainingLog(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
