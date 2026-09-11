import { getProtocolCondition } from "@/lib/conditions";
import {
  insertProtocolCheck,
  deleteProtocolCheck,
  type ProtocolCheckStepResult,
} from "@/lib/db/protocol-checks";

export type AddProtocolCheckState = { error?: string } | undefined;

export async function addProtocolCheckAction(
  _prevState: AddProtocolCheckState,
  formData: FormData,
): Promise<AddProtocolCheckState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: "お客様が指定されていません。" };
  }

  const conditionId = String(formData.get("condition_id") ?? "");
  const condition = getProtocolCondition(conditionId);
  if (!condition) {
    return { error: "症状を選択してください。" };
  }

  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!recordedAt) {
    return { error: "日付を入力してください。" };
  }

  const results: ProtocolCheckStepResult[] = [];
  condition.protocolTable.forEach((_step, index) => {
    const raw = formData.get(`result_${index}`);
    if (raw === "achieved" || raw === "not_achieved") {
      results.push({ step: index, achieved: raw === "achieved" });
    }
  });

  if (results.length === 0) {
    return { error: "少なくとも1つのステップの結果を記録してください。" };
  }

  const memoRaw = String(formData.get("memo") ?? "").trim();

  await insertProtocolCheck({
    clientId,
    recordedAt,
    conditionId,
    results,
    memo: memoRaw.length > 0 ? memoRaw : null,
  });
}

export async function deleteProtocolCheckAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const clientId = Number(formData.get("client_id"));
  if (
    Number.isInteger(id) &&
    id > 0 &&
    Number.isInteger(clientId) &&
    clientId > 0
  ) {
    await deleteProtocolCheck(clientId, id);
  }
}
