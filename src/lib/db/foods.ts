import { supabase, selectAllRows, unwrap, run } from "./supabase";
import { subscribeToChanges } from "./realtime";

export type Food = {
  id: number;
  category: string;
  name: string;
  servingLabel: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

const UNIQUE_VIOLATION = "23505";

// 食品マスタは3,000件超あり、全件取得だけで数百ms〜1秒程度かかる。プラン・
// 食事記録タブはページを切り替えるたびにこれを取得し直していて体感速度を
// 大きく落としていたため、アプリ内でメモリキャッシュして使い回す。他端末での
// 編集も反映されるよう、Realtimeでfoodsテーブルの変更を検知した時だけ
// キャッシュを破棄する(既存のsubscribeToChanges基盤に相乗りする)。
let foodsCache: Promise<Food[]> | null = null;
let foodsCacheInvalidationArmed = false;

function armFoodsCacheInvalidation() {
  if (foodsCacheInvalidationArmed) return;
  foodsCacheInvalidationArmed = true;
  subscribeToChanges(["foods"], () => {
    foodsCache = null;
  });
}

// 食事記録の食品選択(コンボボックス)用。プレーンなデータとしてクライアントへ渡すだけなので、
// 件数が多くても問題ない(お客様が使う分だけ都度検索できるようにするのはUI側の役割)。
export async function listFoods(): Promise<Food[]> {
  armFoodsCacheInvalidation();
  if (!foodsCache) {
    foodsCache = selectAllRows<Food>("foods").then((rows) =>
      [...rows].sort(
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
// idが最も小さい(＝最初に登録された)行を返す。listFoods()のキャッシュから
// 絞り込むため、追加の通信は発生しない。
export async function getFoodByName(name: string, category?: string): Promise<Food | null> {
  const all = await listFoods();
  const matches = category
    ? all.filter((food) => food.category === category && food.name === name)
    : all.filter((food) => food.name === name);
  if (matches.length === 0) return null;
  return matches.reduce((min, food) => (food.id < min.id ? food : min));
}

export const FOOD_MASTER_PAGE_SIZE = 50;

export type FoodsPage = {
  foods: Food[];
  total: number;
  page: number;
  totalPages: number;
};

// 食品マスタ管理画面用。数千件規模を一度に描画すると重いため、
// 検索語(カテゴリ・品名のいずれかに部分一致)とページ番号で絞り込んで返す。
// (検索語に含まれる記号がPostgRESTのフィルタ構文と衝突しないよう、絞り込み自体は
// 全件取得した上でJS側で行う。旧Dexie版も同様に全件取得してJS側で絞り込んでいた)。
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
  const { count, error } = await supabase
    .from("foods")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getFood(id: number): Promise<Food | null> {
  return unwrap<Food | null>(supabase.from("foods").select("*").eq("id", id).maybeSingle());
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

export async function insertFood(input: InsertFoodInput): Promise<InsertFoodResult> {
  const { error } = await supabase.from("foods").insert({ ...input });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "duplicate_name" };
    }
    throw error;
  }
  return { ok: true };
}

export type UpdateFoodInput = InsertFoodInput;

export type UpdateFoodResult =
  | { ok: true }
  | { ok: false; error: "duplicate_name" };

export async function updateFood(id: number, input: UpdateFoodInput): Promise<UpdateFoodResult> {
  const { error } = await supabase.from("foods").update({ ...input }).eq("id", id);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "duplicate_name" };
    }
    throw error;
  }
  return { ok: true };
}

// mealLogs/usualMealsのfoodId(ON DELETE SET NULL)はDB側の外部キー制約が
// 自動的にnullへ補正する(food_name/kcal等はスナップショットとして残っているので
// 表示上の実害はない)。
export async function deleteFood(id: number): Promise<void> {
  await run(supabase.from("foods").delete().eq("id", id));
}

// 食品登録フォームの分類入力に補完候補を出すため、既存の分類を重複なく返す。
// listFoods()のキャッシュから導出するため、追加の通信は発生しない。
export async function listFoodCategories(): Promise<string[]> {
  const all = await listFoods();
  const categories = new Set(all.map((food) => food.category).filter((c) => c !== ""));
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}
