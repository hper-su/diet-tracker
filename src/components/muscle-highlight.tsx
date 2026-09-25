import { BASE_PATH } from "@/lib/base-path";
import { WGER_MUSCLES } from "@/lib/wger/data";

// wgerの人体図(前面/背面)の上に、筋肉ごとのオーバーレイSVGを重ねて表示する。
// 画像はscripts/build-wger-data.mjsでpublic/anatomy/wger/に取り込み済み
// (viewBox付与済み)。オーバーレイは人体と同じ座標系(左上基準)で作られているため、
// 同じ幅・左上揃えで重ねれば位置が合う(高さはSVGごとに数px違うがautoに任せる)。
const BODY_WIDTH = 200;
const BODY_HEIGHT = 369;

const VIEWS = [
  { key: "front", label: "前面", isFront: true },
  { key: "back", label: "背面", isFront: false },
] as const;

const muscleById = new Map(WGER_MUSCLES.map((m) => [m.id, m]));

export function MuscleHighlight({
  primaryIds,
  secondaryIds = [],
  maxWidth = 180,
  primaryLabel = "主働筋",
}: {
  primaryIds: number[];
  secondaryIds?: number[];
  maxWidth?: number;
  primaryLabel?: string;
}) {
  const primary = new Set(primaryIds);
  const secondary = secondaryIds.filter((id) => !primary.has(id));

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-4">
        {VIEWS.map((view) => {
          const overlays = [
            ...secondary.map((id) => ({ id, kind: "secondary" as const })),
            ...primaryIds.map((id) => ({ id, kind: "main" as const })),
          ].filter(({ id }) => muscleById.get(id)?.isFront === view.isFront);

          return (
            <figure key={view.key} className="m-0" style={{ width: maxWidth, maxWidth: "45%" }}>
              <div
                className="relative w-full"
                style={{ aspectRatio: `${BODY_WIDTH} / ${BODY_HEIGHT}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE_PATH}/anatomy/wger/body-${view.key}.svg`}
                  alt={`人体${view.label}`}
                  className="absolute top-0 left-0 h-full w-full"
                />
                {overlays.map(({ id, kind }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${kind}-${id}`}
                    src={`${BASE_PATH}/anatomy/wger/${kind}-${id}.svg`}
                    alt=""
                    aria-hidden
                    className="absolute top-0 left-0 h-auto w-full"
                  />
                ))}
              </div>
              <figcaption className="mt-1 text-center text-xs text-gray-500">
                {view.label}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs text-gray-500">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600" />
          {primaryLabel}
        </span>
        {secondary.length > 0 && (
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />
            補助筋
          </span>
        )}
      </p>
    </div>
  );
}
