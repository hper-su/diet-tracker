// 「食事指導」ページの内容。お客様が直接閲覧することを前提に書かれた、
// ダイエット中の食事の考え方についての解説。
// 元ネタ: 「ダイエット中の食事の考え方_修正版.pptx」(お客様説明用スライド)。
// スライドをそのまま貼るのではなく、Web画面で読みやすい構成に組み替えている。

export type NutritionSubSection = {
  title: string;
  reading?: string;
  body: string;
};

export type ComparisonRow = {
  label: string;
  values: [string, string];
};

export type CombinationMeal = {
  time: string; // 朝・昼・夜など
  items: string[]; // 例: "納豆(3.0g)"
};

export type CombinationExample = {
  title: string;
  meals: CombinationMeal[];
  total: string;
};

// 「控えめに/積極的に」「NG/OK」「高GI/低GI」など、2つの選択肢を対比して見せるカード。
export type ToneCard = {
  label: string;
  tone: "caution" | "good";
  description: string;
  foods?: string[];
};

export type StatHighlight = {
  label: string;
  value: string;
  note?: string;
};

export type NutritionPriority = {
  order: number;
  title: string;
  paragraphs: string[];
  bulletListIntro?: string;
  bulletList?: string[];
  // 理由の一つをさらに深掘りする補足(食事誘発性熱産生の説明など)。
  detailHeading?: string;
  detailParagraphs?: string[];
  detailBulletList?: string[];
  toneCards?: ToneCard[];
  comparisonIntro?: string;
  comparisonColumns?: [string, string];
  comparisonRows?: ComparisonRow[];
  // 1日で目安量に到達する組み合わせの例。
  combinationExample?: CombinationExample;
  // combinationExampleの直後に続く補足的な箇条書き(例: 食物繊維の「その他の効果」)。
  secondaryBulletListTitle?: string;
  secondaryBulletList?: string[];
  // セクション内でもう1段テーマが変わるときの小見出し(例: 「水分も摂る」)と、それに続く段落。
  subheading2?: string;
  paragraphsAfterExample?: string[];
  statHighlight?: StatHighlight;
  tipsListIntro?: string;
  tipsList?: string[];
  subSections?: NutritionSubSection[];
  closingParagraph?: string;
  example?: string;
  link?: { href: string; label: string };
};

export const INTRO_BEFORE = "まず大前提として、";
export const INTRO_BOLD = "消費カロリーより摂取カロリーを少なくする";
export const INTRO_AFTER = "ことが、ダイエットの土台になります。";

export const INTRO_HIGHLIGHT: StatHighlight = {
  label: "ただし、1日単位で厳密に守る必要はありません",
  value: "およそ1週間のトータルで帳尻を合わせるイメージでOK",
  note: "外食や飲み会で多く摂った日があっても、前後の日で調整すれば週単位ではしっかり赤字を作れます。実際、平日と週末で摂取量が極端にブレる人より、週を通して安定して摂れている人の方が減量結果が良いというデータもあります。",
};

export const INTRO_POINT =
  "**ポイント**: 同じ週間摂取カロリーでも「何を、いつ食べるか」で、続けやすさと結果の質(筋肉量の維持・リバウンドのしにくさ)が変わります。";

