import { updateClientGoal } from "@/lib/db/clients";
import { parsePositiveNumber } from "@/lib/validation/result";

export type UpdatePlanGoalState = { error?: string } | undefined;

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

  await updateClientGoal(clientId, monthlyGoal, change, months, targetWeightKg);
}
