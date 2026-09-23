import { insertExercise, updateExercise, deleteExercise } from "@/lib/db/exercises";
import { validateExerciseInput } from "@/lib/validation/exercise";

type AddExerciseState = { error?: string } | undefined;

function readExerciseFormData(formData: FormData) {
  return validateExerciseInput({
    name: String(formData.get("name") ?? ""),
    aliasesRaw: String(formData.get("aliases") ?? ""),
  });
}

export async function addExerciseAction(
  _prevState: AddExerciseState,
  formData: FormData,
): Promise<AddExerciseState> {
  const result = readExerciseFormData(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  const inserted = await insertExercise(result.data);
  if (!inserted.ok) {
    return { error: "同じ名前の種目が既に登録されています。" };
  }
}

type UpdateExerciseState = { error?: string } | undefined;

export async function updateExerciseAction(
  _prevState: UpdateExerciseState,
  formData: FormData,
): Promise<UpdateExerciseState> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "種目が指定されていません。" };
  }

  const result = readExerciseFormData(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  const updated = await updateExercise(id, result.data);
  if (!updated.ok) {
    return { error: "同じ名前の種目が既に登録されています。" };
  }
}

export async function deleteExerciseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteExercise(id);
  }
}