export const NUTRITION_PRIORITIES: NutritionPriority[] = [
  {
    order: 1,
    title: "タンパク質を最優先で確保する",
    paragraphs: [
      "高タンパクな食事は、ダイエットの成功率とその後のリバウンド防止の両方に役立つことが分かっています。",
    ],
    bulletListIntro: "理由は3つあります。",
    bulletList: [
      "**筋肉量の維持につながる**(筋肉が落ちると代謝も落ちてしまう)",
      "**満腹感が持続しやすい**(空腹による過食を防げる)",
      "消化する時にもカロリーを使うため、糖質・脂質より効率が良い",
    ],
    detailHeading: "食事誘発性熱産生(DIT)とは",
    detailParagraphs: [
      "3つ目の「消化する時にもカロリーを使う」について、もう少し詳しく説明します。食べ物を消化するために体が使うカロリーのことを食事誘発性熱産生(しょくじゆうはつせいねつさんせい、DIT)と呼びます。同じ量を食べても「何を食べるか」で、この消費量が変わります。",
    ],
    detailBulletList: [
      "お肉や魚、卵などのタンパク質 → 消化に使うカロリーが多い(食べた分の約20〜30%)",
      "ご飯やパンなどの糖質 → 消化に使うカロリーは少なめ(約10%)",
      "揚げ物や油っこいもの(脂質)→ 消化に使うカロリーはごくわずか(数%程度)",
    ],
    comparisonIntro:
      "実際の数字で例えると(一例)。同じ約490kcalの食事でも、内容によってこれだけ差が出ます。",
    comparisonColumns: ["唐揚げ定食(高脂質)", "鶏むね肉グリル定食(高タンパク)"],
    comparisonRows: [
      { label: "カロリー", values: ["約490kcal", "約490kcal"] },
      { label: "タンパク質量", values: ["約26g", "約54g"] },
      { label: "消化に使われるカロリー", values: ["約51kcal", "約72kcal"] },
    ],
    closingParagraph:
      "差はたった1食で約21kcalですが、毎食続けると、21kcal × 3食 × 30日 ≈ 1,890kcal/月(体脂肪約0.3kg分)になります。**1食の目安は、お肉・魚・卵(1食20〜30g程度のタンパク質)です**。",
    example: "例: 鶏むね肉、卵、魚、豆腐、ギリシャヨーグルト、プロテインパウダーなど",
  },
  {
    order: 2,
    title: "脂質は「質」で選ぶ",
    paragraphs: [
      "脂質はカロリー密度が高く、1gあたり9kcal(たんぱく質・炭水化物は1gあたり4kcal)です。量のコントロールは必要ですが、極端にカットする必要はありません。減らす際は飽和脂肪酸から、不飽和脂肪酸はできるだけ残しましょう。",
    ],
    toneCards: [
      {
        label: "飽和脂肪酸(控えめに)",
        tone: "caution",
        description:
          "バター、揚げ物、加工肉などに多く、常温で固体になるタイプ。摂りすぎると悪玉(LDL)コレステロールが増えやすく、生活習慣病のリスクにつながるとされています。ゼロにする必要はなく、まずは摂りすぎている部分から減らすのがおすすめです。",
        foods: ["バター", "揚げ物", "加工肉", "ラード・パーム油・マーガリン"],
      },
      {
        label: "不飽和脂肪酸(積極的に)",
        tone: "good",
        description:
          "オリーブオイル、ナッツ、青魚などに多く、常温で液体のタイプ。悪玉コレステロールを下げやすく、体に良いとされています。特に青魚や亜麻仁油・えごま油に多いオメガ3脂肪酸は、中性脂肪を下げたり炎症を抑えたりする働きがあり、**積極的に摂りたい脂質です**。",
        foods: ["オリーブオイル", "ナッツ類", "青魚(サバ・イワシ・サケ)", "亜麻仁油・えごま油"],
      },
    ],
    closingParagraph:
      "減量中に脂質の量を減らしたい場合は、まず飽和脂肪酸(揚げ物・加工肉・バターなど)から減らし、**不飽和脂肪酸、特にオメガ3を含む魚やオリーブオイルはできるだけ残す**のがおすすめです。",
  },
  {
    order: 3,
    title: "食物繊維・野菜のかさを確保する",
    paragraphs: [
      "同じカロリーでも、野菜・きのこ・海藻類を活用すると満腹感が大きく変わります。ボリュームを出しつつカロリーは抑えられ、血糖値の急上昇も抑えられるので、空腹の波も穏やかになります。",
      "目安は食物繊維1日20〜25g程度です(国の目標量は男性21g・女性18g以上ですが、それよりやや高めの積極摂取の目安です)。",
    ],
    combinationExample: {
      title: "組み合わせ例(1日で約24.3gに到達するパターン)",
      meals: [
        { time: "朝", items: ["納豆(3.0g)", "玄米ごはん(2.1g)"] },
        { time: "昼", items: ["ブロッコリー(4.4g)", "ごぼう(4.6g)のサラダ"] },
        { time: "夜", items: ["さつまいも(4.4g)", "ひじき(2.0g)", "りんご(3.8g)"] },
      ],
      total: "合計 約24.3g",
    },
    secondaryBulletListTitle: "食物繊維のその他の効果",
    secondaryBulletList: [
      "腸内環境を整える(善玉菌のエサになる)",
      "血中コレステロールの排出をサポート",
      "便通の改善(水分とセットで摂ることが前提です)",
    ],
    subheading2: "食物繊維と一緒に「水分」も摂る",
    paragraphsAfterExample: [
      "体の中の水分は、血液を巡らせたり、老廃物を出したり、体温を調整したりする「体の作業員」のような役割をしており、**不足したまま食物繊維だけ増えると、かえってお腹が張ったり便秘が悪化したりすることがあります**。特に食物繊維の多いものを増やしたときや、運動して汗をかいた日は、いつもより多めを意識しましょう。",
    ],
    statHighlight: {
      label: "水分の目安",
      value: "体重(kg) × 30〜35ml/日",
      note: "例: 体重60kgの方なら約1.8〜2.1L/日",
    },
    tipsListIntro: "摂り方のコツ",
    tipsList: [
      "一気に飲まず、コップ1杯ずつこまめに",
      "朝・昼・夕、それぞれのタイミングで1杯",
      "運動の前後にも1杯ずつ補給する",
    ],
    closingParagraph:
      "きのこ類(しめじ100gで約3.5g)や海藻類、豆類(大豆・レンズ豆)も少量で稼げるので、「主食を玄米・雑穀に置き換える」+「野菜・きのこ・海藻を毎食1品加える」の2点だけ意識すれば、無理なく20g台に届きます。",
  },
  {
    order: 4,
    title: "GI値を意識した食品選びをする",
    paragraphs: [
      "GI値(グリセミック・インデックス)は、食後の血糖値の上がりやすさを表す指標です。高GI食品は血糖値が急上昇しやすく、その反動でまた空腹を感じやすくなります。",
    ],
    toneCards: [
      {
        label: "高GI(控えめに)",
        tone: "caution",
        description: "血糖値が急上昇しやすく、反動で空腹感が出やすい。",
        foods: ["白米", "食パン", "うどん"],
      },
      {
        label: "低GI(おすすめ)",
        tone: "good",
        description: "血糖値の上昇が緩やかで、満腹感も持続しやすい。",
        foods: ["玄米", "全粒粉パン", "そば"],
      },
    ],
    closingParagraph:
      "白米・パン・麺類を完全にやめる必要はありません。まずは**主食を低GIのものに置き換える**、あるいは**野菜やタンパク質を先に食べてから主食を摂る(食べる順番)**だけでも、血糖値の波はかなり穏やかになります。",
    link: { href: "/gi-foods", label: "GI値別の食品一覧を見る" },
  },
  {
    order: 5,
    title: "カロリー制限中は微量栄養素にも気を配る",
    paragraphs: [
      "摂取カロリーを落とすと、ビタミン・ミネラルも不足しやすくなります。特に注意したいのは鉄・カルシウム・ビタミンDです。",
    ],
    subSections: [
      {
        title: "鉄",
        body: "**不足すると疲れやすさや集中力の低下**につながります。赤身肉、レバー、あさり、ほうれん草などから。植物性の鉄はビタミンCと一緒に摂ると吸収率が上がります。",
      },
      {
        title: "カルシウム",
        body: "骨の健康に関わります。乳製品、小魚、豆腐、小松菜などから。**骨は食事だけでなく、運動でも強くなります**。スクワットやデッドリフトなど、骨に負荷をかける運動でも骨密度が高まります。",
      },
      {
        title: "ビタミンD",
        body: "カルシウムの吸収を助け、骨や免疫の健康に関わります。鮭・さんま・きのこ類(天日干しのものが◎)などから。**日光を浴びる機会が少ない方は不足しがちなので、意識して摂りましょう**。",
      },
    ],
    closingParagraph:
      "**特定の食品グループを丸ごと避けるような極端な食事制限**をしている場合は、特に不足しやすいので注意しましょう。",
  },
];

