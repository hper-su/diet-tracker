import { supabase, unwrap } from "./supabase";

export type ExerciseCategory = "生活活動" | "運動";

export type Exercise = {
  id: number;
  category: ExerciseCategory;
  name: string;
  mets: number;
};

// 運動習慣フォームの種目選択(セレクトボックス)用。
export async function listExercises(): Promise<Exercise[]> {
  const rows = await unwrap<Exercise[]>(supabase.from("exercises").select("*"));
  return rows.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.mets - b.mets ||
      a.name.localeCompare(b.name),
  );
}

export async function getExercise(id: number): Promise<Exercise | null> {
  return unwrap<Exercise | null>(
    supabase.from("exercises").select("*").eq("id", id).maybeSingle(),
  );
}
