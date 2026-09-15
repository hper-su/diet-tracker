import { updateClientGoal } from "@/lib/db/clients";
import { parsePositiveNumber } from "@/lib/validation/result";

// マイグレーション未適用でまだ存在しない列は、DB層が黙って除いて保存する
// (runWithColumnFallback)。除かれた列があれば、お客様の入力が実は
// 保存されていないことに気づけるよう、フォームに警告として表示する。
const COLUMN_LABELS: Record<string, string> = {
  targetBodyFatPct: "目標体脂肪率",
};

function buildDroppedColumnsWarning(droppedColumns: string[]): string | undefined {
  if (droppedColumns.length === 0) return undefined;
  const labels = droppedColumns.map((column) => COLUMN_LABELS[column] ?? column);
  return `${labels.join("・")}はデータベースの準備が完了していないため保存されませんでした(他の項目は保存済みです)。`;
}

export type UpdatePlanGoalState = { error?: string; warning?: string } | undefined;

export async function updatePlanGoal(
  _prevState: UpdatePlanGoalState,
  formData: FormData,
): Promise<UpdatePlanGoalState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const changeRaw = String(formData.get("target_weight_change_kg") ?? "");
  if (!changeRaw) {
    return { error: "目標体重変化を入力してください。" };
  }
  const change = Number(changeRaw);
  if (!Number.isFinite(change)) {
    return { error: "目標体重変化は数値で入力してください。" };
  }

  const monthsRaw = String(formData.get("target_period_months") ?? "");
  const months = monthsRaw ? Number(monthsRaw) : 1;
  if (!Number.isFinite(months) || !(months > 0)) {
    return { error: "期間(か月)は正の数で入力してください。" };
  }

  const monthlyGoal = change / months;

  const targetWeightRaw = String(formData.get("target_weight_kg") ?? "").trim();
  let targetWeightKg: number | null = null;
  if (targetWeightRaw) {
    const result = parsePositiveNumber(
      targetWeightRaw,
      "目標体重(kg)は正の数で入力してください。",
    );
    if (!result.ok) {
      return result;
    }
    targetWeightKg = result.data;
  }

  const targetBodyFatRaw = String(formData.get("target_body_fat_pct") ?? "").trim();
  let targetBodyFatPct: number | null = null;
  if (targetBodyFatRaw) {
    const result = parsePositiveNumber(
      targetBodyFatRaw,
      "目標体脂肪率(%)は正の数で入力してください。",
    );
    if (!result.ok) {
      return result;
    }
    targetBodyFatPct = result.data;
  }

  const { droppedColumns } = await updateClientGoal(
    clientId,
    monthlyGoal,
    change,
    months,
    targetWeightKg,
    targetBodyFatPct,
  );

  return { warning: buildDroppedColumnsWarning(droppedColumns) };
}
