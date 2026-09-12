import { supabase, unwrap, run } from "./supabase";

export type Measurement = {
  id: number;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
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
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  memo: string | null;
};

export async function insertMeasurement(input: InsertMeasurementInput): Promise<void> {
  await run(supabase.from("measurements").insert({ ...input }));
}

export async function deleteMeasurement(clientId: number, id: number): Promise<void> {
  await run(
    supabase.from("measurements").delete().eq("id", id).eq("clientId", clientId),
  );
}
