import { doc, getDoc, type Firestore } from "firebase/firestore";

// Postgres版が`.eq("clientId", clientId)`で行っていた「他のお客様の行を
// 誤って更新・削除しない」防御的チェックを、ドキュメントIDだけで一意に
// 特定できるFirestoreでも同様に保つためのガード。
export async function assertBelongsToClient(
  db: Firestore,
  collectionName: string,
  id: string,
  clientId: string,
): Promise<void> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists() || (snap.data() as { clientId?: string }).clientId !== clientId) {
    throw new Error("指定されたお客様の記録ではありません。");
  }
}
