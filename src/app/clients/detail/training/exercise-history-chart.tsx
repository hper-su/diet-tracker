"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrainingLog } from "@/lib/db/training-logs";
import { parsePeakNumber } from "@/lib/health/training-progress";

export type ExerciseHistoryPoint = {
  recordedAt: string;
  weight: number | null;
  reps: number | null;
};

// TrainingLog(重さ・回数が自由記述の文字列)から、グラフ描画用に数値だけを
// 取り出す。「25,20」「10-8-6」のような表記からはその日の最大値(ピーク)を
// 採用する(src/lib/health/training-progress.ts参照)。数値が読み取れない
// 行(例: 自重のみで重さの記載なし)はnullのまま、線をつながず点を打たない。
export function toExerciseHistoryPoints(logs: TrainingLog[]): ExerciseHistoryPoint[] {
  return logs.map((log) => ({
    recordedAt: log.recordedAt!,
    weight: parsePeakNumber(log.weight),
    reps: parsePeakNumber(log.reps),
  }));
}

export function ExerciseHistoryChart({ data }: { data: ExerciseHistoryPoint[] }) {
  const hasAnyNumber = data.some((point) => point.weight !== null || point.reps !== null);
  if (!hasAnyNumber) {
    return (
      <p className="text-sm text-gray-500">
        重さ・回数を数値として読み取れる記録がまだありません(自重種目のみ、または未入力の場合はグラフ化できません)。
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="recordedAt"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis yAxisId="weight" tick={{ fontSize: 12 }} width={40} domain={["auto", "auto"]} />
          <YAxis
            yAxisId="reps"
            orientation="right"
            tick={{ fontSize: 12 }}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            name="重さ(最大値)"
            stroke="#2563eb"
            connectNulls
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="reps"
            type="monotone"
            dataKey="reps"
            name="回数(最大値)"
            stroke="#16a34a"
            connectNulls
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
