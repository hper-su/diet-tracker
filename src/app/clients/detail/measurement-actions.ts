import {
  insertMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from "@/lib/db/measurements";
import { validateMeasurementInput } from "@/lib/validation/measurement";

// マイグレーション未適用でまだ存在しない列は、DB層が黙って除いて保存する
// (runWithColumnFallback)。除かれた列があれば、お客様の入力が実は
// 保存されていないことに気づけるよう、フォームに警告として表示する。
const COLUMN_LABELS: Record<string, string> = {
  bodyWaterPct: "体水分率",
};

function buildDroppedColumnsWarning(droppedColumns: string[]): string | undefined {
  if (droppedColumns.length === 0) return undefined;
  const labels = droppedColumns.map((column) => COLUMN_LABELS[column] ?? column);
  return `${labels.join("・")}はデータベースの準備が完了していないため保存されませんでした(他の項目は保存済みです)。`;
}

export type AddMeasurementState = { error?: string; warning?: string } | undefined;

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

  const { droppedColumns } = await insertMeasurement({ clientId, ...result.data });
  const warning = buildDroppedColumnsWarning(droppedColumns);
  return warning ? { warning } : undefined;
}

export type UpdateMeasurementState = { error?: string; warning?: string } | undefined;

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

  const { droppedColumns } = await updateMeasurement(clientId, id, result.data);
  const warning = buildDroppedColumnsWarning(droppedColumns);
  return warning ? { warning } : undefined;
}

export async function deleteMeasurementAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (Number.isInteger(id) && id > 0 && Number.isInteger(clientId) && clientId > 0) {
    await deleteMeasurement(clientId, id);
  }
}
