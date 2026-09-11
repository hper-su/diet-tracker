"use client";

import { useMemo, useState } from "react";
import Model, { type IExerciseData } from "react-body-highlighter";
import {
  ANATOMY_CATEGORY_ORDER,
  ANATOMY_PARTS,
  ANATOMY_TYPE_LABELS,
  ANATOMY_VIEW_LABELS,
  BONE_IMAGE_SRC,
  BONE_IMAGE_VIEW_BOX,
  MUSCLE_MODEL_VIEW_BOX,
  searchAnatomyParts,
  type AnatomyPart,
  type AnatomyType,
  type AnatomyView,
  type BoneAnatomyPart,
  type MuscleAnatomyPart,
} from "@/lib/anatomy";
import {
  EXERCISE_CATEGORY_ORDER,
  MUSCLE_EXERCISE_NOTES,
  MUSCLE_EXERCISE_TABLE,
  findRelatedExercisesForBone,
  findRelatedExercisesForMuscle,
} from "@/lib/muscle-exercises";

const ROLE_LABELS = {
  primary: "主働筋",
  secondary: "補助筋",
} as const;

const TYPE_DOT_CLASS: Record<AnatomyType, string> = {
  muscle: "bg-rose-600",
  bone: "bg-slate-600",
};

const MUSCLE_HIGHLIGHT_COLOR = "#e11d48";
const MUSCLE_BODY_COLOR = "#d1d5db";

// マーカーの色。輪郭の塗りつぶし(MUSCLE_HIGHLIGHT_COLOR、赤)は複数の筋肉で
// 間借りされることがあるため、「どの筋肉がピンポイントで選ばれているか」は
// 別の色(青)のマーカーで示す。
const MUSCLE_MARKER_COLOR = "#1d4ed8";

