import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { runChunkedBatches, subscribeToCollection } from "./firestore-helpers";

export const EXERCISES_COLLECTION = "exercises";
const COLLECTION = EXERCISES_COLLECTION;

export type Exercise = {
  id: string;
  name: string;
  aliases: string[];
  // 対応するwger(https://wger.de)の種目ID。未設定・過去のバックアップには無いため省略可。
  wgerId?: number | null;
};

type ExerciseDoc = Omit<Exercise, "id"> & { createdAt?: Timestamp | null };

function fromDoc(id: string, data: ExerciseDoc): Exercise {
  const { createdAt: _createdAt, ...rest } = data;
  return { id, ...rest };
}

// 種目マスタは100〜200件程度の見込みで、食品マスタ(3,000件超)ほどの規模には
// ならないため、localStorage永続化やページングは行わず、メモリキャッシュのみで済ませる。
let exercisesCache: Promise<Exercise[]> | null = null;
let cacheInvalidationArmed = false;

function armCacheInvalidation() {
  if (cacheInvalidationArmed) return;
  cacheInvalidationArmed = true;
  // onSnapshotは登録直後、実際の変更の有無にかかわらず必ず1回「現在の状態」で
  // 発火する。これを変更通知として扱うと、直前に作ったばかりのキャッシュを
  // 即座に破棄してしまい、キャッシュの意味が無くなるため、最初の1回は無視する。
  let isFirstSnapshot = true;
  subscribeToCollection(db, COLLECTION, () => {
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }
    exercisesCache = null;
  });
}

export async function listExercises(): Promise<Exercise[]> {
  armCacheInvalidation();
  if (!exercisesCache) {
    exercisesCache = getDocs(collection(db, COLLECTION)).then((snap) =>
      snap.docs
        .map((d) => fromDoc(d.id, d.data() as ExerciseDoc))
        .sort((a, b) => a.name.localeCompare(b.name, "ja")),
    );
    // 取得に失敗した場合はキャッシュに残さず、次回呼び出しで取得し直せるようにする。
    exercisesCache.catch(() => {
      exercisesCache = null;
    });
  }
  return exercisesCache;
}

export function subscribeToExercises(callback: () => void): Unsubscribe {
  return subscribeToCollection(db, COLLECTION, callback);
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const all = await listExercises();
  return all.find((exercise) => exercise.id === id) ?? null;
}

export type InsertExerciseInput = {
  name: string;
  aliases: string[];
  wgerId: number | null;
};

export type InsertExerciseResult =
  | { ok: true }
  | { ok: false; error: "duplicate_name" };

async function findDuplicate(name: string, excludeId?: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("name", "==", name)),
  );
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function insertExercise(input: InsertExerciseInput): Promise<InsertExerciseResult> {
  if (await findDuplicate(input.name)) {
    return { ok: false, error: "duplicate_name" };
  }
  await addDoc(collection(db, COLLECTION), { ...input, createdAt: serverTimestamp() });
  return { ok: true };
}

export type UpdateExerciseInput = InsertExerciseInput;

export type UpdateExerciseResult = InsertExerciseResult;

export async function updateExercise(
  id: string,
  input: UpdateExerciseInput,
): Promise<UpdateExerciseResult> {
  if (await findDuplicate(input.name, id)) {
    return { ok: false, error: "duplicate_name" };
  }
  await updateDoc(doc(db, COLLECTION, id), { ...input });
  return { ok: true };
}

// trainingLogsのexerciseIdは、食品マスタのdeleteFoodと同様に、削除時に
// 参照側を明示的にnullへ補正する(exerciseName等はスナップショットとして
// 残っているので表示上の実害はない)。
export async function deleteExercise(id: string): Promise<void> {
  const referencing = await getDocs(
    query(collection(db, "trainingLogs"), where("exerciseId", "==", id)),
  );
  await runChunkedBatches(db, referencing.docs, (batch, d) => {
    batch.update(d.ref, { exerciseId: null });
  });
  await deleteDoc(doc(db, COLLECTION, id));
}
