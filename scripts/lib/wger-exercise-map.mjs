// 種目マスタ(日本語名)とwger(https://wger.de)の種目IDの対応表。
// scripts/build-wger-data.mjs(wgerからのデータ取り込み)と
// scripts/seed-exercise-wger-ids.mjs(種目マスタへのwgerId登録)の
// 唯一の情報源として使う。
//
// wgerに同じ動作の種目が無いもの・器具や動作を一意に決められないものは、
// 誤った画像や筋肉を表示しないよう、あえて登録していない
// (UNMAPPED_EXERCISE_NAMES)。後から種目マスタの編集画面で個別に選べる。
// 器具の違い(バーベル/ダンベル等)が不明なものは、名称が最も近い代表的な種目を
// 選んでいる(コメントの「推定」参照)。主働筋・補助筋はどちらでも大きく変わらない。

export const WGER_EXERCISE_MAP = new Map([
  ["ベンチプレス", 73], // Bench Press
  ["ナロープレス", 76], // Bench Press Narrow Grip
  ["ダンベルプレス", 75], // Benchpress Dumbbells
  ["ダンベルフライ", 238], // Fly With Dumbbells
  ["インクラインフライ", 308], // Incline Dumbbell Fly
  ["ショルダープレス", 567], // Shoulder Press, Dumbbells(推定: ダンベル)
  ["サイドレイズ", 348], // Lateral Raises
  ["ラットプルダウン", 723], // Wide-grip Pulldown
  ["ベントオーバー", 83], // Bent Over Rowing(推定: バーベル)
  ["ワンハンドロウ", 2642], // One-Arm Dumbbell Row
  ["アームカール", 1931], // Dumbbell Curl(推定: ダンベル)
  ["バーベルカール", 91], // Biceps Curls With Barbell
  ["インクラインカール", 204], // Dumbbell Incline Curl
  ["ケーブルカール", 1531], // Cable Curls
  ["ケーブルプレスダウン", 1185], // Triceps Pushdown
  ["プレスダウン", 1185], // Triceps Pushdown
  ["スクワット", 615], // Squats(推定: バーベル)
  ["ゴブレット", 203], // Dumbbell Goblet Squat(推定: ゴブレットスクワット)
  ["ボックススクワット", 977], // Box squat
  ["ブルガリアンスクワット", 988], // Bulgarian split squats left(左右で同じ動作)
  ["デットリフト", 184], // Deadlifts
  ["ルーマニアデットリフト", 507], // Romanian Deadlift
  ["スティフレッグドデットリフト", 627], // Stiff-legged Deadlifts
  ["レッグカール", 364], // Leg Curl
  ["ヒップスラスト", 294], // Hip Thrust
  ["ヒップリフト", 265], // Glute Bridge(推定: 同じ動作)
  ["ドンキーキック", 1616], // Dumbbell donkey kick
  ["アブダクション", 1748], // Machine Hip Abduction(推定: ヒップアブダクション)
  ["ヒップアブダクション", 1748], // Machine Hip Abduction
  ["バックエクステンション", 1348], // Lower Back Extensions
  ["クランチ", 167], // Crunches
  ["ボールクランチ", 165], // Ball crunches
  ["レッグレイズ", 377], // Leg Raises, Lying(推定: 仰向け)
  ["プランク", 458], // Plank
  ["デッドバグ", 178], // Deadbug
  ["デッドバック", 178], // Deadbug(デッドバグの表記ゆれ)
  ["バードドック", 1572], // Bird Dog
  ["クライマー", 996], // Mountain climbers
]);

// wgerに対応する種目が見つからない、または一意に決められなかったもの。
// 表示の確認用(build時に「未対応」として一覧する)。
export const UNMAPPED_EXERCISE_NAMES = [
  "インクラインヒップスラスト",
  "インクラインプレス", // バーベル/ダンベルが不明
  "カニ歩き",
  "キックバック", // 上腕三頭筋/大臀筋のどちらか不明
  "クライマークランチ",
  "クランチキープ",
  "サーキット",
  "シーテッド", // 何のシーテッド種目か不明
  "スパイダープランク",
  "ダンベルスイングスクワット",
  "ダンベルロウ", // 片手/両手が不明
  "ワンハンドプル", // 何のプル種目か不明
  "腹筋", // クランチ/シットアップ等のどれか不明
  "ツイスト",
  "ツイストクランチ",
  "ツイストプランク",
  "ニートゥチェスト",
  "バックプル",
  "バンドステップ",
  "フレンチプレス",
  "ワイド", // 何のワイド種目か不明
];

export function uniqueWgerIds() {
  return Array.from(new Set(WGER_EXERCISE_MAP.values())).sort((a, b) => a - b);
}
