// 「ビタミン・ミネラルガイド」ページの内容。お客様が直接閲覧することを前提に書かれた、
// ビタミン・ミネラルの基本と、調理法による摂取効率の違いについての解説。
// 元ネタ: 「ビタミンミネラルガイド_お客様用_改訂版.md」。

export type Tone = "blue" | "amber" | "emerald" | "orange";

export type NutrientRow = { name: string; col2: string; col3: string };
export type NutrientTable = {
  columns: [string, string, string];
  rows: NutrientRow[];
};

export type NutrientTypeSection = {
  emoji: string;
  label: string;
  tone: Tone;
  description?: string;
  table: NutrientTable;
  quote?: string;
  warning?: string;
};

export type NutrientCategory = {
  heading: string;
  note?: string;
  types: NutrientTypeSection[];
  sharedQuote?: string;
};

export const SUBTITLE = "ビタミン・ミネラルの基本を、わかりやすくまとめました。";

export const WHAT_IS_HEADING = "そもそもビタミン・ミネラルって？";
export const WHAT_IS_PARAGRAPHS: string[] = [
  "三大栄養素(**たんぱく質・脂質・炭水化物**)が「カラダを作る材料・エネルギー源」だとすると、ビタミン・ミネラルは、その材料をうまく使うための**「潤滑油」「サポート役」**です。",
  "体の中でほとんど作れないため、**食事から摂る必要がある**という共通点があります。",
  "このページでは、13種類のビタミンと13種類のミネラルの基本と、調理法による違いを解説します。",
];

export const VITAMIN_CATEGORY: NutrientCategory = {
  heading: "① ビタミンは大きく2タイプ",
  note: "ビタミンは全部で13種類。ポイントは「水に溶けやすいか、油に溶けやすいか」で性質が変わることです。(※下の表はわかりやすい代表的なものを抜粋しています。他にパントテン酸・ビオチンがあります)",
  types: [
    {
      emoji: "🟦",
      label: "水に溶けるタイプ(水溶性)— こまめな補給が必要",
      tone: "blue",
      description:
        "体に貯めておけず、余った分は尿として出ていきます。運動量が多い方は代謝が上がる分、消費量も増えるため特に不足しやすいタイプです。",
      table: {
        columns: ["名前", "主な働き", "多い食材"],
        rows: [
          { name: "ビタミンC", col2: "疲労回復・肌の健康", col3: "果物、パプリカ、じゃがいも" },
          { name: "ビタミンB1", col2: "糖質をエネルギーに変える", col3: "豚肉、玄米" },
          {
            name: "ビタミンB2",
            col2: "三大栄養素の代謝をサポート(特に脂質)",
            col3: "卵、乳製品、レバー",
          },
          { name: "ナイアシン", col2: "エネルギー代謝", col3: "魚、肉" },
          { name: "ビタミンB6", col2: "たんぱく質の合成", col3: "魚、バナナ" },
          { name: "ビタミンB12・葉酸", col2: "血液を作る", col3: "レバー、貝類、緑黄色野菜" },
        ],
      },
      quote:
        "筋トレしてる人ほど、B群とCはこまめに摂ってくださいね。一気に摂っても余分は流れちゃうので",
    },
    {
      emoji: "🟨",
      label: "油に溶けるタイプ(脂溶性)— 摂りだめができる",
      tone: "amber",
      description:
        "体に貯蔵できるので毎日でなくてもOK。ただし摂りすぎには注意。**油と一緒に摂ると吸収率アップ**という特徴があります。",
      table: {
        columns: ["名前", "主な働き", "多い食材"],
        rows: [
          { name: "ビタミンA", col2: "目・皮膚の健康", col3: "レバー、うなぎ、緑黄色野菜" },
          { name: "ビタミンD", col2: "骨を強くする", col3: "鮭、きのこ類、日光浴でも生成" },
          { name: "ビタミンE", col2: "抗酸化(老化・サビ対策)", col3: "ナッツ、植物油" },
          { name: "ビタミンK", col2: "血液・骨の健康", col3: "納豆、青菜" },
        ],
      },
      quote:
        "野菜サラダはノンオイルよりオイル入りドレッシングの方が、実はビタミン吸収がいいんですよ",
      warning:
        "摂りすぎ注意: 脂溶性ビタミンは体に貯蔵されるため、サプリなどでの過剰摂取には注意が必要です。",
    },
  ],
};

