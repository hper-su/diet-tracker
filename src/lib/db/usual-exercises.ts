import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { assertBelongsToClient } from "./firestore-helpers";

const COLLECTION = "usualExercises";

export type UsualExercise = {
  id: string;
  clientId: string;
  exerciseId: string | null;
  exerciseName: string;
  mets: number;
  durationMin: number;
  frequencyPerWeek: number;
};

type UsualExerciseDoc = Omit<UsualExercise, "id"> & { createdAt?: Timestamp | null };

// お客様が普段行っている運動(週あたりの頻度・1回の時間)の目安を管理する。
// 「普段の3食」(usualMeals)と同じ位置づけで、プランのメンテナンスカロリー算出に使う。
export async function listUsualExercises(clientId: string): Promise<UsualExercise[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => {
    const { createdAt: _createdAt, ...rest } = d.data() as UsualExerciseDoc;
    return { id: d.id, ...rest };
  });
}

export function subscribeToUsualExercises(
  clientId: string,
  callback: () => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, COLLECTION), where("clientId", "==", clientId)),
    () => callback(),
  );
}

export type InsertUsualExerciseInput = {
  clientId: string;
  exerciseId: string | null;
  exerciseName: string;
  mets: number;
  durationMin: number;
  frequencyPerWeek: number;
};

export async function insertUsualExercise(input: InsertUsualExerciseInput): Promise<void> {
  await addDoc(collection(db, COLLECTION), { ...input, createdAt: serverTimestamp() });
}

export async function deleteUsualExercise(clientId: string, id: string): Promise<void> {
  await assertBelongsToClient(db, COLLECTION, id, clientId);
  await deleteDoc(doc(db, COLLECTION, id));
}
