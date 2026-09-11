import { db } from "./client";

export type ProtocolCheckStepResult = {
  step: number; // conditions.tsのprotocolTable内でのインデックス(0始まり)
  achieved: boolean;
};

export type ProtocolCheck = {
  id: number;
  recordedAt: string;
  conditionId: string; // lib/conditions.tsのCondition.id(お客様には症状名で表示)
  results: ProtocolCheckStepResult[];
  memo: string | null;
};

// 古い記録から新しい記録の順(measurementsと同じ並び順の考え方)。
export async function listProtocolChecks(
  clientId: number,
): Promise<ProtocolCheck[]> {
  const rows = await db.protocolChecks
    .where("clientId")
    .equals(clientId)
    .toArray();
  return rows
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id - b.id)
    .map(({ clientId: _clientId, ...rest }) => rest);
}

export type InsertProtocolCheckInput = {
  clientId: number;
  recordedAt: string;
  conditionId: string;
  results: ProtocolCheckStepResult[];
  memo: string | null;
};

export async function insertProtocolCheck(
  input: InsertProtocolCheckInput,
): Promise<void> {
  await db.protocolChecks.add({ ...input });
}

export async function deleteProtocolCheck(
  clientId: number,
  id: number,
): Promise<void> {
  const row = await db.protocolChecks.get(id);
  if (row && row.clientId === clientId) {
    await db.protocolChecks.delete(id);
  }
}
