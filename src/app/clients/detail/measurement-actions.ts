import { insertMeasurement, deleteMeasurement } from "@/lib/db/measurements";
import { validateMeasurementInput } from "@/lib/validation/measurement";

export type AddMeasurementState = { error?: string } | undefined;

export async function addMeasurementAction(
  _prevState: AddMeasurementState,
  formData: FormData,
): Promise<AddMeasurementState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const result = validateMeasurementInput({
    recordedAt: String(formData.get("recorded_at") ?? ""),
    weightRaw: String(formData.get("weight_kg") ?? ""),
    bodyFatRaw: String(formData.get("body_fat_pct") ?? ""),
    muscleMassRaw: String(formData.get("muscle_mass_kg") ?? ""),
    visceralFatRaw: String(formData.get("visceral_fat_level") ?? ""),
    bmrRaw: String(formData.get("bmr_kcal") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  await insertMeasurement({ clientId, ...result.data });
}

export async function deleteMeasurementAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteMeasurement(clientId, id);
  }
}
