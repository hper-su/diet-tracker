import { getFood } from "@/lib/db/foods";
import {
  insertMealLogs,
  updateMealLog,
  deleteMealLog,
  type InsertMealLogInput,
} from "@/lib/db/meal-logs";
import { listUsualMeals } from "@/lib/db/usual-meals";
import { validateMealLogInput } from "@/lib/validation/meal-log";
import { calculateMealLogAmounts } from "@/lib/health/meal-totals";

export type AddMealLogState = { error?: string } | undefined;

// 1回の送信で複数の品目(meal_type[]・food_id[]・quantity[]・memo[])をまとめて登録できるようにする。
// 行ごとに区分を選べるため、朝食・昼食などを混在させて一括登録できる。
// 未入力の行(食品が選ばれていない行)は無視し、1件も選ばれていなければエラーにする。
export async function addMealLogAction(
  _prevState: AddMealLogState,
  formData: FormData,
): Promise<AddMealLogState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }
  const recordedAt = String(formData.get("recorded_at") ?? "");

  const mealTypes = formData.getAll("meal_type").map(String);
  const foodIds = formData.getAll("food_id").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const memos = formData.getAll("memo").map(String);

  const entries = foodIds
    .map((foodIdRaw, i) => ({
      mealTypeRaw: mealTypes[i] ?? "",
      foodIdRaw,
      quantityRaw: quantities[i] ?? "",
      memo: memos[i] ?? "",
    }))
    .filter((entry) => entry.foodIdRaw);

  if (entries.length === 0) {
    return { error: "食品を1件以上選択してください。" };
  }

  const toInsert: InsertMealLogInput[] = [];

  for (const entry of entries) {
    const result = validateMealLogInput({
      recordedAt,
      mealTypeRaw: entry.mealTypeRaw,
      foodIdRaw: entry.foodIdRaw,
      quantityRaw: entry.quantityRaw,
      memo: entry.memo,
    });
    if (!result.ok) {
      return { error: result.error };
    }

    const food = await getFood(result.data.foodId);
    if (!food) {
      return { error: "指定された食品が見つかりません。" };
    }

    const amounts = calculateMealLogAmounts(
      { kcal: food.kcal, proteinG: food.proteinG, fatG: food.fatG, carbG: food.carbG },
      result.data.quantity,
    );

    toInsert.push({
      clientId,
      recordedAt: result.data.recordedAt,
      mealType: result.data.mealType,
      foodId: food.id,
      foodName: food.name,
      quantity: result.data.quantity,
      kcal: amounts.kcal,
      proteinG: amounts.proteinG,
      fatG: amounts.fatG,
      carbG: amounts.carbG,
      memo: result.data.memo,
    });
  }

  await insertMealLogs(toInsert);
}

// 「プラン」タブに登録済みの普段の3食を、指定日の食事記録としてまとめて複製する。
// 実際の食事が定型と違う場合は、複製後にその場で個別編集・削除すればよい。
export async function addUsualMealsAsLogAction(formData: FormData) {
  const clientId = Number(formData.get("client_id"));
  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!Number.isInteger(clientId) || clientId <= 0 || !recordedAt) {
    return;
  }

  const usualMeals = await listUsualMeals(clientId);
  await insertMealLogs(
    usualMeals.map((meal) => ({
      clientId,
      recordedAt,
      mealType: meal.mealType,
      foodId: meal.foodId,
      foodName: meal.foodName,
      quantity: meal.quantity,
      kcal: meal.kcal,
      proteinG: meal.proteinG,
      fatG: meal.fatG,
      carbG: meal.carbG,
      memo: null,
    })),
  );
}

export type UpdateMealLogState = { error?: string } | undefined;

export async function updateMealLogAction(
  _prevState: UpdateMealLogState,
  formData: FormData,
): Promise<UpdateMealLogState> {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(clientId) || clientId <= 0) {
    return { error: "記録が指定されていません。" };
  }

  const result = validateMealLogInput({
    recordedAt: String(formData.get("recorded_at") ?? ""),
    mealTypeRaw: String(formData.get("meal_type") ?? ""),
    foodIdRaw: String(formData.get("food_id") ?? ""),
    quantityRaw: String(formData.get("quantity") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const food = await getFood(result.data.foodId);
  if (!food) {
    return { error: "指定された食品が見つかりません。" };
  }

  const amounts = calculateMealLogAmounts(
    { kcal: food.kcal, proteinG: food.proteinG, fatG: food.fatG, carbG: food.carbG },
    result.data.quantity,
  );

  await updateMealLog(clientId, id, {
    recordedAt: result.data.recordedAt,
    mealType: result.data.mealType,
    foodId: food.id,
    foodName: food.name,
    quantity: result.data.quantity,
    kcal: amounts.kcal,
    proteinG: amounts.proteinG,
    fatG: amounts.fatG,
    carbG: amounts.carbG,
    memo: result.data.memo,
  });
}

export async function deleteMealLogAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteMealLog(clientId, id);
  }
}
