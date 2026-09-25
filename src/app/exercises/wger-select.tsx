import { WGER_EXERCISES } from "@/lib/wger/data";

// 取り込み済みのwger種目(scripts/build-wger-data.mjs)から選ぶプルダウン。
// 選択肢を増やすには scripts/lib/wger-exercise-map.mjs に追加して再生成する。
const OPTIONS = [...WGER_EXERCISES]
  .sort((a, b) => a.name.localeCompare(b.name, "en"))
  .map((exercise) => ({
    id: exercise.id,
    label: exercise.equipment.length
      ? `${exercise.name}(${exercise.equipment.join("、")})`
      : exercise.name,
  }));

export function WgerSelect({
  defaultValue,
  className,
}: {
  defaultValue?: number | null;
  className: string;
}) {
  return (
    <select name="wger_id" defaultValue={defaultValue ?? ""} className={className}>
      <option value="">(未設定)</option>
      {OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
