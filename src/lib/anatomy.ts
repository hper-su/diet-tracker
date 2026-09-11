// 全身の主要な筋肉・骨の早見データ。
// お客様への運動指導・体の部位説明の際に、リアルな全身図と検索で
// 該当する筋肉/骨をすぐに確認できるようにするための参考情報。
// 掲載範囲は代表的な主要部位に絞っており、解剖学の全項目を網羅するものではない。
//
// 筋肉は react-body-highlighter (MIT) が持つ前面/背面の筋肉マップ形状を
// そのまま使い、検索でヒットした筋肉をその輪郭ごと塗りつぶしてハイライトする。
// 骨は public/anatomy/skeleton-front.svg・skeleton-back.svg
// (Mariana Ruiz Villarreal氏 / LadyofHats によるパブリックドメインの人体骨格図、
// Wikimedia Commons: Human_skeleton_front_en.svg / Human_skeleton_back_en.svg
// から英語ラベル・引き出し線を除去したもの)を背景画像として使い、
// その上に座標を指定して検索用のマーカーを重ねる。

export type AnatomyType = "muscle" | "bone";
export type AnatomyView = "front" | "back";
export type AnatomyCategory = "上半身" | "体幹" | "下半身" | "頭部";

// react-body-highlighter の Muscle キー(ライブラリ側の型定義を独自に複製。
// 依存パッケージの内部エクスポートに直接頼らないための最小限のコピー)。
export type MuscleKey =
  | "trapezius"
  | "upper-back"
  | "lower-back"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearm"
  | "back-deltoids"
  | "front-deltoids"
  | "abs"
  | "obliques"
  | "adductor"
  | "abductors"
  | "hamstring"
  | "quadriceps"
  | "calves"
  | "gluteal"
  | "head"
  | "neck"
  | "knees"
  | "left-soleus"
  | "right-soleus";

type AnatomyPartBase = {
  id: string;
  name: string;
  reading: string; // ふりがな(検索用)
  category: AnatomyCategory;
  view: AnatomyView; // 全身図(前面/背面)のどちらに表示するか
  description: string;
  note?: string; // 指導時に使える一言メモ(鍛え方・役割など)
};

export type MuscleAnatomyPart = AnatomyPartBase & {
  type: "muscle";
  muscleKey: MuscleKey;
  // react-body-highlighterのモデルが使うviewBox("0 0 100 200")上の座標。
  // 同じ輪郭(muscleKey)を間借りしている筋肉同士でも、マーカーの位置を
  // ずらすことで個別に検索・選択できるようにするためのもの。
  x: number;
  y: number;
};

export type BoneAnatomyPart = AnatomyPartBase & {
  type: "bone";
  // public/anatomy/skeleton-*.svg のviewBox("0 0 435.687 841.89")上の座標。
  x: number;
  y: number;
};

export type AnatomyPart = MuscleAnatomyPart | BoneAnatomyPart;

// react-body-highlighter (Model) が内部で使っているSVGのviewBox。
// 筋肉マーカーをModelの上に正確に重ねるため、この座標系に合わせる。
export const MUSCLE_MODEL_VIEW_BOX = "0 0 100 200";

// 骨の背景画像(前面/背面共通)のviewBox。
export const BONE_IMAGE_VIEW_BOX = "0 0 435.687 841.89";
export const BONE_IMAGE_SRC: Record<AnatomyView, string> = {
  front: "/anatomy/skeleton-front.svg",
  back: "/anatomy/skeleton-back.svg",
};

export const ANATOMY_CATEGORY_ORDER: AnatomyCategory[] = [
  "頭部",
  "上半身",
  "体幹",
  "下半身",
];

export const ANATOMY_TYPE_LABELS: Record<AnatomyType, string> = {
  muscle: "筋肉",
  bone: "骨",
};

export const ANATOMY_VIEW_LABELS: Record<AnatomyView, string> = {
  front: "前面",
  back: "背面",
};

