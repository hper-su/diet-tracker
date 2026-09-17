import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { runChunkedBatches, subscribeToCollection } from "./firestore-helpers";

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
type CachedFood = Food & { createdAtMillis: number | null };

function fromDoc(id: string, data: FoodDoc): CachedFood {
  return { id, ...data, createdAtMillis: data.createdAt?.toMillis() ?? null };
}

// 食品マスタは3,000件超あり、全件取得だけで数百ms〜1秒程度かかる(Firestore読み取りも
// 件数分消費する)。プラン・食事記録タブはページを切り替えるたびにこれを取得し直して
// いて体感速度を大きく落としていた上、ページ遷移のたびに全件読み取りが走るとクォータを
// 消費しやすいため、メモリキャッシュに加えてlocalStorageにも一定時間キャッシュする。
// 他端末での編集は、同じタブを開いている間はFirestoreのリアルタイム更新検知で即座に
// キャッシュを破棄するが、別タブ・再読み込み後はこのTTLの間だけ反映が遅れる
// (社内ツールなので許容範囲とする)。
let foodsCache: Promise<CachedFood[]> | null = null;
let foodsCacheInvalidationArmed = false;

const LOCAL_CACHE_KEY = "diet-tracker:foods-cache:v1";
const LOCAL_CACHE_TTL_MS = 10 * 60 * 1000; // 10分

function readLocalCache(): CachedFood[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; foods: CachedFood[] };
    if (Date.now() - parsed.savedAt > LOCAL_CACHE_TTL_MS) return null;
    return parsed.foods;
  } catch {
    return null;
  }
}

function writeLocalCache(foods: CachedFood[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), foods }),
    );
  } catch {
    // 容量超過等は無視(メモリキャッシュだけで動作は継続できる)。
  }
}

function clearLocalCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_CACHE_KEY);
  } catch {
    // no-op
  }
}

function armFoodsCacheInvalidation() {
  if (foodsCacheInvalidationArmed) return;
  foodsCacheInvalidationArmed = true;
  // onSnapshotは登録直後、実際の変更の有無にかかわらず必ず1回「現在の状態」で
  // 発火する。これを変更通知として扱うと、直前に作ったばかりのキャッシュを
  // 即座に破棄してしまい、キャッシュの意味が無くなるため、最初の1回は無視する。
  let isFirstSnapshot = true;
  onSnapshot(collection(db, COLLECTION), () => {
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }
    foodsCache = null;
    clearLocalCache();
  });
}

async function listFoodsInternal(): Promise<CachedFood[]> {
  armFoodsCacheInvalidation();
  if (!foodsCache) {
    const cachedFromDisk = readLocalCache();
    if (cachedFromDisk) {
      foodsCache = Promise.resolve(cachedFromDisk);
    } else {
      foodsCache = getDocs(collection(db, COLLECTION)).then((snap) => {
        const foods = snap.docs
          .map((d) => fromDoc(d.id, d.data() as FoodDoc))
          .sort(
            (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
          );
        writeLocalCache(foods);
        return foods;
      });
      // 取得に失敗した場合はキャッシュに残さず、次回呼び出しで取得し直せるようにする。
      foodsCache.catch(() => {
        foodsCache = null;
      });
    }
  }
  return foodsCache;
}

// 食事記録の食品選択(コンボボックス)用。プレーンなデータとしてクライアントへ渡すだけなので、
// 件数が多くても問題ない(お客様が使う分だけ都度検索できるようにするのはUI側の役割)。
export async function listFoods(): Promise<Food[]> {
  const rows = await listFoodsInternal();
  return rows.map(({ createdAtMillis: _createdAtMillis, ...food }) => food);
}

export function subscribeToFoods(callback: () => void): Unsubscribe {
  return subscribeToCollection(db, COLLECTION, callback);
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
    (food.createdAtMillis ?? 0) < (min.createdAtMillis ?? 0) ? food : min,
  );
  const { createdAtMillis: _createdAtMillis, ...food } = earliest;
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

// 食品マスタ画面の「全X件」表示用。listFoods()は既にキャッシュ済みのため、
// 別途Firestoreへ集計クエリを投げる(getCountFromServer)必要はない。
export async function countFoods(): Promise<number> {
  const all = await listFoods();
  return all.length;
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
// 参照件数がバッチ上限を超えることもあるため、チャンクに分けて書き込む。
export async function deleteFood(id: string): Promise<void> {
  for (const collectionName of ["mealLogs", "usualMeals"] as const) {
    const referencing = await getDocs(
      query(collection(db, collectionName), where("foodId", "==", id)),
    );
    await runChunkedBatches(db, referencing.docs, (batch, d) => {
      batch.update(d.ref, { foodId: null });
    });
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
