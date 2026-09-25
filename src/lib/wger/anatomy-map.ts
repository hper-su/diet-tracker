// アプリの筋肉部位(src/lib/anatomy.ts の id)と、wgerの筋肉IDの対応。
// wgerの筋肉は15区分しかなく、アプリ側の詳細な部位(胸鎖乳突筋・棘下筋・
// 前腕の屈筋群など)に対応するものが無いため、対応が無い部位は空配列
// (=全身図でのハイライト非対応)にしている。無理に近い筋肉へ割り当てると
// 誤った部位を光らせてしまうため。

export const ANATOMY_TO_WGER_MUSCLE_IDS: Record<string, number[]> = {
  "pectoralis-major": [4],
  deltoid: [2], // wgerには三角筋前部のみ(中部・後部は無い)
  "biceps-brachii": [1],
  "rectus-abdominis": [6],
  obliques: [14],
  quadriceps: [10],
  "serratus-anterior": [3],
  trapezius: [9],
  "latissimus-dorsi": [12],
  "triceps-brachii": [5],
  "gluteus-maximus": [8],
  hamstrings: [11],
  calf: [7, 15], // 腓腹筋とヒラメ筋
};

// wgerの筋肉区分がアプリの部位より狭く、部位の一部しか光らないものの注記。
// 表示側で「選択中の筋肉」の全体が光っていると誤解されないよう添える。
const PARTIAL_HIGHLIGHT_NOTES: Record<string, string> = {
  deltoid: "wgerの図では、三角筋のうち前部だけを表示します(中部・後部は表示できません)。",
};

export function wgerHighlightNote(anatomyId: string): string | null {
  return PARTIAL_HIGHLIGHT_NOTES[anatomyId] ?? null;
}

export function wgerMuscleIdsForAnatomyPart(anatomyId: string): number[] {
  return ANATOMY_TO_WGER_MUSCLE_IDS[anatomyId] ?? [];
}