export const PRACTICE_INTRO =
  "食事の中身は「優先順位」で考えます。それぞれの理由は下記で1つずつ解説します。";

export type PracticeStep = {
  order: number; // 大前提は0、以降は1〜5(下のNUTRITION_PRIORITIESのorderと一致)
  isPremise?: boolean;
  title: string;
  summary: string;
};

export const PRACTICE_STEPS: PracticeStep[] = [
  {
    order: 0,
    isPremise: true,
    title: "総摂取カロリーが消費カロリー以下になっているか",
    summary: "すべての土台となる大前提です。",
  },
  {
    order: 1,
    title: "タンパク質量の確保",
    summary: "筋肉維持と満腹感のカギ。消化にもカロリーを使うため効率が良い。",
  },
  {
    order: 2,
    title: "脂質は質で選ぶ",
    summary: "不飽和脂肪酸(青魚・オリーブオイル等)を優先的に残す。",
  },
  {
    order: 3,
    title: "野菜・食物繊維でかさを出す",
    summary: "目安20〜25g/日。満腹感が続き、血糖値の急上昇も抑えられる。",
  },
  {
    order: 4,
    title: "GI値を意識した食品選び",
    summary: "低GIへの置き換え・食べる順番で血糖値の波を穏やかに。",
  },
  {
    order: 5,
    title: "微量栄養素の不足に注意",
    summary: "制限中に不足しやすい鉄・カルシウム・ビタミンDをケア。",
  },
];

export const CONTINUATION_TIPS: string[] = [
  "極端な制限は体重が落ちやすい一方、実践のしやすさ・続けやすさの面では万人向けとは言えません。**「カロリー管理×高タンパク×野菜多め」が最も再現性の高い方法**です",
  "記録が続く方には、食事のPFCを見える化することで、バランス不足に気づきやすくなります",
];

export const CLOSING_NOTE =
  "ご自身の活動量や体の状態によって調整が必要な場合もありますので、気になることがあればいつでもご相談ください。";
