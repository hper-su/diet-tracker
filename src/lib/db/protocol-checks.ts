import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { belongsToClient, subscribeToCollectionByClient } from "./firestore-helpers";

const COLLECTION = "protocolChecks";

export type ProtocolCheckStepResult = {
  step: number; // conditions.tsのprotocolTable内でのインデックス(0始まり)
  achieved: boolean;
};

export type ProtocolCheck = {
  id: string;
  recordedAt: string;
  conditionId: string; // lib/conditions.tsのCondition.id(お客様には症状名で表示)
  results: ProtocolCheckStepResult[];
  memo: string | null;
};

type ProtocolCheckDoc = Omit<ProtocolCheck, "id"> & {
  clientId: string;
  createdAt?: Timestamp | null;
};

// 古い記録から新しい記録の順(measurementsと同じ並び順の考え方)。
export async function listProtocolChecks(clientId: string): Promise<ProtocolCheck[]> {
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
      d.data() as ProtocolCheckDoc;
    return { id: d.id, ...rest };
  });
}

export function subscribeToProtocolChecks(
  clientId: string,
  callback: () => void,
): Unsubscribe {
  return subscribeToCollectionByClient(db, COLLECTION, clientId, callback);
}

export type InsertProtocolCheckInput = {
  clientId: string;
  recordedAt: string;
  conditionId: string;
  results: ProtocolCheckStepResult[];
  memo: string | null;
};

export async function insertProtocolCheck(input: InsertProtocolCheckInput): Promise<void> {
  await addDoc(collection(db, COLLECTION), { ...input, createdAt: serverTimestamp() });
}

export async function deleteProtocolCheck(clientId: string, id: string): Promise<void> {
  if (!(await belongsToClient(db, COLLECTION, id, clientId))) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
