import { getExercise } from "@/lib/db/exercises";
import {
  insertUsualExercise,
  deleteUsualExercise,
} from "@/lib/db/usual-exercises";
import { validateUsualExerciseInput } from "@/lib/validation/usual-exercise";

export type AddUsualExerciseState = { error?: string } | undefined;

export async function addUsualExerciseAction(
  _prevState: AddUsualExerciseState,
  formData: FormData,
): Promise<AddUsualExerciseState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const result = validateUsualExerciseInput({
    exerciseIdRaw: String(formData.get("exercise_id") ?? ""),
    customNameRaw: String(formData.get("custom_name") ?? ""),
    customMetsRaw: String(formData.get("custom_mets") ?? ""),
    durationMinRaw: String(formData.get("duration_min") ?? ""),
    frequencyPerWeekRaw: String(formData.get("frequency_per_week") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  let exerciseName: string;
  let mets: number;

  if (result.data.exerciseId !== null) {
    const exercise = await getExercise(result.data.exerciseId);
    if (!exercise) {
      return { error: "指定された運動の種目が見つかりません。" };
    }
    exerciseName = exercise.name;
    mets = exercise.mets;
  } else {
    exerciseName = result.data.customName!;
    mets = result.data.customMets!;
  }

  await insertUsualExercise({
    clientId,
    exerciseId: result.data.exerciseId,
    exerciseName,
    mets,
    durationMin: result.data.durationMin,
    frequencyPerWeek: result.data.frequencyPerWeek,
  });
}

export async function deleteUsualExerciseAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteUsualExercise(clientId, id);
  }
}
