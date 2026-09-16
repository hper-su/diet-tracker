import {
  collection,
  doc,
  addDoc,
  updateDoc,
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
import { belongsToClient } from "./firestore-helpers";

const COLLECTION = "measurements";

export type Measurement = {
  id: string;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

type MeasurementDoc = Omit<Measurement, "id"> & {
  clientId: string;
  createdAt?: Timestamp | null;
};

// 古い記録から新しい記録の順(グラフ描画・findLatestNonNullでの直近値探索に使う順)。
export async function listMeasurements(clientId: string): Promise<Measurement[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("clientId", "==", clientId),
      orderBy("recordedAt", "asc"),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => {
    const { clientId: _clientId, createdAt: _createdAt, ...rest } =
      d.data() as MeasurementDoc;
    return { id: d.id, ...rest };
  });
}

export function subscribeToMeasurements(
  clientId: string,
  callback: () => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, COLLECTION), where("clientId", "==", clientId)),
    () => callback(),
  );
}

export type InsertMeasurementInput = {
  clientId: string;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

export async function insertMeasurement(input: InsertMeasurementInput): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export type UpdateMeasurementInput = {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

export async function updateMeasurement(
  clientId: string,
  id: string,
  input: UpdateMeasurementInput,
): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await updateDoc(doc(db, COLLECTION, id), { ...input });
}

export async function deleteMeasurement(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
