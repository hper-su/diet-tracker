import { db } from "./client";

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
  const rows = await db.measurements.where("clientId").equals(clientId).toArray();
  return rows
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id - b.id)
    .map(({ clientId: _clientId, ...rest }) => rest);
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
  await db.measurements.add({ ...input });
}

export async function deleteMeasurement(clientId: number, id: number): Promise<void> {
  const row = await db.measurements.get(id);
  if (row && row.clientId === clientId) {
    await db.measurements.delete(id);
  }
}
