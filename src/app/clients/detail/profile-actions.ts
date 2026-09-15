import { updateClientProfile } from "@/lib/db/clients";
import { validateClientInput } from "@/lib/validation/client";

// マイグレーション未適用でまだ存在しない列は、DB層が黙って除いて保存する
// (runWithColumnFallback)。除かれた列があれば、お客様の入力が実は
// 保存されていないことに気づけるよう、フォームに警告として表示する。
const COLUMN_LABELS: Record<string, string> = {
  course: "コース/プロテイン",
  purpose: "目的",
};

function buildDroppedColumnsWarning(droppedColumns: string[]): string | undefined {
  if (droppedColumns.length === 0) return undefined;
  const labels = droppedColumns.map((column) => COLUMN_LABELS[column] ?? column);
  return `${labels.join("・")}はデータベースの準備が完了していないため保存されませんでした(他の項目は保存済みです)。`;
}

export type UpdateClientProfileState =
  | { error?: string; success?: boolean; warning?: string }
  | undefined;

export async function updateClientProfileAction(
  _prevState: UpdateClientProfileState,
  formData: FormData,
): Promise<UpdateClientProfileState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const result = validateClientInput({
    name: String(formData.get("name") ?? ""),
    birthdate: String(formData.get("birthdate") ?? ""),
    heightRaw: String(formData.get("height_cm") ?? ""),
    genderRaw: String(formData.get("gender") ?? ""),
    activityLevelRaw: String(formData.get("activity_level") ?? ""),
    pfcPresetRaw: String(formData.get("pfc_preset") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const course = String(formData.get("course") ?? "").trim() || null;
  const purpose = String(formData.get("purpose") ?? "").trim() || null;

  const { droppedColumns } = await updateClientProfile(clientId, {
    ...result.data,
    course,
    purpose,
  });

  return { success: true, warning: buildDroppedColumnsWarning(droppedColumns) };
}
