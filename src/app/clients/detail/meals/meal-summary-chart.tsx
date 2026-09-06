"use client";

import {
  Bar,
  BarChart,
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

export type DailyKcalPoint = {
  recordedAt: string;
  kcal: number;
};

export function MealSummaryChart({
  data,
  targetIntakeCalories,
}: {
  data: DailyKcalPoint[];
  targetIntakeCalories: number | null;
}) {
  // 目標ラインが軸の外に出て見えなくならないよう、目標値も含めて上限を決める。
  const dataMax = Math.max(0, ...data.map((point) => point.kcal));
  const yMax = Math.ceil(Math.max(dataMax, targetIntakeCalories ?? 0) * 1.1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="recordedAt"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis tick={{ fontSize: 12 }} width={48} domain={[0, yMax]} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(0)} kcal`, "摂取カロリー"]}
          />
          {targetIntakeCalories != null && (
            <ReferenceLine
              y={targetIntakeCalories}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{
                value: `目標 ${targetIntakeCalories.toFixed(0)}kcal`,
                position: "insideTopRight",
                fontSize: 11,
                fill: "#dc2626",
              }}
            />
          )}
          <Bar dataKey="kcal" name="摂取カロリー" fill="#2563eb" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type DailyMacroPoint = {
  recordedAt: string;
  proteinG: number;
  fatG: number;
  carbG: number;
};

// P/F/Cで色を揃える(たんぱく質=青、脂質=橙、炭水化物=緑)。
// 目標ラインは実績の線と同じ色の破線にして、どの目標がどの実績に対応するか
// 見た目だけで分かるようにする。
const MACRO_COLORS = {
  proteinG: "#2563eb",
  fatG: "#f59e0b",
  carbG: "#16a34a",
} as const;

const MACRO_NAMES: Record<keyof typeof MACRO_COLORS, string> = {
  proteinG: "たんぱく質",
  fatG: "脂質",
  carbG: "炭水化物",
};

export function PFCTrendChart({
  data,
  targetProteinG,
  targetFatG,
  targetCarbG,
}: {
  data: DailyMacroPoint[];
  targetProteinG: number | null;
  targetFatG: number | null;
  targetCarbG: number | null;
}) {
  const targets = {
    proteinG: targetProteinG,
    fatG: targetFatG,
    carbG: targetCarbG,
  };
  const dataMax = Math.max(
    0,
    ...data.map((point) => Math.max(point.proteinG, point.fatG, point.carbG)),
  );
  const targetMax = Math.max(targetProteinG ?? 0, targetFatG ?? 0, targetCarbG ?? 0);
  const yMax = Math.ceil(Math.max(dataMax, targetMax) * 1.1);

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
          <YAxis tick={{ fontSize: 12 }} width={40} domain={[0, yMax]} />
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(0)}g`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {(Object.keys(MACRO_COLORS) as (keyof typeof MACRO_COLORS)[]).map(
            (key) =>
              targets[key] != null && (
                <ReferenceLine
                  key={key}
                  y={targets[key]!}
                  stroke={MACRO_COLORS[key]}
                  strokeDasharray="4 4"
                />
              ),
          )}
          <Line
            type="monotone"
            dataKey="proteinG"
            name={MACRO_NAMES.proteinG}
            stroke={MACRO_COLORS.proteinG}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="fatG"
            name={MACRO_NAMES.fatG}
            stroke={MACRO_COLORS.fatG}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="carbG"
            name={MACRO_NAMES.carbG}
            stroke={MACRO_COLORS.carbG}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
