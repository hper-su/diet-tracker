import { supabase, unwrap, run } from "./supabase";

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
  const rows = await unwrap<(ProtocolCheck & { clientId: number })[]>(
    supabase
      .from("protocolChecks")
      .select("*")
      .eq("clientId", clientId)
      .order("recordedAt", { ascending: true })
      .order("id", { ascending: true }),
  );
  return rows.map(({ clientId: _clientId, ...rest }) => rest);
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
  await run(supabase.from("protocolChecks").insert({ ...input }));
}

export async function deleteProtocolCheck(
  clientId: number,
  id: number,
): Promise<void> {
  await run(
    supabase.from("protocolChecks").delete().eq("id", id).eq("clientId", clientId),
  );
}
