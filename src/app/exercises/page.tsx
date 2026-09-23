"use client";

import { useLiveQuery } from "@/lib/db/use-live-query";
import { listExercises, subscribeToExercises } from "@/lib/db/exercises";
import { ExerciseForm } from "./exercise-form";
import { ExerciseRow } from "./exercise-row";

export default function ExercisesPage() {
  const exercises = useLiveQuery(() => listExercises(), [], [subscribeToExercises]);

  if (!exercises) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">種目マスタ</h1>

      <ExerciseForm />

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-medium">登録済みの種目(全{exercises.length}件)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">種目名</th>
                <th className="px-4 py-2">別名</th>
                <th className="sticky right-0 bg-white px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise) => (
                <ExerciseRow key={exercise.id} exercise={exercise} />
              ))}
              {exercises.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    まだ種目が登録されていません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
