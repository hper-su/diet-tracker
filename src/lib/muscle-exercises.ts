// 主要な筋トレ種目と、使用する主働筋・補助筋・骨/関節の対応表。
// 「筋肉・骨」ページの参考資料として、種目からの逆引き一覧と、
// 各筋肉・骨の詳細表示に「関連する種目」を出すためのデータ源として使う。

export type ExerciseCategory =
  | "上半身 - 押す系(プッシュ)"
  | "上半身 - 引く系(プル)"
  | "腕"
  | "下半身"
  | "体幹";

export const EXERCISE_CATEGORY_ORDER: ExerciseCategory[] = [
  "上半身 - 押す系(プッシュ)",
  "上半身 - 引く系(プル)",
  "腕",
  "下半身",
  "体幹",
];

export type MuscleExerciseRow = {
  exercise: string;
  primaryMuscles: string;
  secondaryMuscles: string; // 補助筋・安定筋。該当なしは "―"
  bonesJoints: string;
};

export const MUSCLE_EXERCISE_TABLE: Record<ExerciseCategory, MuscleExerciseRow[]> = {
  "上半身 - 押す系(プッシュ)": [
    {
      exercise: "ベンチプレス",
      primaryMuscles: "大胸筋",
      secondaryMuscles: "三角筋前部、上腕三頭筋、前鋸筋(安定)",
      bonesJoints: "上腕骨、肩甲骨、胸骨、肋骨、肩関節・肘関節",
    },
    {
      exercise: "ショルダープレス",
      primaryMuscles: "三角筋(前部・中部)",
      secondaryMuscles: "上腕三頭筋、僧帽筋上部、肩甲挙筋、前鋸筋(上方回旋)",
      bonesJoints: "上腕骨、肩甲骨、鎖骨、肩関節",
    },
    {
      exercise: "ディップス",
      primaryMuscles: "大胸筋下部、上腕三頭筋",
      secondaryMuscles: "三角筋前部、前鋸筋、肘筋",
      bonesJoints: "上腕骨、肩甲骨、肘関節",
    },
    {
      exercise: "プッシュアップ",
      primaryMuscles: "大胸筋",
      secondaryMuscles: "三角筋前部、上腕三頭筋、前鋸筋、腹直筋",
      bonesJoints: "上腕骨、肩甲骨、肩関節・肘関節",
    },
  ],
  "上半身 - 引く系(プル)": [
    {
      exercise: "懸垂(チンニング)",
      primaryMuscles: "広背筋",
      secondaryMuscles: "上腕二頭筋、僧帽筋、菱形筋、大円筋",
      bonesJoints: "上腕骨、肩甲骨、肩関節・肘関節",
    },
    {
      exercise: "ラットプルダウン",
      primaryMuscles: "広背筋",
      secondaryMuscles: "上腕二頭筋、大円筋、菱形筋",
      bonesJoints: "上腕骨、肩甲骨、肩関節",
    },
    {
      exercise: "ベントオーバーロウ",
      primaryMuscles: "広背筋、僧帽筋中部",
      secondaryMuscles: "菱形筋、上腕二頭筋、脊柱起立筋、腰方形筋(安定)",
      bonesJoints: "上腕骨、肩甲骨、脊柱、腰椎",
    },
    {
      exercise: "シーテッドロウ",
      primaryMuscles: "広背筋、僧帽筋中部",
      secondaryMuscles: "菱形筋、上腕二頭筋、大円筋",
      bonesJoints: "上腕骨、肩甲骨",
    },
    {
      exercise: "フェイスプル",
      primaryMuscles: "三角筋後部、僧帽筋中部",
      secondaryMuscles: "棘下筋、小円筋、菱形筋、肩甲挙筋",
      bonesJoints: "肩甲骨、肩関節",
    },
    {
      exercise: "シュラッグ",
      primaryMuscles: "僧帽筋上部",
      secondaryMuscles: "肩甲挙筋",
      bonesJoints: "鎖骨、肩甲骨",
    },
  ],
  腕: [
    {
      exercise: "バーベルカール",
      primaryMuscles: "上腕二頭筋",
      secondaryMuscles: "上腕筋、腕橈骨筋",
      bonesJoints: "上腕骨、橈骨、尺骨、肘関節",
    },
    {
      exercise: "トライセプスエクステンション",
      primaryMuscles: "上腕三頭筋",
      secondaryMuscles: "肘筋",
      bonesJoints: "上腕骨、尺骨、肘関節",
    },
    {
      exercise: "ハンマーカール",
      primaryMuscles: "上腕筋、腕橈骨筋",
      secondaryMuscles: "上腕二頭筋、回外筋",
      bonesJoints: "上腕骨、橈骨、尺骨",
    },
    {
      exercise: "リストカール",
      primaryMuscles: "橈側手根屈筋、尺側手根屈筋",
      secondaryMuscles: "長掌筋",
      bonesJoints: "橈骨、尺骨、手根骨",
    },
    {
      exercise: "リバースリストカール",
      primaryMuscles: "総指伸筋",
      secondaryMuscles: "―",
      bonesJoints: "橈骨、尺骨、手根骨",
    },
    {
      exercise: "プロネーション/スピネーション種目",
      primaryMuscles: "円回内筋、回外筋",
      secondaryMuscles: "方形回内筋",
      bonesJoints: "橈骨、尺骨",
    },
  ],
  下半身: [
    {
      exercise: "スクワット",
      primaryMuscles: "大腿四頭筋、大殿筋",
      secondaryMuscles: "ハムストリングス、内転筋群、脊柱起立筋、腰方形筋、深層外旋六筋(安定)",
      bonesJoints: "大腿骨、脛骨、寛骨、膝関節・股関節",
    },
    {
      exercise: "デッドリフト",
      primaryMuscles: "脊柱起立筋、大殿筋、ハムストリングス",
      secondaryMuscles: "広背筋、僧帽筋、前腕屈筋群、腰方形筋",
      bonesJoints: "脊柱、大腿骨、寛骨、股関節",
    },
    {
      exercise: "レッグプレス",
      primaryMuscles: "大腿四頭筋、大殿筋",
      secondaryMuscles: "ハムストリングス、内転筋群",
      bonesJoints: "大腿骨、脛骨、膝関節",
    },
    {
      exercise: "ランジ",
      primaryMuscles: "大腿四頭筋、大殿筋",
      secondaryMuscles: "ハムストリングス、中殿筋、大腿筋膜張筋(安定)",
      bonesJoints: "大腿骨、脛骨、寛骨、股関節・膝関節",
    },
    {
      exercise: "ルーマニアンデッドリフト",
      primaryMuscles: "ハムストリングス、大殿筋",
      secondaryMuscles: "脊柱起立筋、腰方形筋",
      bonesJoints: "大腿骨、寛骨、股関節",
    },
    {
      exercise: "レッグカール",
      primaryMuscles: "ハムストリングス",
      secondaryMuscles: "腓腹筋、膝窩筋",
      bonesJoints: "脛骨、大腿骨、膝関節",
    },
    {
      exercise: "レッグエクステンション",
      primaryMuscles: "大腿四頭筋",
      secondaryMuscles: "―",
      bonesJoints: "大腿骨、脛骨、膝関節",
    },
    {
      exercise: "カーフレイズ",
      primaryMuscles: "腓腹筋、ヒラメ筋",
      secondaryMuscles: "長腓骨筋・短腓骨筋、後脛骨筋",
      bonesJoints: "脛骨、腓骨、足根骨、足関節",
    },
    {
      exercise: "ヒップスラスト",
      primaryMuscles: "大殿筋",
      secondaryMuscles: "ハムストリングス、深層外旋六筋",
      bonesJoints: "寛骨、大腿骨、股関節",
    },
    {
      exercise: "ヒップアブダクション",
      primaryMuscles: "中殿筋、小殿筋",
      secondaryMuscles: "大腿筋膜張筋、梨状筋",
      bonesJoints: "寛骨、大腿骨、股関節",
    },
    {
      exercise: "ヒップアダクション",
      primaryMuscles: "内転筋群(長内転筋・大内転筋・薄筋)",
      secondaryMuscles: "恥骨筋",
      bonesJoints: "大腿骨、寛骨",
    },
  ],
  体幹: [
    {
      exercise: "クランチ",
      primaryMuscles: "腹直筋",
      secondaryMuscles: "腹斜筋",
      bonesJoints: "脊柱、肋骨",
    },
    {
      exercise: "プランク",
      primaryMuscles: "腹直筋、腹横筋",
      secondaryMuscles: "脊柱起立筋、大殿筋、骨盤底筋群、横隔膜(ブレーシング)",
      bonesJoints: "脊柱、肋骨、寛骨",
    },
    {
      exercise: "ロシアンツイスト",
      primaryMuscles: "腹斜筋(外・内)",
      secondaryMuscles: "腹直筋",
      bonesJoints: "脊柱",
    },
    {
      exercise: "デッドバグ",
      primaryMuscles: "腹横筋、腹直筋",
      secondaryMuscles: "腸腰筋、骨盤底筋群",
      bonesJoints: "脊柱、肋骨",
    },
    {
      exercise: "サイドプランク",
      primaryMuscles: "腹斜筋",
      secondaryMuscles: "腰方形筋、中殿筋",
      bonesJoints: "脊柱、寛骨",
    },
    {
      exercise: "バードドッグ",
      primaryMuscles: "脊柱起立筋、多裂筋",
      secondaryMuscles: "大殿筋、腹横筋",
      bonesJoints: "脊柱、寛骨、肩甲骨",
    },
  ],
};

