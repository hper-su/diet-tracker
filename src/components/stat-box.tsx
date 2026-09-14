export type Stat = {
  label: string;
  value: string;
  note?: string;
};

// 数値や重要なイメージを目立たせるハイライトボックス。
export function StatBox({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-lg bg-blue-50 p-3">
      <p className="text-xs font-medium text-blue-700">{stat.label}</p>
      <p className="mt-0.5 text-base font-bold text-blue-900">{stat.value}</p>
      {stat.note && <p className="mt-1 text-xs text-blue-700">{stat.note}</p>}
    </div>
  );
}
