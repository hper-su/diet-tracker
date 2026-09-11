// 全身の主要な筋肉・骨の早見データ。
// お客様への運動指導・体の部位説明の際に、検索とテキスト一覧で
// 該当する筋肉/骨をすぐに確認できるようにするための参考情報。
//
// 全身図イラスト(public/anatomy/配下)は参考画像として静的に表示するのみで、
// 部位ごとのクリック連動・色ハイライトは行っていない(色検出による自動判定は
// 精度が不十分だったため廃止した)。

export type AnatomyType = "muscle" | "bone";
export type AnatomyView = "front" | "back";
export type AnatomyCategory = "上半身" | "背部" | "下半身";

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
};

export type BoneAnatomyPart = AnatomyPartBase & {
  type: "bone";
};

export type AnatomyPart = MuscleAnatomyPart | BoneAnatomyPart;

export const ANATOMY_CATEGORY_ORDER: AnatomyCategory[] = [
  "上半身",
  "背部",
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
    id: "sternocleidomastoid",
    type: "muscle",
    name: "胸鎖乳突筋",
    reading: "きょうさにゅうとつきん",
    category: "上半身",
    view: "front",
    description: "首の左右にあるV字型の筋肉。頭を回す・前に倒す動作で働く。",
    note: "首を横に倒す・回旋させるストレッチや種目で使われる。",
  },
  {
    id: "pectoralis-major",
    type: "muscle",
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
    name: "腹直筋",
    reading: "ふくちょくきん",
    category: "上半身",
    view: "front",
    description: "お腹の前面を縦に走る筋肉。いわゆる「腹筋・シックスパック」の部分。",
    note: "クランチ、レッグレイズで鍛えられる。",
  },
  {
    id: "obliques",
    type: "muscle",
    name: "腹斜筋",
    reading: "ふくしゃきん",
    category: "上半身",
    view: "front",
    description: "脇腹にあり、体幹を横に倒す・ひねる動作で働く筋肉。",
    note: "ロシアンツイスト、サイドプランクで鍛えられる。",
  },
  {
    id: "quadriceps",
    type: "muscle",
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
    name: "前脛骨筋",
    reading: "ぜんけいこつきん",
    category: "下半身",
    view: "front",
    description: "すねの前面の筋肉。つま先を持ち上げる動作(足関節の背屈)で働く。",
    note: "つま先上げ運動で鍛えられる。歩行時の躓き防止にも関わる。",
  },
  {
    id: "serratus-anterior",
    type: "muscle",
    name: "前鋸筋",
    reading: "ぜんきょきん",
    category: "上半身",
    view: "front",
    description:
      "肋骨の側面から肩甲骨にかけて広がる筋肉。肩甲骨を胸郭に固定し、上方に回旋させる働きがある。",
    note: "ベンチプレスやプッシュアップなどのプッシュ系種目全般で安定筋として働く。",
  },

  // ------------------------------ 筋肉(背面) ------------------------------
  {
    id: "trapezius",
    type: "muscle",
    name: "僧帽筋",
    reading: "そうぼうきん",
    category: "背部",
    view: "back",
    description: "首の付け根から肩・背中上部に広がる筋肉。肩甲骨を動かす動作で働く。",
    note: "シュラッグ、ローイング系種目で鍛えられる。",
  },
  {
    id: "latissimus-dorsi",
    type: "muscle",
    name: "広背筋",
    reading: "こうはいきん",
    category: "背部",
    view: "back",
    description: "背中を広く覆う筋肉。腕を後方や下方に引く動作(懸垂など)で働く。",
    note: "懸垂(チンニング)、ラットプルダウンで鍛えられる。",
  },
  {
    id: "erector-spinae",
    type: "muscle",
    name: "脊柱起立筋",
    reading: "せきちゅうきりつきん",
    category: "背部",
    view: "back",
    description: "背骨に沿って縦に走る筋肉群。姿勢を保ち、体を反らす動作で働く。",
    note: "デッドリフト、バックエクステンションで鍛えられる。",
  },
  {
    id: "triceps-brachii",
    type: "muscle",
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
    name: "下腿三頭筋(ふくらはぎ)",
    reading: "かたいさんとうきん",
    category: "下半身",
    view: "back",
    description: "ふくらはぎの筋肉(腓腹筋・ヒラメ筋)。つま先立ちの動作で働く。",
    note: "カーフレイズで鍛えられる。",
  },
  {
    id: "infraspinatus",
    type: "muscle",
    name: "棘下筋",
    reading: "きょくかきん",
    category: "背部",
    view: "back",
    description: "肩甲骨の後面にあるローテーターカフ(回旋筋腱板)の一つ。腕を外側にひねる動作で働く。",
    note: "フェイスプルで働く、肩の安定に関わる筋肉。",
  },

  // ------------------------------ 骨(脊柱の側面図) ------------------------------
  {
    id: "cervical-vertebrae",
    type: "bone",
    name: "頸椎",
    reading: "けいつい",
    category: "上半身",
    view: "back",
    description: "首を構成する7個の骨。頭を支え、大きく動かせる部分。",
  },
  {
    id: "thoracic-vertebrae",
    type: "bone",
    name: "胸椎",
    reading: "きょうつい",
    category: "背部",
    view: "back",
    description: "背中の中央にある12個の骨。左右の肋骨と連結し、胸郭を支える。",
  },
  {
    id: "lumbar-vertebrae",
    type: "bone",
    name: "腰椎",
    reading: "ようつい",
    category: "背部",
    view: "back",
    description: "腰にある5個の骨。上半身の重さを支える、負荷がかかりやすい部位。",
  },
  {
    id: "sacrum",
    type: "bone",
    name: "仙骨",
    reading: "せんこつ",
    category: "下半身",
    view: "back",
    description: "腰椎と骨盤をつなぐ骨。5個の骨が癒合してできている。",
  },
  {
    id: "coccyx",
    type: "bone",
    name: "尾骨",
    reading: "びこつ",
    category: "下半身",
    view: "back",
    description: "脊柱の一番下にある小さな骨。",
  },

  // ------------------------------ 骨(肋骨・肩甲骨の正面図) ------------------------------
  {
    id: "clavicle",
    type: "bone",
    name: "鎖骨",
    reading: "さこつ",
    category: "上半身",
    view: "front",
    description: "胸の上部で肩と胸骨をつなぐ骨。体表から触れやすい部位。",
  },
  {
    id: "scapula",
    type: "bone",
    name: "肩甲骨",
    reading: "けんこうこつ",
    category: "背部",
    view: "back",
    description: "背中上部にある三角形の骨。腕の土台となり、可動域が大きい。",
  },
  {
    id: "sternum",
    type: "bone",
    name: "胸骨",
    reading: "きょうこつ",
    category: "上半身",
    view: "front",
    description: "胸の中央にある縦長の骨。左右の肋骨と連結している。",
  },
  {
    id: "ribs",
    type: "bone",
    name: "肋骨",
    reading: "ろっこつ",
    category: "上半身",
    view: "front",
    description: "胸部を囲むかご状の骨(通常左右12対)。心臓や肺を保護する。",
  },

  // ------------------------------ 骨(骨盤・男女比較図) ------------------------------
  {
    id: "ilium",
    type: "bone",
    name: "腸骨",
    reading: "ちょうこつ",
    category: "下半身",
    view: "front",
    description: "骨盤の上部を構成する、左右に大きく広がる骨。",
  },
  {
    id: "pubis",
    type: "bone",
    name: "恥骨",
    reading: "ちこつ",
    category: "下半身",
    view: "front",
    description: "骨盤の前方下部にある骨。左右が体の中心で結合する。",
  },
  {
    id: "ischium",
    type: "bone",
    name: "坐骨",
    reading: "ざこつ",
    category: "下半身",
    view: "front",
    description: "骨盤の下部にある骨。座ったときに体重を支える部分。",
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
