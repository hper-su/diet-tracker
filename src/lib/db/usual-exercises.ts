import { db } from "./client";

export type UsualExercise = {
  id: number;
  clientId: number;
  exerciseId: number | null;
  exerciseName: string;
  mets: number;
  durationMin: number;
  frequencyPerWeek: number;
};

// お客様が普段行っている運動(週あたりの頻度・1回の時間)の目安を管理する。
// 「普段の3食」(usual_meals)と同じ位置づけで、プランのメンテナンスカロリー算出に使う。
export async function listUsualExercises(clientId: number): Promise<UsualExercise[]> {
  const rows = await db.usualExercises.where("clientId").equals(clientId).toArray();
  return rows.sort((a, b) => a.id - b.id);
}

export type InsertUsualExerciseInput = {
  clientId: number;
  exerciseId: number | null;
  exerciseName: string;
  mets: number;
  durationMin: number;
  frequencyPerWeek: number;
};

export async function insertUsualExercise(input: InsertUsualExerciseInput): Promise<void> {
  await db.usualExercises.add({ ...input } as UsualExercise);
}

export async function deleteUsualExercise(clientId: number, id: number): Promise<void> {
  const row = await db.usualExercises.get(id);
  if (row && row.clientId === clientId) {
    await db.usualExercises.delete(id);
  }
}
