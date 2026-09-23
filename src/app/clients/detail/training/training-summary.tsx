import type { ExerciseFrequency } from "@/lib/db/training-logs";

// 「実施数が多い種目」の一覧(参考エクセルの「顧客サマリー」シートに相当)。
// 直近の記録(重さ・回数・セット数)も併記し、次回の負荷設定の目安にできるようにする。
export function TrainingSummary({ frequencies }: { frequencies: ExerciseFrequency[] }) {
  if (frequencies.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500">まだトレーニング記録がありません。</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="px-4 py-2">種目</th>
            <th className="px-4 py-2">実施回数</th>
            <th className="px-4 py-2">直近の記録(重さ/回数/セット数)</th>
            <th className="px-4 py-2">直近実施日</th>
          </tr>
        </thead>
        <tbody>
          {frequencies.map((freq) => (
            <tr key={freq.exerciseId ?? freq.exerciseName} className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium">{freq.exerciseName}</td>
              <td className="px-4 py-2">{freq.count}回</td>
              <td className="px-4 py-2 text-gray-600">
                {freq.lastWeight || "—"} / {freq.lastReps || "—"} / {freq.lastSets || "—"}
              </td>
              <td className="px-4 py-2 text-gray-500">
                {freq.lastRecordedAt ?? "日付不明"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
