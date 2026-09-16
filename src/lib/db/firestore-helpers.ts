import { doc, getDoc, type Firestore } from "firebase/firestore";

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
