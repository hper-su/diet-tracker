"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MeasurementPoint = {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  // 目標体重への到達予測を示す点線用。実測値と重なる区間ではnull。
  projectedWeightKg?: number | null;
};

export function MeasurementChart({
  data,
  targetWeightKg,
}: {
  data: MeasurementPoint[];
  targetWeightKg?: number | null;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        まだ測定データがありません。記録すると推移グラフが表示されます。
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="recordedAt" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 12 }}
            width={40}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="bodyFat"
            orientation="right"
            tick={{ fontSize: 12 }}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip />
          <Legend />
          {targetWeightKg != null && (
            <ReferenceLine
              yAxisId="weight"
              y={targetWeightKg}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{
                value: `目標 ${targetWeightKg}kg`,
                position: "right",
                fontSize: 11,
                fill: "#16a34a",
              }}
            />
          )}
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weightKg"
            name="体重(kg)"
            stroke="#2563eb"
            connectNulls
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="weight"
            type="linear"
            dataKey="projectedWeightKg"
            name="目標到達の見込み"
            stroke="#16a34a"
            strokeDasharray="5 5"
            connectNulls
            dot={false}
          />
          <Line
            yAxisId="bodyFat"
            type="monotone"
            dataKey="bodyFatPct"
            name="体脂肪率(%)"
            stroke="#dc2626"
            connectNulls
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
