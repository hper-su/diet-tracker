import { db } from "./client";

export type ExerciseCategory = "生活活動" | "運動";

export type Exercise = {
  id: number;
  category: ExerciseCategory;
  name: string;
  mets: number;
};

// 運動習慣フォームの種目選択(セレクトボックス)用。
export async function listExercises(): Promise<Exercise[]> {
  const rows = await db.exercises.toArray();
  return rows.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.mets - b.mets ||
      a.name.localeCompare(b.name),
  );
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const row = await db.exercises.get(id);
  return row ?? null;
}
