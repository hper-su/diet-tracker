import {
  WGER_LICENSE_URL,
  getWgerExercise,
  wgerMuscleLabel,
} from "@/lib/wger/data";
import { MuscleHighlight } from "./muscle-highlight";

export function WgerAttribution() {
  return (
    <p className="text-xs text-gray-400">
      種目情報・筋肉図:{" "}
      <a
        href="https://wger.de"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-600"
      >
        wger.de
      </a>{" "}
      (
      <a
        href={WGER_LICENSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-600"
      >
        CC BY-SA 3.0
      </a>
      )。筋肉区分はwgerの基準のため、指導用の部位一覧とは細かさが異なります。
    </p>
  );
}

// 種目マスタに紐づけたwgerの種目について、フォーム画像と、使う筋肉の
// 全身図ハイライト(主働筋/補助筋)を表示する。
export function WgerExercisePanel({ wgerId }: { wgerId: number }) {
  const exercise = getWgerExercise(wgerId);
  if (!exercise) {
    return (
      <p className="text-xs text-gray-500">
        wger種目(#{wgerId})のデータが取り込まれていません。
      </p>
    );
  }

  const hasMuscles = exercise.primaryMuscleIds.length + exercise.secondaryMuscleIds.length > 0;
  const primaryLabels = exercise.primaryMuscleIds.map(wgerMuscleLabel);
  const secondaryLabels = exercise.secondaryMuscleIds
    .filter((id) => !exercise.primaryMuscleIds.includes(id))
    .map(wgerMuscleLabel);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-medium">{exercise.name}</span>
        {exercise.equipment.length > 0 && (
          <span className="text-xs text-gray-500">({exercise.equipment.join("、")})</span>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {exercise.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {exercise.images.slice(0, 2).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`${exercise.name}のフォーム`}
                loading="lazy"
                className="h-40 w-40 rounded border border-gray-100 object-cover"
              />
            ))}
          </div>
        )}

        {hasMuscles ? (
          <div className="min-w-0 flex-1 space-y-2" style={{ minWidth: 220 }}>
            <MuscleHighlight
              primaryIds={exercise.primaryMuscleIds}
              secondaryIds={exercise.secondaryMuscleIds}
              maxWidth={110}
            />
            <p className="text-xs text-gray-700">
              <span className="font-medium text-red-700">主働筋:</span>{" "}
              {primaryLabels.join("、") || "—"}
              {secondaryLabels.length > 0 && (
                <>
                  <br />
                  <span className="font-medium text-orange-600">補助筋:</span>{" "}
                  {secondaryLabels.join("、")}
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">wgerにこの種目の筋肉データがありません。</p>
        )}
      </div>

      <WgerAttribution />
    </div>
  );
}
