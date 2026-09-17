import {
  collection,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  type Firestore,
  type DocumentData,
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
const MAX_BATCH_WRITES = 450;

// 複数件を新規ドキュメントとしてまとめて書き込む(createdAtを付与)。
// バッチ上限を超える件数でも安全なよう、チャンクに分けて書き込む
// (1チャンクごとにwriteBatchでまとめて送るため、そのチャンク内は原子的)。
export async function chunkedBatchInsert(
  db: Firestore,
  collectionName: string,
  inputs: readonly DocumentData[],
): Promise<void> {
  for (let i = 0; i < inputs.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    for (const input of inputs.slice(i, i + MAX_BATCH_WRITES)) {
      const ref = doc(collection(db, collectionName));
      batch.set(ref, { ...input, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }
}
