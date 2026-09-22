import { getFood } from "@/lib/db/foods";
import {
  insertMealLogs,
  updateMealLog,
  deleteMealLog,
  isAdjustmentLog,
  listMealLogsByDate,
  setDailyAdjustment,
  type InsertMealLogInput,
} from "@/lib/db/meal-logs";
import { listUsualMeals } from "@/lib/db/usual-meals";
import { validateMealLogInput, type MealLogData } from "@/lib/validation/meal-log";
import {
  calculateDailyAdjustment,
  calculateMealLogAmounts,
  sumMealLogAmounts,
  type AdjustmentMode,
} from "@/lib/health/meal-totals";

type AddMealLogState = { error?: string } | undefined;

// 1回の送信で複数の品目(meal_type[]・food_id[]・quantity[]・memo[])をまとめて登録できるようにする。
// 行ごとに区分を選べるため、朝食・昼食などを混在させて一括登録できる。
// 未入力の行(食品が選ばれていない行)は無視し、1件も選ばれていなければエラーにする。
export async function addMealLogAction(
  _prevState: AddMealLogState,
  formData: FormData,
): Promise<AddMealLogState> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) {
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

  // 検証は1件ずつ順番に行い(不正な行があれば即座にエラーで返す)、
  // 検証を通った行の食品取得だけまとめて並行に行う(getFoodはキャッシュ済みの
  // 食品一覧から引くだけなので通信は増えないが、行数が多いときの遅延を減らせる)。
  const validated: MealLogData[] = [];
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
    validated.push(result.data);
  }

  const foods = await Promise.all(validated.map((entry) => getFood(entry.foodId)));

  const toInsert: InsertMealLogInput[] = [];
  for (let i = 0; i < validated.length; i++) {
    const entry = validated[i];
    const food = foods[i];
    if (!food) {
      return { error: "指定された食品が見つかりません。" };
    }

    const amounts = calculateMealLogAmounts(
      { kcal: food.kcal, proteinG: food.proteinG, fatG: food.fatG, carbG: food.carbG },
      entry.quantity,
    );

    toInsert.push({
      clientId,
      recordedAt: entry.recordedAt,
      mealType: entry.mealType,
      foodId: food.id,
      foodName: food.name,
      quantity: entry.quantity,
      kcal: amounts.kcal,
      proteinG: amounts.proteinG,
      fatG: amounts.fatG,
      carbG: amounts.carbG,
      memo: entry.memo,
    });
  }

  await insertMealLogs(toInsert);
}

// 「プラン」タブに登録済みの普段の3食を、指定日の食事記録としてまとめて複製する。
// 実際の食事が定型と違う場合は、複製後にその場で個別編集・削除すればよい。
export async function addUsualMealsAsLogAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!clientId || !recordedAt) {
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

type UpdateMealLogState = { error?: string } | undefined;

export async function updateMealLogAction(
  _prevState: UpdateMealLogState,
  formData: FormData,
): Promise<UpdateMealLogState> {
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (!id || !clientId) {
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
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (id && clientId) {
    await deleteMealLog(clientId, id);
  }
}

export type DailyAdjustmentState = { error?: string } | undefined;

// 1日の合計(kcal・P・F・C)を手入力で修正する。品目はそのままに、差分だけを
// 「手入力調整」行として保存する。負数も入力可。
export async function setDailyAdjustmentAction(
  _prevState: DailyAdjustmentState,
  formData: FormData,
): Promise<DailyAdjustmentState> {
  const clientId = String(formData.get("client_id") ?? "");
  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!clientId || !recordedAt) {
    return { error: "お客様または日付が指定されていません。" };
  }

  const logs = await listMealLogsByDate(clientId, recordedAt);

  if (formData.get("intent") === "clear") {
    await setDailyAdjustment(clientId, recordedAt, logs, {
      kcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
    });
    return;
  }

  const mode: AdjustmentMode = formData.get("mode") === "delta" ? "delta" : "total";
  const parse = (name: string): number | null | undefined => {
    const raw = String(formData.get(name) ?? "").trim();
    if (raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };
  const kcal = parse("kcal");
  const proteinG = parse("protein_g");
  const fatG = parse("fat_g");
  const carbG = parse("carb_g");
  if (kcal === undefined || proteinG === undefined || fatG === undefined || carbG === undefined) {
    return { error: "数値で入力してください。" };
  }

  const base =sumMealLogAmounts(logs.filter((l) => !isAdjustmentLog(l)));
  const current = sumMealLogAmounts(logs);
  const amounts = calculateDailyAdjustment(
    base,
    current,
    { kcal, proteinG, fatG, carbG },
    mode,
  );
  await setDailyAdjustment(clientId, recordedAt, logs, amounts);
}
