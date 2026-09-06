import Dexie from "dexie";
import { db } from "./client";

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

// 食事記録の食品選択(コンボボックス)用。プレーンなデータとしてクライアントへ渡すだけなので、
// 件数が多くても問題ない(お客様が使う分だけ都度検索できるようにするのはUI側の役割)。
export async function listFoods(): Promise<Food[]> {
  const rows = await db.foods.toArray();
  return rows.sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

// 指定した分類(category)のいずれかに一致する食品を全件取得する(コンビニ編・
// 外食編の献立例で、実在の商品の中から組み合わせを選ぶための候補取得に使う)。
export async function listFoodsByCategories(categories: string[]): Promise<Food[]> {
  if (categories.length === 0) return [];
  return db.foods.where("category").anyOf(categories).toArray();
}

// 食品名の完全一致で1件取得する(献立例の代表食品取得など、名前で特定の食品を
// 指し示したい用途で使う)。同じ名前が複数の分類にまたがって存在する場合に備え、
// categoryを指定して絞り込める。category省略時にヒットが複数あるときは、
// idが最も小さい(＝最初に登録された)行を返す。
export async function getFoodByName(name: string, category?: string): Promise<Food | null> {
  if (category) {
    const row = await db.foods.where({ category, name }).first();
    return row ?? null;
  }
  const rows = await db.foods.where("name").equals(name).sortBy("id");
  return rows[0] ?? null;
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
export async function listFoodsPage(query: string, page: number): Promise<FoodsPage> {
  const pageSize = FOOD_MASTER_PAGE_SIZE;
  const safePage = Math.max(1, Math.floor(page) || 1);

  const all = await db.foods.toArray();
  const matched = query
    ? all.filter(
        (food) => food.category.includes(query) || food.name.includes(query),
      )
    : all;
  matched.sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );

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
  return db.foods.count();
}

export async function getFood(id: number): Promise<Food | null> {
  const row = await db.foods.get(id);
  return row ?? null;
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
  try {
    await db.foods.add({ ...input } as Food);
    return { ok: true };
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) {
      return { ok: false, error: "duplicate_name" };
    }
    throw error;
  }
}

export type UpdateFoodInput = InsertFoodInput;

export type UpdateFoodResult =
  | { ok: true }
  | { ok: false; error: "duplicate_name" };

export async function updateFood(id: number, input: UpdateFoodInput): Promise<UpdateFoodResult> {
  try {
    await db.transaction("rw", db.foods, async () => {
      const existing = await db.foods
        .where({ category: input.category, name: input.name })
        .first();
      if (existing && existing.id !== id) {
        throw new Dexie.ConstraintError("duplicate_name");
      }
      await db.foods.update(id, { ...input });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) {
      return { ok: false, error: "duplicate_name" };
    }
    throw error;
  }
}

export async function deleteFood(id: number): Promise<void> {
  await db.transaction("rw", db.foods, db.mealLogs, db.usualMeals, async () => {
    await db.foods.delete(id);
    // SQLite版の ON DELETE SET NULL 相当: 参照していたfood_idをnullにする
    // (food_name/kcal等はスナップショットとして残っているので表示上の実害はない)。
    await db.mealLogs.where("foodId").equals(id).modify({ foodId: null });
    await db.usualMeals.where("foodId").equals(id).modify({ foodId: null });
  });
}

// 食品登録フォームの分類入力に補完候補を出すため、既存の分類を重複なく返す。
export async function listFoodCategories(): Promise<string[]> {
  const rows = await db.foods.toArray();
  const categories = new Set(rows.map((row) => row.category).filter((c) => c !== ""));
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}
