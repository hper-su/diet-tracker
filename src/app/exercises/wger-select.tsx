import { WGER_EXERCISES, getWgerExercise } from "@/lib/wger/data";

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
  // 保存済みのIDが取り込み済みの一覧に無い場合(バックアップの復元や、再生成で
  // 対応から外れた場合)も、選択肢に残す。無いと「未設定」に見え、名前だけ
  // 直して保存したときにwgerとの紐づけが黙って消えてしまう。
  const isKnown = defaultValue == null || getWgerExercise(defaultValue) !== null;

  return (
    <select name="wger_id" defaultValue={defaultValue ?? ""} className={className}>
      <option value="">(未設定)</option>
      {!isKnown && <option value={defaultValue}>wger #{defaultValue}(データ未取り込み)</option>}
      {OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
