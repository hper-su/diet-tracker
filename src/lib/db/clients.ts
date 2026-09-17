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
