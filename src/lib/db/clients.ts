import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { subscribeToCollection } from "./firestore-helpers";
import { MEAL_LOGS_COLLECTION } from "./meal-logs";
import { MEASUREMENTS_COLLECTION } from "./measurements";
import type { Gender } from "@/lib/health/bmr";
import {
  DEFAULT_ACTIVITY_LEVEL,
  type ActivityLevel,
} from "@/lib/health/activity-level";
import {
  DEFAULT_PFC_PRESET,
  isPFCPreset,
  type PFCPreset,
} from "@/lib/health/pfc-preset";

const COLLECTION = "clients";

export type Client = {
  id: string;
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  course: string | null;
  purpose: string | null;
  targetMonthlyWeightChangeKg: number | null;
  targetWeightChangeKg: number | null;
  targetPeriodMonths: number | null;
  targetWeightKg: number | null;
  targetBodyFatPct: number | null;
  memo: string | null;
};

type ClientDoc = Omit<Client, "id"> & { createdAt?: Timestamp | null };

function fromDoc(id: string, data: ClientDoc): Client {
  const { createdAt: _createdAt, ...client } = data;
  // 過去に存在した"diet"プリセット(現在は"health"に統合済み)など、現行の
  // PFCPresetに存在しない値が保存されたままの古いレコードのフォールバック。
  if (!isPFCPreset(client.pfcPreset)) {
    client.pfcPreset = DEFAULT_PFC_PRESET;
  }
  return { id, ...client };
}

export async function listClients(): Promise<Client[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => fromDoc(d.id, d.data() as ClientDoc));
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? fromDoc(snap.id, snap.data() as ClientDoc) : null;
}

export function subscribeToClients(callback: () => void): Unsubscribe {
  return subscribeToCollection(db, COLLECTION, callback);
}

// お客様ごとの最終記録日(食事・体重ログの recordedAt の最大値)。ログが1件も
// 無いお客様はマップに含まれない(呼び出し側は「記録なし」として扱う)。
async function getLastActivityDates(): Promise<Map<string, string>> {
  const [mealLogsSnap, measurementsSnap] = await Promise.all([
    getDocs(collection(db, MEAL_LOGS_COLLECTION)),
    getDocs(collection(db, MEASUREMENTS_COLLECTION)),
  ]);
  const lastActivity = new Map<string, string>();
  const consider = (clientId: string, recordedAt: string) => {
    const current = lastActivity.get(clientId);
    if (!current || recordedAt > current) lastActivity.set(clientId, recordedAt);
  };
  for (const d of mealLogsSnap.docs) {
    const data = d.data() as { clientId: string; recordedAt: string };
    consider(data.clientId, data.recordedAt);
  }
  for (const d of measurementsSnap.docs) {
    const data = d.data() as { clientId: string; recordedAt: string };
    consider(data.clientId, data.recordedAt);
  }
  return lastActivity;
}

// 食事・体重の記録日が新しい順。記録が1件も無いお客様は末尾に回り、その中では
// 登録日が新しい順(listClientsの並び)を保つ。
export async function listClientsByRecentActivity(): Promise<Client[]> {
  const [clients, lastActivity] = await Promise.all([
    listClients(),
    getLastActivityDates(),
  ]);
  return [...clients].sort((a, b) => {
    const aDate = lastActivity.get(a.id) ?? "";
    const bDate = lastActivity.get(b.id) ?? "";
    return bDate.localeCompare(aDate);
  });
}

export function subscribeToClientActivity(callback: () => void): Unsubscribe {
  const unsubscribeMealLogs = subscribeToCollection(db, MEAL_LOGS_COLLECTION, callback);
  const unsubscribeMeasurements = subscribeToCollection(
    db,
    MEASUREMENTS_COLLECTION,
    callback,
  );
  return () => {
    unsubscribeMealLogs();
    unsubscribeMeasurements();
  };
}

export type InsertClientInput = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  memo: string | null;
};

export async function insertClient(input: InsertClientInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    name: input.name,
    birthdate: input.birthdate,
    heightCm: input.heightCm,
    gender: input.gender,
    activityLevel: DEFAULT_ACTIVITY_LEVEL,
    pfcPreset: DEFAULT_PFC_PRESET,
    course: null,
    purpose: null,
    targetMonthlyWeightChangeKg: null,
    targetWeightChangeKg: null,
    targetPeriodMonths: null,
    targetWeightKg: null,
    targetBodyFatPct: null,
    memo: input.memo,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export type UpdateClientProfileInput = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  course: string | null;
  purpose: string | null;
  memo: string | null;
};

export async function updateClientProfile(
  id: string,
  input: UpdateClientProfileInput,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...input });
}

export async function updateClientGoal(
  id: string,
  targetMonthlyWeightChangeKg: number,
  targetWeightChangeKg: number,
  targetPeriodMonths: number,
  targetWeightKg: number | null,
  targetBodyFatPct: number | null,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    targetMonthlyWeightChangeKg,
    targetWeightChangeKg,
    targetPeriodMonths,
    targetWeightKg,
    targetBodyFatPct,
  });
}