function MuscleFigure({
  view,
  parts,
  highlightIds,
  showHighlight,
  selectedId,
  onSelect,
}: {
  view: AnatomyView;
  parts: MuscleAnatomyPart[];
  highlightIds: Set<string>;
  showHighlight: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const highlightedKeys = Array.from(
    new Set(
      parts
        .filter((p) =>
          showHighlight ? highlightIds.has(p.id) : p.id === selectedId,
        )
        .map((p) => p.muscleKey),
    ),
  );
  const data: IExerciseData[] =
    highlightedKeys.length > 0
      ? [{ name: "search", muscles: highlightedKeys }]
      : [];

  return (
    <div className="flex flex-col items-center">
      <p className="mb-1 text-xs font-medium text-gray-500">
        {ANATOMY_VIEW_LABELS[view]}
      </p>
      <div className="relative aspect-[100/200] w-72 sm:w-80">
        <div className="absolute inset-0">
          <Model
            type={view === "front" ? "anterior" : "posterior"}
            data={data}
            bodyColor={MUSCLE_BODY_COLOR}
            highlightedColors={[MUSCLE_HIGHLIGHT_COLOR]}
          />
        </div>
        <svg
          viewBox={MUSCLE_MODEL_VIEW_BOX}
          className="absolute inset-0 h-full w-full"
        >
          {parts.map((part) => {
            const selected = part.id === selectedId;
            const matched = showHighlight && highlightIds.has(part.id);
            const highlighted = matched || selected;
            const dimmed =
              showHighlight && !highlightIds.has(part.id) && !selected;
            return (
              <g
                key={part.id}
                onClick={() => onSelect(part.id)}
                className="cursor-pointer"
                opacity={dimmed ? 0.35 : 1}
              >
                {highlighted && (
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={5.5}
                    fill={MUSCLE_MARKER_COLOR}
                    fillOpacity={0.3}
                  />
                )}
                {selected && (
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={3.6}
                    fill="none"
                    stroke={MUSCLE_MARKER_COLOR}
                    strokeWidth={0.7}
                  />
                )}
                <circle
                  cx={part.x}
                  cy={part.y}
                  r={highlighted ? 2 : 1.4}
                  fill={highlighted ? MUSCLE_MARKER_COLOR : "#ffffff"}
                  stroke={highlighted ? "white" : "#374151"}
                  strokeWidth={0.5}
                />
                <title>{part.name}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function BoneFigure({
  view,
  parts,
  highlightIds,
  showHighlight,
  selectedId,
  onSelect,
}: {
  view: AnatomyView;
  parts: BoneAnatomyPart[];
  highlightIds: Set<string>;
  showHighlight: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-1 text-xs font-medium text-gray-500">
        {ANATOMY_VIEW_LABELS[view]}
      </p>
      <div className="relative aspect-[435.687/841.89] w-72 sm:w-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BONE_IMAGE_SRC[view]}
          alt={`人体骨格${ANATOMY_VIEW_LABELS[view]}図`}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <svg
          viewBox={BONE_IMAGE_VIEW_BOX}
          className="absolute inset-0 h-full w-full"
        >
          {parts.map((part) => {
            const selected = part.id === selectedId;
            const matched = showHighlight && highlightIds.has(part.id);
            const highlighted = matched || selected;
            const dimmed = showHighlight && !highlightIds.has(part.id) && !selected;
            const onRight = part.x >= 218;
            return (
              <g
                key={part.id}
                onClick={() => onSelect(part.id)}
                className="cursor-pointer"
                opacity={dimmed ? 0.3 : 1}
              >
                {highlighted && (
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={22}
                    fill={MUSCLE_HIGHLIGHT_COLOR}
                    fillOpacity={0.25}
                  />
                )}
                {selected && (
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={16}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={3.5}
                  />
                )}
                <circle
                  cx={part.x}
                  cy={part.y}
                  r={highlighted ? 10 : 8}
                  fill={highlighted ? MUSCLE_HIGHLIGHT_COLOR : "#475569"}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={onRight ? part.x + 13 : part.x - 13}
                  y={part.y + 4}
                  fontSize={16}
                  fontWeight={highlighted ? 700 : 400}
                  textAnchor={onRight ? "start" : "end"}
                  fill={highlighted ? MUSCLE_HIGHLIGHT_COLOR : "#1f2937"}
                  stroke="white"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {part.name}
                </text>
                <title>{part.name}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AnatomyPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<AnatomyType>("muscle");
  const [activeView, setActiveView] = useState<AnatomyView>("front");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const matches = useMemo(
    () => searchAnatomyParts(ANATOMY_PARTS, query),
    [query],
  );
  const hasQuery = query.trim().length > 0;
  const highlightIds = useMemo(
    () => new Set(matches.map((part) => part.id)),
    [matches],
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    const nextMatches = searchAnatomyParts(ANATOMY_PARTS, value);
    if (value.trim() && nextMatches.length > 0) {
      const stillVisible = nextMatches.some(
        (part) => part.type === activeType && part.view === activeView,
      );
      if (!stillVisible) {
        setActiveType(nextMatches[0].type);
        setActiveView(nextMatches[0].view);
      }
    }
  }

  function handleSelect(part: AnatomyPart) {
    setSelectedId(part.id);
    setActiveType(part.type);
    setActiveView(part.view);
  }

  const listSource = hasQuery ? matches : ANATOMY_PARTS;

  const groupedList = useMemo(() => {
    const types: AnatomyType[] = ["muscle", "bone"];
    return types
      .map((type) => {
        const byCategory = new Map<string, AnatomyPart[]>();
        for (const part of listSource) {
          if (part.type !== type) continue;
          const list = byCategory.get(part.category) ?? [];
          list.push(part);
          byCategory.set(part.category, list);
        }
        const groups = ANATOMY_CATEGORY_ORDER.map((category) => ({
          category,
          parts: byCategory.get(category) ?? [],
        })).filter((g) => g.parts.length > 0);
        return { type, groups };
      })
      .filter((g) => g.groups.length > 0);
  }, [listSource]);

  const selectedPart = ANATOMY_PARTS.find((p) => p.id === selectedId) ?? null;
  const relatedMuscleExercises = useMemo(
    () =>
      selectedPart?.type === "muscle"
        ? findRelatedExercisesForMuscle(selectedPart.name)
        : [],
    [selectedPart],
  );
  const relatedBoneExercises = useMemo(
    () =>
      selectedPart?.type === "bone"
        ? findRelatedExercisesForBone(selectedPart.name)
        : [],
    [selectedPart],
  );
  const visibleMuscleParts = ANATOMY_PARTS.filter(
    (part): part is MuscleAnatomyPart =>
      part.type === "muscle" && part.view === activeView,
  );
  const visibleBoneParts = ANATOMY_PARTS.filter(
    (part): part is BoneAnatomyPart =>
      part.type === "bone" && part.view === activeView,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">筋肉・骨</h1>
        <p className="mt-1 text-sm text-gray-600">
          全身の主要な筋肉・骨を、リアルな全身図と検索で確認できます。お客様へ運動やトレーニング部位を説明する際の参考にご活用ください。
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ※
          前鋸筋・中殿筋など一部の小さな筋肉は図に専用の輪郭が無いため、赤い塗りつぶしは隣接する筋肉と同じ範囲になります(詳細は選択時の説明に記載)。それぞれの位置には個別の青いマーカーが付いているので、マーカーをクリックすれば正しく選択できます。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="部位名で検索(例: 大胸筋、ふくらはぎ、骨盤)"
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["muscle", "bone"] as AnatomyType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  activeType === type
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                {ANATOMY_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["front", "back"] as AnatomyView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  activeView === view
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                {ANATOMY_VIEW_LABELS[view]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {(["muscle", "bone"] as AnatomyType[]).map((type) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS[type]}`}
                />
                {ANATOMY_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center rounded-lg border border-gray-100 bg-gray-50 py-4">
          {activeType === "muscle" ? (
            <MuscleFigure
              view={activeView}
              parts={visibleMuscleParts}
              highlightIds={highlightIds}
              showHighlight={hasQuery}
              selectedId={selectedId}
              onSelect={(id) => {
                const part = ANATOMY_PARTS.find((p) => p.id === id);
                if (part) handleSelect(part);
              }}
            />
          ) : (
            <BoneFigure
              view={activeView}
              parts={visibleBoneParts}
              highlightIds={highlightIds}
              showHighlight={hasQuery}
              selectedId={selectedId}
              onSelect={(id) => {
                const part = ANATOMY_PARTS.find((p) => p.id === id);
                if (part) handleSelect(part);
              }}
            />
          )}
        </div>

        {selectedPart ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-semibold text-gray-900">
                {selectedPart.name}
              </p>
              <span className="text-xs text-gray-500">
                {selectedPart.reading}
              </span>
              <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600">
                {ANATOMY_TYPE_LABELS[selectedPart.type]}・
                {ANATOMY_VIEW_LABELS[selectedPart.view]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {selectedPart.description}
            </p>
            {selectedPart.note && (
              <p className="mt-1 text-xs text-blue-900">
                {selectedPart.note}
              </p>
            )}
            {relatedMuscleExercises.length > 0 && (
              <div className="mt-2 border-t border-blue-100 pt-2">
                <p className="text-xs font-medium text-gray-500">関連する種目</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {relatedMuscleExercises.map((r) => (
                    <li
                      key={r.exercise}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        r.role === "primary"
                          ? "border-rose-300 bg-rose-50 text-rose-900"
                          : "border-gray-300 bg-white text-gray-600"
                      }`}
                    >
                      {r.exercise}({ROLE_LABELS[r.role]})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedBoneExercises.length > 0 && (
              <div className="mt-2 border-t border-blue-100 pt-2">
                <p className="text-xs font-medium text-gray-500">関連する種目</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {relatedBoneExercises.map((r) => (
                    <li
                      key={r.exercise}
                      className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600"
                    >
                      {r.exercise}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-xs text-gray-400">
            図または下の一覧から部位を選ぶと、詳しい説明が表示されます。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">
          部位一覧(全{listSource.length}件)
        </h2>
        <div className="space-y-5">
          {groupedList.map(({ type, groups }) => (
            <div key={type}>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS[type]}`}
                />
                {ANATOMY_TYPE_LABELS[type]}
              </h3>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.category}>
                    <h4 className="mb-1.5 text-xs font-medium text-gray-500">
                      {group.category}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.parts.map((part) => (
                        <button
                          key={part.id}
                          type="button"
                          onClick={() => handleSelect(part)}
                          className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-sm ${
                            part.id === selectedId
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <span className="font-medium text-gray-900">
                            {part.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ANATOMY_VIEW_LABELS[part.view]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {groupedList.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              該当する部位が見つかりませんでした。
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-medium">種目別 主働筋・補助筋の対応表</h2>
        <p className="mt-1 text-sm text-gray-600">
          主要な筋トレ種目と、使用する主働筋・補助筋・安定筋・骨/関節の対応表です。お客様への種目説明や、上の部位詳細に表示される「関連する種目」の元データとしても使っています。筋肉は
          <span className="mx-1 font-medium text-rose-700">赤系の文字</span>
          、骨・関節は
          <span className="mx-1 font-medium text-slate-600">グレー系の文字</span>
          で表示し、上の全身図と同じ色分けにしています。
        </p>
        <div className="mt-4 space-y-5">
          {EXERCISE_CATEGORY_ORDER.map((category) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {category}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2">種目</th>
                      <th className="px-3 py-2">
                        <span
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS.muscle}`}
                        />
                        主働筋
                      </th>
                      <th className="px-3 py-2">
                        <span
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS.muscle}`}
                        />
                        補助筋・安定筋
                      </th>
                      <th className="px-3 py-2">
                        <span
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS.bone}`}
                        />
                        関与する主な骨・関節
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MUSCLE_EXERCISE_TABLE[category].map((row) => (
                      <tr
                        key={row.exercise}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                          {row.exercise}
                        </td>
                        <td className="px-3 py-2 font-medium text-rose-700">
                          {row.primaryMuscles}
                        </td>
                        <td className="px-3 py-2 text-rose-500">
                          {row.secondaryMuscles}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.bonesJoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {MUSCLE_EXERCISE_NOTES.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500">補足</p>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-xs text-gray-600">
              {MUSCLE_EXERCISE_NOTES.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
