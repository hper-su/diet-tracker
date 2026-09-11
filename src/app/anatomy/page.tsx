"use client";

import { useMemo, useState } from "react";
import {
  ANATOMY_CATEGORY_ORDER,
  ANATOMY_PARTS,
  ANATOMY_TYPE_LABELS,
  ANATOMY_VIEW_LABELS,
  searchAnatomyParts,
  type AnatomyPart,
  type AnatomyType,
} from "@/lib/anatomy";
import {
  EXERCISE_CATEGORY_ORDER,
  MUSCLE_EXERCISE_NOTES,
  MUSCLE_EXERCISE_TABLE,
  findRelatedExercisesForBone,
  findRelatedExercisesForMuscle,
} from "@/lib/muscle-exercises";

// public/anatomy/配下の全身図イラスト。色検出によるハイライト連動は
// 精度が不十分だったため廃止し、参考画像として静的に表示するのみとする。
// width/height は読み込み中のレイアウトシフトを防ぐために使用する。
const MUSCLE_DIAGRAM_IMAGE = { width: 704, height: 480 } as const;

const BONE_DIAGRAM_IMAGES = [
  {
    id: "spine",
    title: "脊柱の側面",
    src: "/anatomy/bone-spine.gif",
    alt: "脊柱の側面図(頸椎・胸椎・腰椎・仙骨・尾骨)",
    width: 600,
    height: 558,
  },
  {
    id: "ribcage",
    title: "肋骨・肩甲骨の正面",
    src: "/anatomy/bone-ribcage.gif",
    alt: "肋骨・鎖骨・肩甲骨・胸骨の正面図",
    width: 600,
    height: 480,
  },
  {
    id: "pelvis",
    title: "骨盤(男女比較)",
    src: "/anatomy/bone-pelvis.jpg",
    alt: "骨盤の男女比較図(腸骨・恥骨・坐骨)",
    width: 684,
    height: 456,
  },
] as const;

const ROLE_LABELS = {
  primary: "主働筋",
  secondary: "補助筋",
} as const;

const TYPE_DOT_CLASS: Record<AnatomyType, string> = {
  muscle: "bg-rose-600",
  bone: "bg-slate-600",
};

export default function AnatomyPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const matches = useMemo(
    () => searchAnatomyParts(ANATOMY_PARTS, query),
    [query],
  );
  const hasQuery = query.trim().length > 0;

  function handleSelect(part: AnatomyPart) {
    setSelectedId(part.id);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">筋肉・骨</h1>
        <p className="mt-1 text-sm text-gray-600">
          全身の主要な筋肉・骨を、一覧と検索で確認できます。お客様へ運動やトレーニング部位を説明する際の参考にご活用ください。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">筋肉部位 早見図</h2>
        <p className="mb-2 text-xs text-gray-500">
          全身の主要な筋肉の位置を示す参考図です。詳しい説明は下の「部位一覧」から確認できます。
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/anatomy/muscle-diagram.jpg"
          alt="人体の主要筋肉部位図解(前面・背面、色分け)"
          width={MUSCLE_DIAGRAM_IMAGE.width}
          height={MUSCLE_DIAGRAM_IMAGE.height}
          className="mx-auto rounded-lg border border-gray-100"
          style={{
            maxWidth: 640,
            width: "100%",
            height: "auto",
            aspectRatio: `${MUSCLE_DIAGRAM_IMAGE.width} / ${MUSCLE_DIAGRAM_IMAGE.height}`,
          }}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">骨部位 早見図</h2>
        <p className="mb-2 text-xs text-gray-500">
          全身の主要な骨の位置を示す参考図です。詳しい説明は下の「部位一覧」から確認できます。
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {BONE_DIAGRAM_IMAGES.map((diagram) => (
            <div key={diagram.id}>
              <p className="mb-1 text-center text-xs font-medium text-gray-500">
                {diagram.title}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={diagram.src}
                alt={diagram.alt}
                width={diagram.width}
                height={diagram.height}
                className="mx-auto rounded-lg border border-gray-100"
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: `${diagram.width} / ${diagram.height}`,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="部位名で検索(例: 大胸筋、ふくらはぎ、骨盤)"
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
        />

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
            下の一覧から部位を選ぶと、詳しい説明が表示されます。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">
          部位一覧(全{listSource.length}件)
        </h2>
        <div className="space-y-6">
          {groupedList.map(({ type, groups }) => (
            <div key={type}>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT_CLASS[type]}`}
                />
                {ANATOMY_TYPE_LABELS[type]}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <h4 className="mb-2 border-b-2 border-gray-200 pb-2 text-base font-semibold text-blue-700">
                      {group.category}
                    </h4>
                    <ul className="divide-y divide-dashed divide-gray-200">
                      {group.parts.map((part) => (
                        <li key={part.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(part)}
                            className={`flex w-full items-center justify-between gap-2 rounded px-1 py-2 text-left text-sm ${
                              part.id === selectedId
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`font-bold ${
                                part.id === selectedId
                                  ? "text-blue-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {part.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ANATOMY_VIEW_LABELS[part.view]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
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
          で表示し、上の部位一覧の見出しと同じ色分けにしています。
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
