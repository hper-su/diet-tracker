import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  getCountFromServer,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "foods";

export type Food = {
  id: string;
  category: string;
  name: string;
  servingLabel: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

type FoodDoc = Omit<Food, "id"> & { createdAt?: Timestamp | null };

function fromDoc(id: string, data: FoodDoc): Food & { createdAt?: Timestamp | null } {
  return { id, ...data };
}

// 食品マスタは3,000件超あり、全件取得だけで数百ms〜1秒程度かかる。プラン・
// 食事記録タブはページを切り替えるたびにこれを取得し直していて体感速度を
// 大きく落としていたため、アプリ内でメモリキャッシュして使い回す。他端末での
// 編集も反映されるよう、Firestoreのリアルタイム更新を検知した時だけ
// キャッシュを破棄する。
let foodsCache: Promise<(Food & { createdAt?: Timestamp | null })[]> | null = null;
let foodsCacheInvalidationArmed = false;

function armFoodsCacheInvalidation() {
  if (foodsCacheInvalidationArmed) return;
  foodsCacheInvalidationArmed = true;
  onSnapshot(collection(db, COLLECTION), () => {
    foodsCache = null;
  });
}

async function listFoodsInternal(): Promise<(Food & { createdAt?: Timestamp | null })[]> {
  armFoodsCacheInvalidation();
  if (!foodsCache) {
    foodsCache = getDocs(collection(db, COLLECTION)).then((snap) =>
      snap.docs
        .map((d) => fromDoc(d.id, d.data() as FoodDoc))
        .sort(
          (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
        ),
    );
    // 取得に失敗した場合はキャッシュに残さず、次回呼び出しで取得し直せるようにする。
    foodsCache.catch(() => {
      foodsCache = null;
    });
  }
  return foodsCache;
}

// 食事記録の食品選択(コンボボックス)用。プレーンなデータとしてクライアントへ渡すだけなので、
// 件数が多くても問題ない(お客様が使う分だけ都度検索できるようにするのはUI側の役割)。
export async function listFoods(): Promise<Food[]> {
  const rows = await listFoodsInternal();
  return rows.map(({ createdAt: _createdAt, ...food }) => food);
}

export function subscribeToFoods(callback: () => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTION), () => callback());
}

// 指定した分類(category)のいずれかに一致する食品を全件取得する(コンビニ編・
// 外食編の献立例で、実在の商品の中から組み合わせを選ぶための候補取得に使う)。
// listFoods()のキャッシュから絞り込むだけなので、追加の通信は発生しない。
export async function listFoodsByCategories(categories: string[]): Promise<Food[]> {
  if (categories.length === 0) return [];
  const categorySet = new Set(categories);
  const all = await listFoods();
  return all.filter((food) => categorySet.has(food.category));
}

// 食品名の完全一致で1件取得する(献立例の代表食品取得など、名前で特定の食品を
// 指し示したい用途で使う)。同じ名前が複数の分類にまたがって存在する場合に備え、
// categoryを指定して絞り込める。category省略時にヒットが複数あるときは、
// 最も先に登録された(createdAtが最も古い)行を返す。listFoods()のキャッシュから
// 絞り込むため、追加の通信は発生しない。
export async function getFoodByName(name: string, category?: string): Promise<Food | null> {
  const all = await listFoodsInternal();
  const matches = category
    ? all.filter((food) => food.category === category && food.name === name)
    : all.filter((food) => food.name === name);
  if (matches.length === 0) return null;
  const earliest = matches.reduce((min, food) =>
    (food.createdAt?.toMillis() ?? 0) < (min.createdAt?.toMillis() ?? 0) ? food : min,
  );
  const { createdAt: _createdAt, ...food } = earliest;
  return food;
}

export const FOOD_MASTER_PAGE_SIZE = 50;

export type FoodsPage = {
  foods: Food[];
  total: number;
  page: number;
  totalPages: number;
};

// 食品マスタ管理画面用。数千件規模を一度に描画すると重いため、
// 検索語(カテゴリ・品名のいずれかに部分一致)とページ番号で絞り込んで返す
// (全件取得した上でJS側で絞り込む。旧Dexie/Supabase版も同様の方式だった)。
export async function listFoodsPage(query: string, page: number): Promise<FoodsPage> {
  const pageSize = FOOD_MASTER_PAGE_SIZE;
  const safePage = Math.max(1, Math.floor(page) || 1);

  const all = await listFoods();
  const matched = query
    ? all.filter(
        (food) => food.category.includes(query) || food.name.includes(query),
      )
    : all;

  const total = matched.length;
  const offset = (safePage - 1) * pageSize;

  return {
    foods: matched.slice(offset, offset + pageSize),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function countFoods(): Promise<number> {
  const snap = await getCountFromServer(collection(db, COLLECTION));
  return snap.data().count;
}

export async function getFood(id: string): Promise<Food | null> {
  const all = await listFoods();
  return all.find((food) => food.id === id) ?? null;
}

export type InsertFoodInput = {
  category: string;
  name: string;
  servingLabel: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type InsertFoodResult =
  | { ok: true }
  | { ok: false; error: "duplicate_name" };

async function findDuplicate(
  category: string,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("category", "==", category),
      where("name", "==", name),
    ),
  );
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function insertFood(input: InsertFoodInput): Promise<InsertFoodResult> {
  if (await findDuplicate(input.category, input.name)) {
    return { ok: false, error: "duplicate_name" };
  }
  await addDoc(collection(db, COLLECTION), { ...input, createdAt: serverTimestamp() });
  return { ok: true };
}

export type UpdateFoodInput = InsertFoodInput;

export type UpdateFoodResult =
  | { ok: true }
  | { ok: false; error: "duplicate_name" };

export async function updateFood(id: string, input: UpdateFoodInput): Promise<UpdateFoodResult> {
  if (await findDuplicate(input.category, input.name, id)) {
    return { ok: false, error: "duplicate_name" };
  }
  await updateDoc(doc(db, COLLECTION, id), { ...input });
  return { ok: true };
}

// mealLogs/usualMealsのfoodIdは、Postgres版ではON DELETE SET NULLで自動的に
// nullへ補正されていたが、Firestoreに外部キー制約が無いためここで明示的に行う
// (foodName/kcal等はスナップショットとして残っているので表示上の実害はない)。
export async function deleteFood(id: string): Promise<void> {
  for (const collectionName of ["mealLogs", "usualMeals"] as const) {
    const referencing = await getDocs(
      query(collection(db, collectionName), where("foodId", "==", id)),
    );
    if (referencing.empty) continue;
    const batch = writeBatch(db);
    referencing.docs.forEach((d) => batch.update(d.ref, { foodId: null }));
    await batch.commit();
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

// 食品登録フォームの分類入力に補完候補を出すため、既存の分類を重複なく返す。
// listFoods()のキャッシュから導出するため、追加の通信は発生しない。
export async function listFoodCategories(): Promise<string[]> {
  const all = await listFoods();
  const categories = new Set(all.map((food) => food.category).filter((c) => c !== ""));
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}