// 対応表の下に添える補足説明。
export const MUSCLE_EXERCISE_NOTES: string[] = [
  "「補助筋・安定筋」欄に入れた筋(前鋸筋、腰方形筋、深層外旋六筋、骨盤底筋群など)は、直接的に大きな力を発揮するというより関節を正しい位置に保つ・代償動作を防ぐ役割が中心です。初心者の柔軟性・モーターコントロール問題とも直結する部分です。",
  "前鋸筋はプッシュ系種目全般とオーバーヘッド動作で「肩甲骨の上方回旋・胸郭への固定」という重要な役割を持つため、複数種目に登場しています。",
  "ベンチプレスの烏口腕筋、デッドリフトの頭板状筋は、貢献度が小さい・裏付けとなる資料が限定的なため削除しています。",
];

// 「筋肉・骨」ページの部位名(react-body-highlighter/骨格図側の表記)と、
// この対応表側の表記が完全一致しない箇所を補う同義語。
const MUSCLE_NAME_ALIASES: Record<string, string[]> = {
  骨盤: ["寛骨"],
  下腿三頭筋: ["腓腹筋", "ヒラメ筋"],
};

function stripParenthetical(name: string): string {
  return name.replace(/[(（][^)）]*[)）]/g, "").trim();
}

function nameTokens(name: string): string[] {
  const base = stripParenthetical(name);
  const tokens = base
    .split("・")
    .map((t) => t.trim())
    .filter(Boolean);
  const aliases = MUSCLE_NAME_ALIASES[base] ?? [];
  return [...tokens, ...aliases];
}

