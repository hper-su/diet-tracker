import {
  collection,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  type Firestore,
  type DocumentData,
  type WriteBatch,
  type Unsubscribe,
} from "firebase/firestore";

// Postgres版が`.eq("clientId", clientId)`で行っていた「他のお客様の行を
// 誤って更新・削除しない」防御的チェックを、ドキュメントIDだけで一意に
// 特定できるFirestoreでも同様に保つためのガード。Postgres版は該当行が
// 無ければ例外を投げず0件更新のまま終わっていたため、それに合わせて
// 真偽値を返すだけにする(呼び出し元は false なら何もせず終える)。
export async function belongsToClient(
  db: Firestore,
  collectionName: string,
  id: string,
  clientId: string,
): Promise<boolean> {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() && (snap.data() as { clientId?: string }).clientId === clientId;
}

// Firestoreの1バッチあたりの書き込み上限(500件)を踏まえた安全マージン。
const FIRESTORE_BATCH_CHUNK_SIZE = 450;

// 件数がバッチ上限を超えても安全なよう、itemsをチャンクに分けてwriteBatchで
// 送る共通ループ。各項目に対して何をするか(set/update/delete)はapplyToBatchが
// 決める(1チャンクごとにまとめて送るため、そのチャンク内は原子的)。
// db/*.tsの各所で同じ「500件上限を踏まえたチャンク分割」を書いていて
// 一部で対応漏れが起きたため、この関数に集約する。
export async function runChunkedBatches<T>(
  db: Firestore,
  items: readonly T[],
  applyToBatch: (batch: WriteBatch, item: T, index: number) => void,
): Promise<void> {
  for (let i = 0; i < items.length; i += FIRESTORE_BATCH_CHUNK_SIZE) {
    const batch = writeBatch(db);
    const chunk = items.slice(i, i + FIRESTORE_BATCH_CHUNK_SIZE);
    chunk.forEach((item, offset) => applyToBatch(batch, item, i + offset));
    await batch.commit();
  }
}

// 複数件を新規ドキュメントとしてまとめて書き込む(createdAtを付与)。
export async function chunkedBatchInsert(
  db: Firestore,
  collectionName: string,
  inputs: readonly DocumentData[],
): Promise<void> {
  await runChunkedBatches(db, inputs, (batch, input) => {
    const ref = doc(collection(db, collectionName));
    batch.set(ref, { ...input, createdAt: serverTimestamp() });
  });
}

// コレクション全体の変化を購読する(db/*.tsの各subscribeToX関数の共通実装)。
export function subscribeToCollection(
  db: Firestore,
  collectionName: string,
  callback: () => void,
): Unsubscribe {
  return onSnapshot(collection(db, collectionName), () => callback());
}

// 指定したクライアントに属する行だけの変化を購読する(db/*.tsの
// 各subscribeToX(clientId, callback)関数の共通実装)。
export function subscribeToCollectionByClient(
  db: Firestore,
  collectionName: string,
  clientId: string,
  callback: () => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, collectionName), where("clientId", "==", clientId)),
    () => callback(),
  );
}
