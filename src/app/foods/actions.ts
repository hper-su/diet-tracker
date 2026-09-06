import { insertFood, updateFood, deleteFood } from "@/lib/db/foods";
import { validateFoodInput } from "@/lib/validation/food";

export type AddFoodState = { error?: string } | undefined;

function readFoodFormData(formData: FormData) {
  return validateFoodInput({
    category: String(formData.get("category") ?? ""),
    name: String(formData.get("name") ?? ""),
    servingLabel: String(formData.get("serving_label") ?? ""),
    kcalRaw: String(formData.get("kcal") ?? ""),
    proteinRaw: String(formData.get("protein_g") ?? ""),
    fatRaw: String(formData.get("fat_g") ?? ""),
    carbRaw: String(formData.get("carb_g") ?? ""),
  });
}

export async function addFoodAction(
  _prevState: AddFoodState,
  formData: FormData,
): Promise<AddFoodState> {
  const result = readFoodFormData(formData);

  if (!result.ok) {
    return { error: result.error };
  }

  const inserted = await insertFood(result.data);
  if (!inserted.ok) {
    return { error: "同じ分類・名前の食品が既に登録されています。" };
  }
}

export type UpdateFoodState = { error?: string } | undefined;

export async function updateFoodAction(
  _prevState: UpdateFoodState,
  formData: FormData,
): Promise<UpdateFoodState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "食品が指定されていません。" };
  }

  const result = readFoodFormData(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  const updated = await updateFood(id, result.data);
  if (!updated.ok) {
    return { error: "同じ分類・名前の食品が既に登録されています。" };
  }
}

export async function deleteFoodAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteFood(id);
  }
}