export const MINERAL_CATEGORY: NutrientCategory = {
  heading: "② ミネラルも2タイプ",
  note: "ミネラルは13種類。「たくさん必要なもの」と「ごく少量でいいもの」に分かれます。(※下の表は代表的なものを抜粋しています。他にリン・銅・マンガン・ヨウ素・セレン・クロム・モリブデンがあります)",
  types: [
    {
      emoji: "🟩",
      label: "たくさん必要なタイプ(多量ミネラル)",
      tone: "emerald",
      description:
        "カルシウム・カリウム・マグネシウム・ナトリウムなど、体液や骨格の維持にまとまった量が必要なミネラルです。",
      table: {
        columns: ["名前", "主な働き", "多い食材"],
        rows: [
          { name: "カルシウム", col2: "骨・歯を作る", col3: "乳製品、小魚、大豆" },
          { name: "カリウム", col2: "むくみ・血圧の調整", col3: "野菜、果物、いも" },
          { name: "マグネシウム", col2: "筋肉の動き・エネルギー代謝", col3: "ナッツ、海藻、大豆" },
          { name: "ナトリウム", col2: "体液バランス", col3: "塩分(摂りすぎ注意)" },
        ],
      },
    },
    {
      emoji: "🟧",
      label: "少量でいいタイプ(微量ミネラル)",
      tone: "orange",
      description:
        "鉄・亜鉛など、必要量はごくわずかですが不足すると影響が大きいミネラルです。特に女性は不足しがちな傾向があります。",
      table: {
        columns: ["名前", "主な働き", "多い食材"],
        rows: [
          { name: "鉄", col2: "酸素を全身に運ぶ", col3: "レバー、赤身肉、ほうれん草" },
          { name: "亜鉛", col2: "筋肉の合成・免疫力", col3: "牡蠣、赤身肉" },
        ],
      },
    },
  ],
  sharedQuote:
    "特に女性はカルシウム・鉄・カリウムが不足しがち。トレーニング後のリカバリーにも直結しますよ",
};

export const OTHER_NUTRIENTS_HEADING = "③ あすけんでも見る「他の重要栄養素」";
export const OTHER_NUTRIENTS_INTRO =
  "ビタミン・ミネラルではありませんが、あすけんのグラフにも出てくる、体づくりに関わる栄養素です。";
export const OTHER_NUTRIENTS_TABLE: NutrientTable = {
  columns: ["名前", "主な働き", "ポイント"],
  rows: [
    {
      name: "糖質",
      col2: "素早いエネルギー源",
      col3: "炭水化物から食物繊維を引いたもの。摂りすぎ・摂らなさすぎ両方に注意",
    },
    {
      name: "食物繊維",
      col2: "腸内環境・血糖値の安定",
      col3: "野菜、きのこ、海藻、玄米に多い。現代人は不足しがち",
    },
    {
      name: "飽和脂肪酸",
      col2: "エネルギー源だが摂りすぎ注意",
      col3: "肉の脂身、バターなどに多い。摂りすぎで生活習慣病リスク",
    },
  ],
};
export const OTHER_NUTRIENTS_QUOTE = "白米を玄米に変えるだけで、食物繊維はぐっと増えますよ";

export type CookingTypeSection = {
  emoji: string;
  label: string;
  tone: Tone;
  points: string[];
  action: string;
};

export const COOKING_HEADING = "④ 調理法によって摂れる栄養素が変わる";
export const COOKING_INTRO =
  "ポイントはシンプルです。**「水に溶けるタイプ」と「油に溶けるタイプ」で、加熱の影響がまったく違います**。";