export const ANATOMY_PARTS: AnatomyPart[] = [
  // ------------------------------ 筋肉(前面) ------------------------------
  {
    id: "pectoralis-major",
    type: "muscle",
    muscleKey: "chest",
    x: 60.2,
    y: 49.9,
    name: "大胸筋",
    reading: "だいきょうきん",
    category: "上半身",
    view: "front",
    description: "胸の前面を覆う大きな筋肉。腕を前方や内側に押し出す動作で働く。",
    note: "ベンチプレス、腕立て伏せで鍛えられる。",
  },
  {
    id: "deltoid",
    type: "muscle",
    muscleKey: "front-deltoids",
    x: 75.4,
    y: 43.8,
    name: "三角筋",
    reading: "さんかくきん",
    category: "上半身",
    view: "front",
    description: "肩関節を覆う筋肉。腕を前後左右に持ち上げる動作全般に関わる。",
    note: "ショルダープレス、サイドレイズで鍛えられる。",
  },
  {
    id: "biceps-brachii",
    type: "muscle",
    muscleKey: "biceps",
    x: 76.9,
    y: 61.1,
    name: "上腕二頭筋",
    reading: "じょうわんにとうきん",
    category: "上半身",
    view: "front",
    description: "二の腕前側のいわゆる「力こぶ」。肘を曲げる動作で働く。",
    note: "アームカール(ダンベルカール)で鍛えられる。",
  },
  {
    id: "forearm-flexors",
    type: "muscle",
    muscleKey: "forearm",
    x: 89.5,
    y: 83,
    name: "前腕屈筋群",
    reading: "ぜんわんくっきんぐん",
    category: "上半身",
    view: "front",
    description: "前腕内側の筋肉群。手首や指を握る・曲げる動作で働く。",
    note: "リストカール、握力トレーニングで鍛えられる。",
  },
  {
    id: "rectus-abdominis",
    type: "muscle",
    muscleKey: "abs",
    x: 54.7,
    y: 81.2,
    name: "腹直筋",
    reading: "ふくちょくきん",
    category: "体幹",
    view: "front",
    description: "お腹の前面を縦に走る筋肉。いわゆる「腹筋・シックスパック」の部分。",
    note: "クランチ、レッグレイズで鍛えられる。",
  },
  {
    id: "obliques",
    type: "muscle",
    muscleKey: "obliques",
    x: 63.9,
    y: 68,
    name: "腹斜筋",
    reading: "ふくしゃきん",
    category: "体幹",
    view: "front",
    description: "脇腹にあり、体幹を横に倒す・ひねる動作で働く筋肉。",
    note: "ロシアンツイスト、サイドプランクで鍛えられる。",
  },
  {
    id: "quadriceps",
    type: "muscle",
    muscleKey: "quadriceps",
    x: 66,
    y: 113.8,
    name: "大腿四頭筋",
    reading: "だいたいしとうきん",
    category: "下半身",
    view: "front",
    description: "太もも前側の筋肉群。膝を伸ばす動作で強く働く、体の中でも大きな筋肉。",
    note: "スクワット、レッグエクステンションで鍛えられる。",
  },
  {
    id: "adductors",
    type: "muscle",
    // ライブラリ側のキー名は "abductors" だが、実際の形状は前面から見た
    // 太もも内側(内転筋群)の位置に描かれているため、表示上はこちらを採用。
    muscleKey: "abductors",
    x: 58.7,
    y: 105.3,
    name: "内転筋群",
    reading: "ないてんきんぐん",
    category: "下半身",
    view: "front",
    description: "太もも内側の筋肉群。脚を内側に閉じる動作で働く。",
    note: "ワイドスクワット、サイドランジで鍛えられる。",
  },
  {
    id: "tibialis-anterior",
    type: "muscle",
    muscleKey: "calves",
    x: 76.3,
    y: 174.5,
    name: "前脛骨筋",
    reading: "ぜんけいこつきん",
    category: "下半身",
    view: "front",
    description: "すねの前面の筋肉。つま先を持ち上げる動作(足関節の背屈)で働く。",
    note: "つま先上げ運動で鍛えられる。歩行時の躓き防止にも関わる。",
  },

  // 以下、種目別対応表には載っているが図に専用の輪郭が無い筋肉。
  // 一番近い部位の輪郭を間借りして表示する(検索・選択すると、間借り元と
  // 同じ範囲がハイライトされる)。
  {
    id: "serratus-anterior",
    type: "muscle",
    muscleKey: "chest",
    x: 64,
    y: 58,
    name: "前鋸筋",
    reading: "ぜんきょきん",
    category: "上半身",
    view: "front",
    description:
      "肋骨の側面から肩甲骨にかけて広がる筋肉。肩甲骨を胸郭に固定し、上方に回旋させる働きがある。",
    note: "ベンチプレスやプッシュアップなどのプッシュ系種目全般で安定筋として働く。図では大胸筋と同じ範囲がハイライトされる(専用の輪郭なし)。",
  },
  {
    id: "pronator-teres",
    type: "muscle",
    muscleKey: "forearm",
    x: 85,
    y: 75,
    name: "円回内筋",
    reading: "えんかいないきん",
    category: "上半身",
    view: "front",
    description: "前腕前面にある筋肉。手のひらを下に向ける動作(回内)で働く。",
    note: "プロネーション種目で鍛えられる。図では前腕屈筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "pronator-quadratus",
    type: "muscle",
    muscleKey: "forearm",
    x: 97,
    y: 96,
    name: "方形回内筋",
    reading: "ほうけいかいないきん",
    category: "上半身",
    view: "front",
    description: "手首に近い前腕の深層にある筋肉。円回内筋を補助して回内動作を行う。",
    note: "図では前腕屈筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "flexor-carpi-radialis",
    type: "muscle",
    muscleKey: "forearm",
    x: 88,
    y: 80,
    name: "橈側手根屈筋",
    reading: "とうそくしゅこんくっきん",
    category: "上半身",
    view: "front",
    description: "前腕親指側にある筋肉。手首を手のひら側・親指側に曲げる動作で働く。",
    note: "リストカールで鍛えられる。図では前腕屈筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "flexor-carpi-ulnaris",
    type: "muscle",
    muscleKey: "forearm",
    x: 94,
    y: 90,
    name: "尺側手根屈筋",
    reading: "しゃくそくしゅこんくっきん",
    category: "上半身",
    view: "front",
    description: "前腕小指側にある筋肉。手首を手のひら側・小指側に曲げる動作で働く。",
    note: "リストカールで鍛えられる。図では前腕屈筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "palmaris-longus",
    type: "muscle",
    muscleKey: "forearm",
    x: 91,
    y: 85,
    name: "長掌筋",
    reading: "ちょうしょうきん",
    category: "上半身",
    view: "front",
    description: "前腕中央にある細長い筋肉(約1割の人には存在しない)。手首を曲げる動作を補助する。",
    note: "リストカールの補助筋として働く。図では前腕屈筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "pectineus",
    type: "muscle",
    muscleKey: "abductors",
    x: 61,
    y: 96,
    name: "恥骨筋",
    reading: "ちこつきん",
    category: "下半身",
    view: "front",
    description: "太もも付け根の内側にある筋肉。股関節を内側に閉じる・曲げる動作で働く。",
    note: "ヒップアダクション(内転)種目で鍛えられる。図では内転筋群と同じ範囲がハイライトされる。",
  },

  // ------------------------------ 筋肉(背面) ------------------------------
  {
    id: "trapezius",
    type: "muscle",
    muscleKey: "trapezius",
    x: 58.5,
    y: 37.4,
    name: "僧帽筋",
    reading: "そうぼうきん",
    category: "上半身",
    view: "back",
    description: "首の付け根から肩・背中上部に広がる筋肉。肩甲骨を動かす動作で働く。",
    note: "シュラッグ、ローイング系種目で鍛えられる。",
  },
  {
    id: "latissimus-dorsi",
    type: "muscle",
    muscleKey: "upper-back",
    x: 64.2,
    y: 56.6,
    name: "広背筋",
    reading: "こうはいきん",
    category: "上半身",
    view: "back",
    description: "背中を広く覆う筋肉。腕を後方や下方に引く動作(懸垂など)で働く。",
    note: "懸垂(チンニング)、ラットプルダウンで鍛えられる。",
  },
  {
    id: "erector-spinae",
    type: "muscle",
    muscleKey: "lower-back",
    x: 57.3,
    y: 83.8,
    name: "脊柱起立筋",
    reading: "せきちゅうきりつきん",
    category: "体幹",
    view: "back",
    description: "背骨に沿って縦に走る筋肉群。姿勢を保ち、体を反らす動作で働く。",
    note: "デッドリフト、バックエクステンションで鍛えられる。",
  },
  {
    id: "triceps-brachii",
    type: "muscle",
    muscleKey: "triceps",
    x: 79.4,
    y: 63.3,
    name: "上腕三頭筋",
    reading: "じょうわんさんとうきん",
    category: "上半身",
    view: "back",
    description: "二の腕後ろ側の筋肉。肘を伸ばす動作で働く。二の腕のたるみに関わる部位。",
    note: "プッシュダウン、ディップスで鍛えられる。",
  },
  {
    id: "forearm-extensors",
    type: "muscle",
    muscleKey: "forearm",
    x: 91.3,
    y: 91,
    name: "前腕伸筋群",
    reading: "ぜんわんしんきんぐん",
    category: "上半身",
    view: "back",
    description: "前腕外側の筋肉群。手首や指を伸ばす動作で働く。",
    note: "リバースリストカールで鍛えられる。",
  },
  {
    id: "gluteus-maximus",
    type: "muscle",
    muscleKey: "gluteal",
    x: 61,
    y: 114.7,
    name: "大殿筋",
    reading: "だいでんきん",
    category: "下半身",
    view: "back",
    description: "お尻の筋肉。股関節を伸ばす動作で働く、体の中でも特に大きい筋肉。",
    note: "ヒップスラスト、スクワットで鍛えられる。",
  },
  {
    id: "hamstrings",
    type: "muscle",
    muscleKey: "hamstring",
    x: 69.5,
    y: 138.2,
    name: "ハムストリングス",
    reading: "はむすとりんぐす",
    category: "下半身",
    view: "back",
    description: "太もも裏側の筋肉群。膝を曲げる・股関節を伸ばす動作で働く。",
    note: "レッグカール、デッドリフトで鍛えられる。",
  },
  {
    id: "calf",
    type: "muscle",
    muscleKey: "calves",
    x: 65.5,
    y: 180.8,
    name: "下腿三頭筋(ふくらはぎ)",
    reading: "かたいさんとうきん",
    category: "下半身",
    view: "back",
    description: "ふくらはぎの筋肉(腓腹筋・ヒラメ筋)。つま先立ちの動作で働く。",
    note: "カーフレイズで鍛えられる。",
  },

  // 以下、種目別対応表には載っているが図に専用の輪郭が無い筋肉(背面)。
  // 一番近い部位の輪郭を間借りして表示する。
  {
    id: "levator-scapulae",
    type: "muscle",
    muscleKey: "trapezius",
    x: 54,
    y: 24,
    name: "肩甲挙筋",
    reading: "けんこうきょきん",
    category: "上半身",
    view: "back",
    description: "首の側面から肩甲骨上部にかけての筋肉。肩甲骨を引き上げる動作で働く。",
    note: "シュラッグ、ショルダープレスで働く。図では僧帽筋と同じ範囲がハイライトされる。",
  },
  {
    id: "teres-major",
    type: "muscle",
    muscleKey: "upper-back",
    x: 68,
    y: 42,
    name: "大円筋",
    reading: "だいえんきん",
    category: "上半身",
    view: "back",
    description: "脇の下、広背筋の上部にある筋肉。腕を後方や下方に引く動作で広背筋を補助する。",
    note: "懸垂、ラットプルダウン、シーテッドロウで働く。図では広背筋と同じ範囲がハイライトされる。",
  },
  {
    id: "infraspinatus",
    type: "muscle",
    muscleKey: "upper-back",
    x: 63,
    y: 45,
    name: "棘下筋",
    reading: "きょくかきん",
    category: "上半身",
    view: "back",
    description: "肩甲骨の後面にあるローテーターカフ(回旋筋腱板)の一つ。腕を外側にひねる動作で働く。",
    note: "フェイスプルで働く、肩の安定に関わる筋肉。図では広背筋と同じ範囲がハイライトされる。",
  },
  {
    id: "teres-minor",
    type: "muscle",
    muscleKey: "upper-back",
    x: 67,
    y: 48,
    name: "小円筋",
    reading: "しょうえんきん",
    category: "上半身",
    view: "back",
    description: "棘下筋のすぐ下にあるローテーターカフの一つ。腕を外側にひねる動作で働く。",
    note: "フェイスプルで働く。図では広背筋と同じ範囲がハイライトされる。",
  },
  {
    id: "rhomboids",
    type: "muscle",
    muscleKey: "trapezius",
    x: 50,
    y: 45,
    name: "菱形筋",
    reading: "りょうけいきん",
    category: "上半身",
    view: "back",
    description: "左右の肩甲骨の間にある筋肉。肩甲骨を背骨側に引き寄せる動作で働く。",
    note: "懸垂、ロウ系種目、フェイスプルで働く。図では僧帽筋と同じ範囲がハイライトされる。",
  },
  {
    id: "quadratus-lumborum",
    type: "muscle",
    muscleKey: "lower-back",
    x: 62,
    y: 78,
    name: "腰方形筋",
    reading: "ようほうけいきん",
    category: "体幹",
    view: "back",
    description: "腰の深層にある筋肉。骨盤と肋骨をつなぎ、体幹を横に倒す・安定させる動作で働く。",
    note: "スクワット、デッドリフト、サイドプランクで安定筋として働く。図では脊柱起立筋と同じ範囲がハイライトされる。",
  },
  {
    id: "multifidus",
    type: "muscle",
    muscleKey: "lower-back",
    x: 54,
    y: 80,
    name: "多裂筋",
    reading: "たれつきん",
    category: "体幹",
    view: "back",
    description: "背骨に沿って走る深層の小さな筋肉群。背骨1つ1つを安定させる動作で働く。",
    note: "バードドッグで鍛えられる。図では脊柱起立筋と同じ範囲がハイライトされる。",
  },
  {
    id: "anconeus",
    type: "muscle",
    muscleKey: "triceps",
    x: 81,
    y: 75,
    name: "肘筋",
    reading: "ちゅうきん",
    category: "上半身",
    view: "back",
    description: "肘の外側にある小さな筋肉。上腕三頭筋を補助して肘を伸ばす動作で働く。",
    note: "ディップス、トライセプスエクステンションで働く。図では上腕三頭筋と同じ範囲がハイライトされる。",
  },
  {
    id: "supinator",
    type: "muscle",
    muscleKey: "forearm",
    x: 87,
    y: 79,
    name: "回外筋",
    reading: "かいがいきん",
    category: "上半身",
    view: "back",
    description: "肘の近くにある前腕の筋肉。手のひらを上に向ける動作(回外)で働く。",
    note: "ハンマーカールやスピネーション種目で働く。図では前腕伸筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "extensor-digitorum",
    type: "muscle",
    muscleKey: "forearm",
    x: 93,
    y: 88,
    name: "総指伸筋",
    reading: "そうししんきん",
    category: "上半身",
    view: "back",
    description: "前腕背面にある筋肉。指を伸ばす・手首を甲側に反らす動作で働く。",
    note: "リバースリストカールで鍛えられる。図では前腕伸筋群と同じ範囲がハイライトされる。",
  },
  {
    id: "deep-hip-rotators",
    type: "muscle",
    muscleKey: "gluteal",
    x: 60,
    y: 116,
    name: "深層外旋六筋",
    reading: "しんそうがいせんろっきん",
    category: "下半身",
    view: "back",
    description:
      "股関節の奥にある6つの小さな筋肉群(梨状筋など)。脚を外側にひねる動作と股関節の安定に働く。",
    note: "スクワット、ヒップスラストで安定筋として働く。図では大殿筋と同じ範囲がハイライトされる。",
  },
  {
    id: "gluteus-medius",
    type: "muscle",
    muscleKey: "gluteal",
    x: 67,
    y: 104,
    name: "中殿筋",
    reading: "ちゅうでんきん",
    category: "下半身",
    view: "back",
    description: "お尻の外側上部にある筋肉。脚を外側に開く動作と、片脚立ちの骨盤安定に働く。",
    note: "ヒップアブダクション、ランジで働く。図では大殿筋と同じ範囲がハイライトされる。",
  },
  {
    id: "gluteus-minimus",
    type: "muscle",
    muscleKey: "gluteal",
    x: 69,
    y: 108,
    name: "小殿筋",
    reading: "しょうでんきん",
    category: "下半身",
    view: "back",
    description: "中殿筋の深層にある筋肉。中殿筋とともに脚を外側に開く動作で働く。",
    note: "ヒップアブダクションで働く。図では大殿筋と同じ範囲がハイライトされる。",
  },
  {
    id: "tensor-fasciae-latae",
    type: "muscle",
    muscleKey: "gluteal",
    x: 70,
    y: 100,
    name: "大腿筋膜張筋",
    reading: "だいたいきんまくちょうきん",
    category: "下半身",
    view: "back",
    description: "骨盤の外側から太もも外側に伸びる筋肉。脚を外側に開く・前に振り出す動作で働く。",
    note: "ランジ、ヒップアブダクションで働く。図では大殿筋と同じ範囲がハイライトされる。",
  },
  {
    id: "piriformis",
    type: "muscle",
    muscleKey: "gluteal",
    x: 58,
    y: 112,
    name: "梨状筋",
    reading: "りじょうきん",
    category: "下半身",
    view: "back",
    description: "深層外旋六筋の一つ。お尻の奥で脚を外側にひねる動作と股関節の安定に働く。",
    note: "ヒップアブダクションで働く。図では大殿筋と同じ範囲がハイライトされる。",
  },
  {
    id: "popliteus",
    type: "muscle",
    muscleKey: "hamstring",
    x: 67,
    y: 160,
    name: "膝窩筋",
    reading: "しつかきん",
    category: "下半身",
    view: "back",
    description: "膝の裏にある小さな筋肉。膝を曲げる際にすねをわずかに内側にひねる動作で働く。",
    note: "レッグカールで働く。図ではハムストリングスと同じ範囲がハイライトされる。",
  },
  {
    id: "peroneus-longus-brevis",
    type: "muscle",
    muscleKey: "calves",
    x: 69,
    y: 185,
    name: "長腓骨筋・短腓骨筋",
    reading: "ちょうひこつきん・たんひこつきん",
    category: "下半身",
    view: "back",
    description: "すね外側にある筋肉。足首を外側に返す動作と、足のアーチを支える働きがある。",
    note: "カーフレイズの補助筋として働く。図では下腿三頭筋と同じ範囲がハイライトされる。",
  },
  {
    id: "tibialis-posterior",
    type: "muscle",
    muscleKey: "calves",
    x: 63,
    y: 190,
    name: "後脛骨筋",
    reading: "こうけいこつきん",
    category: "下半身",
    view: "back",
    description: "すね深層にある筋肉。足首を内側に返す動作と、足の内側アーチを支える働きがある。",
    note: "カーフレイズの補助筋として働く。図では下腿三頭筋と同じ範囲がハイライトされる。",
  },

  // ------------------------------ 骨(前面) ------------------------------
  {
    id: "skull",
    type: "bone",
    name: "頭蓋骨",
    reading: "ずがいこつ",
    category: "頭部",
    view: "front",
    x: 226,
    y: 55,
    description: "脳を保護する骨。複数の骨が組み合わさって構成されている。",
  },
  {
    id: "clavicle",
    type: "bone",
    name: "鎖骨",
    reading: "さこつ",
    category: "上半身",
    view: "front",
    x: 288,
    y: 175,
    description: "胸の上部で肩と胸骨をつなぐ骨。体表から触れやすい部位。",
  },
  {
    id: "sternum",
    type: "bone",
    name: "胸骨",
    reading: "きょうこつ",
    category: "体幹",
    view: "front",
    x: 224,
    y: 233,
    description: "胸の中央にある縦長の骨。左右の肋骨と連結している。",
  },
  {
    id: "ribs",
    type: "bone",
    name: "肋骨",
    reading: "ろっこつ",
    category: "体幹",
    view: "front",
    x: 263,
    y: 245,
    description: "胸部を囲むかご状の骨(通常左右12対)。心臓や肺を保護する。",
  },
  {
    id: "humerus",
    type: "bone",
    name: "上腕骨",
    reading: "じょうわんこつ",
    category: "上半身",
    view: "front",
    x: 310,
    y: 259,
    description: "肩から肘までの腕の骨。人体の腕の骨の中で最も太く長い。",
  },
  {
    id: "radius-ulna",
    type: "bone",
    name: "橈骨・尺骨",
    reading: "とうこつ・しゃっこつ",
    category: "上半身",
    view: "front",
    x: 329,
    y: 314,
    description: "肘から手首までの前腕にある2本の骨。手首を捻る動作に関わる。",
  },
  {
    id: "pelvis",
    type: "bone",
    name: "骨盤",
    reading: "こつばん",
    category: "体幹",
    view: "front",
    x: 224,
    y: 398,
    description: "上半身を支え、内臓を保護する骨。背骨と大腿骨をつなぐ土台。",
  },
  {
    id: "femur",
    type: "bone",
    name: "大腿骨",
    reading: "だいたいこつ",
    category: "下半身",
    view: "front",
    x: 241,
    y: 547,
    description: "太ももの骨。人体で最も大きく長く、強度の高い骨。",
  },
  {
    id: "patella",
    type: "bone",
    name: "膝蓋骨",
    reading: "しつがいこつ",
    category: "下半身",
    view: "front",
    x: 244,
    y: 639,
    description: "膝のお皿の部分。膝関節を保護し、大腿四頭筋の力を効率よく伝える。",
  },
  {
    id: "tibia-fibula",
    type: "bone",
    name: "脛骨・腓骨",
    reading: "けいこつ・ひこつ",
    category: "下半身",
    view: "front",
    x: 236,
    y: 706,
    description: "膝から足首までのすねにある2本の骨。体重を支える主要な骨。",
  },

  // ------------------------------ 骨(背面) ------------------------------
  {
    id: "scapula",
    type: "bone",
    name: "肩甲骨",
    reading: "けんこうこつ",
    category: "上半身",
    view: "back",
    x: 230,
    y: 165,
    description: "背中上部にある三角形の骨。腕の土台となり、可動域が大きい。",
  },
  {
    id: "spine",
    type: "bone",
    name: "脊柱(背骨)",
    reading: "せきちゅう",
    category: "体幹",
    view: "back",
    x: 204,
    y: 280,
    description: "頭から骨盤まで連なる骨。体を支え、脊髄を保護する。",
  },
  {
    id: "calcaneus",
    type: "bone",
    name: "踵骨(かかとの骨)",
    reading: "しょうこつ",
    category: "下半身",
    view: "back",
    x: 240,
    y: 620,
    description: "足首の下、かかとを構成する骨。人体の足の骨の中で最も大きい。",
  },
];

export function searchAnatomyParts(
  parts: AnatomyPart[],
  query: string,
): AnatomyPart[] {
  const q = query.trim().toLowerCase();
  if (!q) return parts;
  return parts.filter(
    (part) =>
      part.name.toLowerCase().includes(q) ||
      part.reading.toLowerCase().includes(q) ||
      part.category.toLowerCase().includes(q) ||
      part.description.toLowerCase().includes(q),
  );
}
