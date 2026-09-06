import { getFood } from "@/lib/db/foods";
import { insertMealLog, deleteMealLog } from "@/lib/db/meal-logs";
import { listUsualMeals } from "@/lib/db/usual-meals";
import { validateMealLogInput } from "@/lib/validation/meal-log";
import { calculateMealLogAmounts } from "@/lib/health/meal-totals";

export type AddMealLogState = { error?: string } | undefined;

export async function addMealLogAction(
  _prevState: AddMealLogState,
  formData: FormData,
): Promise<AddMealLogState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
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

  await insertMealLog({
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

// 「プラン」タブに登録済みの普段の3食を、指定日の食事記録としてまとめて複製する。
// 実際の食事が定型と違う場合は、複製後にその場で個別編集・削除すればよい。
export async function addUsualMealsAsLogAction(formData: FormData) {
  const clientId = Number(formData.get("client_id"));
  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!Number.isInteger(clientId) || clientId <= 0 || !recordedAt) {
    return;
  }

  for (const meal of await listUsualMeals(clientId)) {
    await insertMealLog({
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
    });
  }
}

export async function deleteMealLogAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteMealLog(clientId, id);
  }
}