export const COOKING_TYPES: CookingTypeSection[] = [
  {
    emoji: "🟦",
    label: "水に溶けるタイプ(ビタミンC・B群)",
    tone: "blue",
    points: [
      "茹でると、栄養素が**茹で汁に逃げてしまう**",
      "加熱にも弱く、成分そのものが壊れやすい",
      "ビタミンCは特に弱く、非加熱調理(水にさらす等)で元の70%程度、加熱調理で50%程度まで減ることも(水溶性ビタミンの中でも最も減りやすい)",
    ],
    action:
      "スープや味噌汁にして**汁ごと飲む**、蒸す・レンジ調理を選ぶ(茹でるより逃げにくい)",
  },
  {
    emoji: "🟨",
    label: "油に溶けるタイプ(ビタミンA・D・E・K)",
    tone: "amber",
    points: [
      "水に溶けないので、茹でてもあまり流れ出ない",
      "全体的に熱に強く、加熱してもしっかり残る",
      "ただし**炒め物や揚げ物など高温×長時間**だと、さすがに壊れ始める",
    ],
    action:
      "ナムルや炒め物などで油と組み合わせると吸収率アップ。ただし「強火で長時間」は避ける",
  },
];

export const ROTATION_HEADING = "🔄 だからこそ「同じ食材でも調理法はバラけさせる」";
export const ROTATION_PARAGRAPH =
  "生・茹でる・蒸す・炒める…どの調理法にも「得意な栄養素」と「苦手な栄養素」があります。毎回同じ調理法だと、その調理法が苦手な栄養素だけが摂れない状態がずっと続いてしまいます。";

export type CookingMethodRow = { method: string; strength: string };
export const COOKING_METHOD_TABLE: CookingMethodRow[] = [
  { method: "生", strength: "熱に弱いビタミンC・酵素をそのまま摂れる" },
  { method: "蒸す・レンジ", strength: "水に流れ出る損失が少なく、水溶性ビタミンも残りやすい" },
  { method: "茹でる(汁ごと)", strength: "汁に溶け出た栄養も一緒に摂れる" },
  {
    method: "炒める・ナムル",
    strength: "油と合わさって脂溶性ビタミン(A・D・E・K)の吸収率アップ",
  },
];

export const ROTATION_QUOTE =
  "『これが体にいいから毎日同じ調理法』じゃなくて、サラダの日もあればお味噌汁の日、ナムルの日があると、結果的に栄養の摂りこぼしが少なくなりますよ";

export const ROTATION_CLOSING =
  "**→ 1週間の中で「生・茹でる/蒸す・炒める」がまんべんなく登場するのが理想**";

export type SummaryItem = { emoji: string; bold: string; body: string };

export const SUMMARY_HEADING = "今日から意識したい3つのポイント";
export const SUMMARY_ITEMS: SummaryItem[] = [
  {
    emoji: "🥗",
    bold: "生野菜・スープ・蒸し料理をバランスよく",
    body: "→ ビタミンCやB群を無駄なく摂れる",
  },
  {
    emoji: "🫒",
    bold: "ナムルや炒め物には油を少し使う",
    body: "→ 脂溶性ビタミン(A・D・E・K)の吸収がアップ",
  },
  {
    emoji: "🍲",
    bold: "茹でた汁は捨てずに活用",
    body: "→ 味噌汁・スープにすれば流れ出た栄養も摂れる",
  },
];

// 豆知識: Nutritional Dark Matter(栄養のダークマター)について。
export type TriviaStat = { value: string; label: string };

export const TRIVIA_HEADING = "豆知識: 栄養成分表示の先にある世界";
export const TRIVIA_INTRO =
  "ビタミン・ミネラル以外にも、食品にはまだ解明されていない成分が数多く存在します。";

export const TRIVIA_STATS: TriviaStat[] = [
  {
    value: "約150〜180種類",
    label:
      "栄養成分表示に記載される成分(カロリー、たんぱく質、脂質、炭水化物、代表的なビタミン・ミネラルなど)",
  },
  {
    value: "26,000〜130,000種類以上",
    label: "食品に実際に含まれることが近年の研究でわかってきた化学物質(推定)",
  },
];

export const TRIVIA_TERM = "Nutritional Dark Matter(栄養のダークマター)";
export const TRIVIA_EXPLANATION =
  "天文学でいう「ダークマター」(宇宙の大部分を占めるが直接観測できない未知の物質)になぞらえて、こうしたまだ解明されていない食品成分は**「Nutritional Dark Matter(栄養のダークマター)」**と呼ばれています。現在、「Foodome Project」などの研究により、これら未知の成分の解明が進められています。";
