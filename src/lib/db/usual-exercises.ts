import { supabase, unwrap, run } from "./supabase";

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
  return unwrap<UsualExercise[]>(
    supabase
      .from("usualExercises")
      .select("*")
      .eq("clientId", clientId)
      .order("id", { ascending: true }),
  );
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
  await run(supabase.from("usualExercises").insert({ ...input }));
}

export async function deleteUsualExercise(clientId: number, id: number): Promise<void> {
  await run(
    supabase.from("usualExercises").delete().eq("id", id).eq("clientId", clientId),
  );
}
