import {
  insertMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from "@/lib/db/measurements";
import { validateMeasurementInput } from "@/lib/validation/measurement";

export type AddMeasurementState = { error?: string } | undefined;

function readMeasurementFormData(formData: FormData) {
  return validateMeasurementInput({
    recordedAt: String(formData.get("recorded_at") ?? ""),
    weightRaw: String(formData.get("weight_kg") ?? ""),
    bodyFatRaw: String(formData.get("body_fat_pct") ?? ""),
    muscleMassRaw: String(formData.get("muscle_mass_kg") ?? ""),
    bodyWaterRaw: String(formData.get("body_water_pct") ?? ""),
    visceralFatRaw: String(formData.get("visceral_fat_level") ?? ""),
    bmrRaw: String(formData.get("bmr_kcal") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });
}

export async function addMeasurementAction(
  _prevState: AddMeasurementState,
  formData: FormData,
): Promise<AddMeasurementState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const result = readMeasurementFormData(formData);

  if (!result.ok) {
    return { error: result.error };
  }

  await insertMeasurement({ clientId, ...result.data });
}

export type UpdateMeasurementState = { error?: string } | undefined;

export async function updateMeasurementAction(
  _prevState: UpdateMeasurementState,
  formData: FormData,
): Promise<UpdateMeasurementState> {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(clientId) || clientId <= 0) {
    return { error: "記録が指定されていません。" };
  }

  const result = readMeasurementFormData(formData);
  if (!result.ok) {
    return { error: result.error };
  }

  await updateMeasurement(clientId, id, result.data);
}

export async function deleteMeasurementAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteMeasurement(clientId, id);
  }
}
