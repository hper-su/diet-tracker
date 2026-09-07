// 体組成の各指標についての解説データ。お客様が直接閲覧することも想定し、
// 指標の意味と目安の基準値のみを掲載する。基準値は複数の公表資料
// (日本肥満学会の判定基準、体組成計メーカーの目安等)で広く紹介されている
// 代表的な値であり、年齢・性別・測定機器によって幅がある。診断や医学的
// 判断の根拠にはせず、あくまで参考情報として使うこと。

export type ReferenceRow = {
  label: string;
  value: string;
};

export type BodyMetric = {
  key: string;
  name: string;
  unit: string;
  summary: string;
  description: string;
  referenceNote?: string;
  referenceRows?: ReferenceRow[];
};

export const BODY_METRICS: BodyMetric[] = [
  {
    key: "bmi",
    name: "BMI",
    unit: "",
    summary: "体重(kg)÷身長(m)の2乗で算出する、肥満度の国際的な指標。",
    description:
      "Body Mass Indexの略。身長に対する体重のバランスを表す指標で、世界的に広く使われている。日本肥満学会の判定基準では、統計的にもっとも病気になりにくいとされる「標準体重」はBMI=22とされている。",
    referenceNote: "出典: 日本肥満学会の判定基準(成人)",
    referenceRows: [
      { label: "低体重(やせ)", value: "18.5未満" },
      { label: "普通体重", value: "18.5以上25未満" },
      { label: "肥満(1度)", value: "25以上30未満" },
      { label: "肥満(2度)", value: "30以上35未満" },
      { label: "肥満(3度)", value: "35以上40未満" },
      { label: "肥満(4度)", value: "40以上" },
    ],
  },
  {
    key: "bodyFatPct",
    name: "体脂肪率(BF)",
    unit: "%",
    summary: "体重に占める脂肪の割合。同じ体重でも中身の違いが分かる。",
    description:
      "体重のうち脂肪が占める割合。体重・BMIが同じでも、体脂肪率が違えば見た目や健康リスクは大きく異なる。減量中は体重よりも体脂肪率(と筋肉量)の変化に注目した方が、実際の体つきの変化を捉えやすい。",
    referenceNote: "出典: 一般的に紹介されている目安(体組成計メーカー等)。年齢や測定方式により差がある。",
    referenceRows: [
      { label: "男性・標準", value: "10〜19%" },
      { label: "男性・やや高い", value: "20〜24%" },
      { label: "男性・高い", value: "25%以上" },
      { label: "女性・標準", value: "20〜29%" },
      { label: "女性・やや高い", value: "30〜34%" },
      { label: "女性・高い", value: "35%以上" },
    ],
  },
  {
    key: "muscleMass",
    name: "筋肉量(MM)",
    unit: "kg",
    summary: "全身の筋肉の重さ。基礎代謝や姿勢、生活の質に関わる。",
    description:
      "骨格筋を中心とした筋肉の重さ(kg)。筋肉量が多いほど基礎代謝が高くなりやすく、太りにくく痩せやすい体づくりの土台になる。加齢とともに何もしなければ自然に減少していく(サルコペニア)ため、意識的な維持・向上が重要。",
    referenceNote:
      "筋肉量(kg)はもともとの体格によって適正な値が大きく異なるため、目安には体重に占める割合である「骨格筋率」を用いる。出典: 体組成計メーカー等で紹介されている目安。加齢とともに低下する傾向があり、年齢による差も大きいため、成人の一般的な参考値として見ること。",
    referenceRows: [
      { label: "骨格筋率・男性の目安", value: "33〜39%" },
      { label: "骨格筋率・女性の目安", value: "26〜31%" },
    ],
  },
  {
    key: "visceralFat",
    name: "内臓脂肪(VF)",
    unit: "レベル",
    summary: "お腹の内臓まわりに付く脂肪。生活習慣病との関連が強い。",
    description:
      "胃や腸などの内臓のまわりに付く脂肪。皮下脂肪と違い、蓄積しすぎると高血圧・糖尿病・脂質異常症といった生活習慣病のリスクを高めるとされている。体組成計では「レベル」として相対的な数値で表示されることが多い。",
    referenceNote: "出典: 体組成計メーカー等で紹介されている目安。機種により尺度が異なるため参考値。",
    referenceRows: [
      { label: "標準", value: "1〜9" },
      { label: "やや高い", value: "10〜14" },
      { label: "高い", value: "15以上" },
    ],
  },
  {
    key: "bmr",
    name: "基礎代謝",
    unit: "kcal",
    summary: "何もしなくても生命維持のために消費する、1日あたりのエネルギー量。",
    description:
      "安静にしていても、呼吸や体温維持など生命活動のために消費されるエネルギー量。1日の総消費カロリーの中でも大きな割合を占める。筋肉量が多い人ほど基礎代謝は高くなりやすい。",
  },
  {
    key: "bodyWater",
    name: "体水分率(TBW)",
    unit: "%",
    summary: "体重に占める水分の割合。筋肉量と関係が深い。",
    description:
      "体重のうち水分が占める割合。筋肉は水分を多く含み、脂肪はほとんど水分を含まないため、筋肉量が多い人ほど体水分率は高く、体脂肪率が高い人ほど体水分率は低くなる傾向がある。",
    referenceNote: "出典: 一般的に紹介されている目安。年齢・筋肉量により変動する。",
    referenceRows: [
      { label: "男性の目安", value: "55〜65%" },
      { label: "女性の目安", value: "45〜60%" },
    ],
  },
];
