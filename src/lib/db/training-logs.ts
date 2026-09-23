import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
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

// 日付不明(recordedAt=null、過去データ移行分)の記録一覧。listTrainingLogsByDate
// は具体的な日付でしか一致しないため、これらは別クエリで取得する必要がある
// (履歴一覧の「日付不明」行から開けるようにするため)。
export async function listTrainingLogsByUnknownDate(clientId: string): Promise<TrainingLog[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      where("recordedAt", "==", null),
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

// 書き込み後、Firestoreの onSnapshot 通知(非同期・多少のラグがある)を待たずに
// その場でキャッシュを破棄する。onSnapshotによる無効化(他端末からの変更向け)は
// 引き続き残すが、自分自身が行った書き込みの反映はこちらで即時に行う。
function invalidateAllLogsCache(clientId: string): void {
  allLogsCache.delete(clientId);
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
  hasMemo: boolean;
};

// 履歴一覧用。記録がある日(または「日付不明」)ごとに件数と種目名をまとめる。
// その日の総括メモ行(isDayMemoLog)は種目ではないので、exerciseCount/
// exerciseNamesには含めない(hasMemoで別途存在を示す)。メモだけの日
// (種目は1件も無いがメモだけある日)も履歴に出したいため、メモ行だけの日も
// エントリを作る。
export async function listTrainingDates(clientId: string): Promise<TrainingDaySummary[]> {
  const all = await listAllTrainingLogs(clientId);
  const byDate = new Map<string, TrainingDaySummary>();
  for (const log of all) {
    const key = trainingLogSortKey(log.recordedAt);
    const existing = byDate.get(key) ?? {
      recordedAt: log.recordedAt,
      exerciseCount: 0,
      exerciseNames: [],
      hasMemo: false,
    };
    if (isDayMemoLog(log)) {
      existing.hasMemo = true;
    } else {
      existing.exerciseCount += 1;
      existing.exerciseNames.push(log.exerciseName);
    }
    byDate.set(key, existing);
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
// 更新対象からは除くが、実施回数のカウントには含める。その日の総括メモ行
// (isDayMemoLog)は種目ではないため集計から除外する。
export async function listExerciseFrequencies(clientId: string): Promise<ExerciseFrequency[]> {
  const all = await listAllTrainingLogs(clientId);
  const byExercise = new Map<string, ExerciseFrequency>();
  for (const log of all) {
    if (isDayMemoLog(log)) continue;
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
  for (const clientId of new Set(inputs.map((input) => input.clientId))) {
    invalidateAllLogsCache(clientId);
  }
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
  invalidateAllLogsCache(clientId);
}

export async function deleteTrainingLog(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
  invalidateAllLogsCache(clientId);
}

// その日全体の総括メモ(体調・様子・次回への申し送りなど)。種目ごとのmemoとは別に、
// 1日1件だけ持つ(食事記録の「手入力調整」行と同じ考え方で、種目を持たない特別な
// 1行として同じコレクションに保存する)。
const DAY_MEMO_EXERCISE_NAME = "その日の総括メモ";

export function isDayMemoLog(log: Pick<TrainingLog, "exerciseId" | "exerciseName">): boolean {
  return log.exerciseId === null && log.exerciseName === DAY_MEMO_EXERCISE_NAME;
}

// クライアント×日付ごとに固定のドキュメントIDにする(addDocによるランダムID
// 採番はしない)。ランダムIDのまま「既存を読んで無ければ作る」実装だと、
// ほぼ同時に2回保存された場合にどちらも「既存なし」と判定して2件作ってしまう
// 競合が起こり得るが、固定IDへのsetDoc(上書き)にすることで、同時に保存されても
// 常に1件に収束するようにする。
function dayMemoDocId(clientId: string, recordedAt: string): string {
  return `dayMemo_${clientId}_${recordedAt}`;
}

// その日の総括メモ行を、指定した内容で置き換える(既存があれば更新、空文字なら削除)。
// dayLogsはその日の記録(呼び出し側が取得済みのもの。二重取得を避けるため受け取る)。
export async function setDailyMemo(
  clientId: string,
  recordedAt: string,
  dayLogs: TrainingLog[],
  memo: string,
): Promise<void> {
  const targetId = dayMemoDocId(clientId, recordedAt);
  // 本来の固定ID以外の総括メモ行(このスキーマ導入前にランダムIDで作られたもの、
  // または稀に他の異常で紛れ込んだもの)が残っていれば削除する。
  const staleExtras = dayLogs.filter((log) => isDayMemoLog(log) && log.id !== targetId);
  await Promise.all(staleExtras.map((extra) => deleteTrainingLog(clientId, extra.id)));

  const trimmed = memo.trim();
  const ref = doc(db, COLLECTION, targetId);
  if (!trimmed) {
    // Firestoreのdeleteは対象が存在しなくてもエラーにならない(冪等)。
    await deleteDoc(ref);
  } else {
    await setDoc(ref, {
      clientId,
      recordedAt,
      exerciseId: null,
      exerciseName: DAY_MEMO_EXERCISE_NAME,
      weight: "",
      reps: "",
      sets: "",
      memo: trimmed,
      createdAt: serverTimestamp(),
    });
  }
  invalidateAllLogsCache(clientId);
}
