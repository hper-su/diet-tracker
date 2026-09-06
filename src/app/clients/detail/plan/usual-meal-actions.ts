import { getFood } from "@/lib/db/foods";
import { insertUsualMeal, deleteUsualMeal } from "@/lib/db/usual-meals";
import { validateUsualMealInput } from "@/lib/validation/usual-meal";
import { calculateMealLogAmounts } from "@/lib/health/meal-totals";

export type AddUsualMealState = { error?: string } | undefined;

// 1回の送信で複数の品目(meal_type[]・food_id[]・quantity[])をまとめて登録できるようにする。
// 行ごとに区分を選べるため、朝食・昼食などを混在させて一括登録できる。
// 未入力の行(食品が選ばれていない行)は無視し、1件も選ばれていなければエラーにする。
export async function addUsualMealAction(
  _prevState: AddUsualMealState,
  formData: FormData,
): Promise<AddUsualMealState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const mealTypes = formData.getAll("meal_type").map(String);
  const foodIds = formData.getAll("food_id").map(String);
  const quantities = formData.getAll("quantity").map(String);

  const entries = foodIds
    .map((foodIdRaw, i) => ({
      mealTypeRaw: mealTypes[i] ?? "",
      foodIdRaw,
      quantityRaw: quantities[i] ?? "",
    }))
    .filter((entry) => entry.foodIdRaw);

  if (entries.length === 0) {
    return { error: "食品を1件以上選択してください。" };
  }

  const toInsert: Parameters<typeof insertUsualMeal>[0][] = [];

  for (const entry of entries) {
    const result = validateUsualMealInput({
      mealTypeRaw: entry.mealTypeRaw,
      foodIdRaw: entry.foodIdRaw,
      quantityRaw: entry.quantityRaw,
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
      mealType: result.data.mealType,
      foodId: food.id,
      foodName: food.name,
      quantity: result.data.quantity,
      kcal: amounts.kcal,
      proteinG: amounts.proteinG,
      fatG: amounts.fatG,
      carbG: amounts.carbG,
    });
  }

  for (const input of toInsert) {
    await insertUsualMeal(input);
  }

  return undefined;
}

export async function deleteUsualMealAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteUsualMeal(clientId, id);
  }
}
