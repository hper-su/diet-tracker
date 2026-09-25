"use client";

import { useEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";
import { WGER_MUSCLES } from "@/lib/wger/data";

// wgerの人体図(前面/背面)の上に、筋肉ごとのオーバーレイSVGを重ねて表示する。
// 人体図はscripts/build-wger-data.mjsでWebPに変換して取り込み済み(元SVGは
// 300KB超で描画が重かったため)。オーバーレイは人体と同じ座標系(左上基準)で
// 作られているため、同じ幅・左上揃えで重ねれば位置が合う(高さはSVGごとに数px
// 違うがautoに任せる)。図を押すと、同じ図を大きくしたダイアログを開く。
const BODY_WIDTH = 200;
const BODY_HEIGHT = 369;
const ENLARGED_WIDTH = 340;

const VIEWS = [
  { key: "front", label: "前面", isFront: true },
  { key: "back", label: "背面", isFront: false },
] as const;

const muscleById = new Map(WGER_MUSCLES.map((m) => [m.id, m]));

// ボタンの中にも置くため、figure/divではなくspanで組み立てている
// (buttonの中に置けるのは文章内容のみ)。
function BodyFigures({
  primaryIds,
  secondary,
  width,
  enlarged,
}: {
  primaryIds: number[];
  secondary: number[];
  width: number;
  enlarged: boolean;
}) {
  return (
    <span className="flex flex-wrap items-start justify-center gap-4">
      {VIEWS.map((view) => {
        const overlays = [
          ...secondary.map((id) => ({ id, kind: "secondary" as const })),
          ...primaryIds.map((id) => ({ id, kind: "main" as const })),
        ].filter(({ id }) => muscleById.get(id)?.isFront === view.isFront);

        return (
          <span
            key={view.key}
            className="block"
            // 通常表示は2枚を横に並べる。拡大時は幅が足りなければ折り返して縦に並ぶ。
            style={enlarged ? { width: `min(${width}px, 100%)` } : { width, maxWidth: "45%" }}
          >
            <span
              className="relative block w-full"
              style={{ aspectRatio: `${BODY_WIDTH} / ${BODY_HEIGHT}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE_PATH}/anatomy/wger/body-${view.key}.webp`}
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
            </span>
            <span className="mt-1 block text-center text-xs text-gray-500">{view.label}</span>
          </span>
        );
      })}
    </span>
  );
}

function Legend({ primaryLabel, hasSecondary }: { primaryLabel: string; hasSecondary: boolean }) {
  return (
    <p className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs text-gray-500">
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600" />
        {primaryLabel}
      </span>
      {hasSecondary && (
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />
          補助筋
        </span>
      )}
    </p>
  );
}

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

  // 拡大表示は開いている間だけ中身を描画する(画像を二重に持たないため)。
  const [enlarged, setEnlarged] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (enlarged && dialog && !dialog.open) dialog.showModal();
  }, [enlarged]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        aria-label="筋肉図を拡大して表示"
        className="block w-full cursor-zoom-in rounded"
      >
        <BodyFigures
          primaryIds={primaryIds}
          secondary={secondary}
          width={maxWidth}
          enlarged={false}
        />
      </button>
      <Legend primaryLabel={primaryLabel} hasSecondary={secondary.length > 0} />
      <p className="text-center text-xs text-gray-400">図を押すと拡大します</p>

      {enlarged && (
        <dialog
          ref={dialogRef}
          onClose={() => setEnlarged(false)}
          // ダイアログの外側(背景)を押したときも閉じる。
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
          aria-label="筋肉図(拡大)"
          className="m-auto max-h-[94vh] w-[min(94vw,780px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-xl backdrop:bg-black/50"
        >
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
          <BodyFigures
            primaryIds={primaryIds}
            secondary={secondary}
            width={ENLARGED_WIDTH}
            enlarged
          />
          <Legend primaryLabel={primaryLabel} hasSecondary={secondary.length > 0} />
        </dialog>
      )}
    </div>
  );
}
