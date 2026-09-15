import { supabase, unwrap, run, runWithColumnFallback } from "./supabase";
import { notifyChange } from "./realtime";

export type Measurement = {
  id: number;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

// 古い記録から新しい記録の順(グラフ描画・findLatestNonNullでの直近値探索に使う順)。
export async function listMeasurements(clientId: number): Promise<Measurement[]> {
  const rows = await unwrap<(Measurement & { clientId: number })[]>(
    supabase
      .from("measurements")
      .select("*")
      .eq("clientId", clientId)
      .order("recordedAt", { ascending: true })
      .order("id", { ascending: true }),
  );
  return rows.map(({ clientId: _clientId, ...rest }) => rest);
}

export type InsertMeasurementInput = {
  clientId: number;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

export async function insertMeasurement(
  input: InsertMeasurementInput,
): Promise<{ droppedColumns: string[] }> {
  const result = await runWithColumnFallback(input, (row) =>
    supabase.from("measurements").insert(row),
  );
  notifyChange(["measurements"]);
  return result;
}

export type UpdateMeasurementInput = {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

export async function updateMeasurement(
  clientId: number,
  id: number,
  input: UpdateMeasurementInput,
): Promise<{ droppedColumns: string[] }> {
  const result = await runWithColumnFallback(input, (row) =>
    supabase
      .from("measurements")
      .update(row)
      .eq("id", id)
      .eq("clientId", clientId),
  );
  notifyChange(["measurements"]);
  return result;
}

export async function deleteMeasurement(clientId: number, id: number): Promise<void> {
  await run(
    supabase.from("measurements").delete().eq("id", id).eq("clientId", clientId),
  );
  notifyChange(["measurements"]);
}