function fieldTokens(field: string): string[] {
  return field
    .split("、")
    .map((t) => t.trim())
    .filter(Boolean);
}

function includesToken(field: string, tokens: string[]): boolean {
  const parts = fieldTokens(field);
  return tokens.some((token) => parts.some((part) => part.includes(token)));
}

export type RelatedExercise = {
  exercise: string;
  category: ExerciseCategory;
  role: "primary" | "secondary";
};

// 筋肉の部位名から、その筋肉を主働筋/補助筋として使う種目を検索する。
export function findRelatedExercisesForMuscle(
  muscleName: string,
): RelatedExercise[] {
  const tokens = nameTokens(muscleName);
  if (tokens.length === 0) return [];
  const results: RelatedExercise[] = [];

  for (const category of EXERCISE_CATEGORY_ORDER) {
    for (const row of MUSCLE_EXERCISE_TABLE[category]) {
      if (includesToken(row.primaryMuscles, tokens)) {
        results.push({ exercise: row.exercise, category, role: "primary" });
      } else if (
        row.secondaryMuscles !== "―" &&
        includesToken(row.secondaryMuscles, tokens)
      ) {
        results.push({ exercise: row.exercise, category, role: "secondary" });
      }
    }
  }
  return results;
}

// 骨の部位名から、その骨・関節を使う種目を検索する。
export function findRelatedExercisesForBone(boneName: string): {
  exercise: string;
  category: ExerciseCategory;
}[] {
  const tokens = nameTokens(boneName);
  if (tokens.length === 0) return [];
  const results: { exercise: string; category: ExerciseCategory }[] = [];

  for (const category of EXERCISE_CATEGORY_ORDER) {
    for (const row of MUSCLE_EXERCISE_TABLE[category]) {
      if (includesToken(row.bonesJoints, tokens)) {
        results.push({ exercise: row.exercise, category });
      }
    }
  }
  return results;
}
