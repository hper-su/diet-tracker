import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
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

// 指定コレクションから、お客様の最新の記録日(recordedAt)を1件だけ取得する。
// (clientId, recordedAt, createdAt) の既存インデックスを逆順に読むため、追加の
// インデックスは不要。記録が無い、または取得に失敗した場合はnull(一覧表示を
// 止めないよう、失敗は記録なし扱いにしてログだけ残す)。
async function getLatestRecordedAt(
  collectionName: string,
  clientId: string,
): Promise<string | null> {
  try {
    const snap = await getDocs(
      query(
        collection(db, collectionName),
        where("clientId", "==", clientId),
        orderBy("recordedAt", "desc"),
        orderBy("createdAt", "desc"),
        limit(1),
      ),
    );
    return snap.empty ? null : (snap.docs[0].data() as { recordedAt: string }).recordedAt;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// お客様ごとの最終記録日(食事・体重ログの recordedAt の最大値)。ログが1件も
// 無いお客様は含まれない(呼び出し側は「記録なし」として扱う)。
// 全記録を読むと記録数に比例して読み取り量が増えるため、お客様ごとに
// 最新1件だけを問い合わせる(読み取りはお客様数×2件で済む)。
async function getLastActivityDates(
  clientIds: string[],
): Promise<{ lastActivity: Map<string, string>; hasMeasurements: Set<string> }> {
  const lastActivity = new Map<string, string>();
  const hasMeasurements = new Set<string>();
  await Promise.all(
    clientIds.map(async (clientId) => {
      const [meal, measurement] = await Promise.all([
        getLatestRecordedAt(MEAL_LOGS_COLLECTION, clientId),
        getLatestRecordedAt(MEASUREMENTS_COLLECTION, clientId),
      ]);
      if (measurement !== null) hasMeasurements.add(clientId);
      const latest = [meal, measurement].filter((d): d is string => d !== null).sort().pop();
      if (latest) lastActivity.set(clientId, latest);
    }),
  );
  return { lastActivity, hasMeasurements };
}

export type ClientListItem = Client & { hasMeasurements: boolean };

// 食事・体重の記録日が新しい順。記録が1件も無いお客様は末尾に回り、その中では
// 登録日が新しい順(listClientsの並び)を保つ。
// 最終記録日は一覧を開いたとき・お客様の追加変更があったときに再取得する
// (他端末の記録追加による並び替えはリアルタイムには反映しない)。
// hasMeasurementsは、体重測定記録が1件も無いお客様(過去データ移行で新規作成した
// ばかりで、体重データが未登録の場合など)を一覧上で見分けられるようにするためのフラグ。
export async function listClientsByRecentActivity(): Promise<ClientListItem[]> {
  const clients = await listClients();
  const { lastActivity, hasMeasurements } = await getLastActivityDates(
    clients.map((c) => c.id),
  );
  return [...clients]
    .sort((a, b) => {
      const aDate = lastActivity.get(a.id) ?? "";
      const bDate = lastActivity.get(b.id) ?? "";
      return bDate.localeCompare(aDate);
    })
    .map((client) => ({ ...client, hasMeasurements: hasMeasurements.has(client.id) }));
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
