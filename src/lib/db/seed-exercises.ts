// 出典: 厚生労働省「健康づくりのための身体活動・運動ガイド2023」
// 参考「生活活動のメッツ表」・「運動のメッツ表」(国立健康・栄養研究所改訂版
// 「身体活動のメッツ(METs)表」より改変)から、代表的な種目を抜粋。
// https://www.mhlw.go.jp/content/10904750/001171393.pdf
export type ExerciseSeed = {
  category: "生活活動" | "運動";
  name: string;
  mets: number;
};

export const DEFAULT_EXERCISES: ExerciseSeed[] = [
  // 生活活動のメッツ表
  // 歩行速度は資料記載のm/分(分速)をkm/時(時速)に換算(×60÷1000)して表記。
  { category: "生活活動", name: "普通歩行(平地、約4.0km/時、犬を連れて)", mets: 3.0 },
  { category: "生活活動", name: "電動アシスト付き自転車に乗る", mets: 3.0 },
  { category: "生活活動", name: "カーペット掃き・フロア掃き・掃除機", mets: 3.3 },
  { category: "生活活動", name: "歩行(平地、約4.5〜5.1km/時、散歩など)", mets: 3.5 },
  { category: "生活活動", name: "楽に自転車に乗る(8.9km/時)", mets: 3.5 },
  { category: "生活活動", name: "自転車に乗る(16km/時未満、通勤)", mets: 4.0 },
  { category: "生活活動", name: "階段を上る(ゆっくり)", mets: 4.0 },
  { category: "生活活動", name: "やや速歩(平地、やや速めに、約5.6km/時)", mets: 4.3 },
  { category: "生活活動", name: "かなり速歩(平地、速く、約6.4km/時)", mets: 5.0 },
  { category: "生活活動", name: "こどもと遊ぶ(歩く/走る、活発に)", mets: 5.8 },
  { category: "生活活動", name: "農作業(干し草をまとめる、納屋の掃除)", mets: 7.8 },
  { category: "生活活動", name: "階段を上る(速く)", mets: 8.8 },
  // 運動のメッツ表
  { category: "運動", name: "ストレッチング", mets: 2.3 },
  { category: "運動", name: "ヨガ・ビリヤード", mets: 2.5 },
  { category: "運動", name: "ボウリング・バレーボール・社交ダンス", mets: 3.0 },
  { category: "運動", name: "太極拳・ピラティス", mets: 3.0 },
  { category: "運動", name: "自転車エルゴメーター(30〜50ワット)", mets: 3.5 },
  { category: "運動", name: "体操(家で、軽・中等度)", mets: 3.5 },
  { category: "運動", name: "ゴルフ(手引きカートを使って)", mets: 3.5 },
  { category: "運動", name: "ほどほどの強度で行う筋トレ(腕立て伏せ・腹筋運動)", mets: 3.8 },
  { category: "運動", name: "卓球", mets: 4.0 },
  { category: "運動", name: "ラジオ体操第1", mets: 4.0 },
  { category: "運動", name: "テニス(ダブルス)", mets: 4.5 },
  { category: "運動", name: "水中歩行(中等度)", mets: 4.5 },
  { category: "運動", name: "水泳(ゆっくりとした背泳)", mets: 4.8 },
  { category: "運動", name: "野球・ソフトボール", mets: 5.0 },
  { category: "運動", name: "筋トレ(スクワット)", mets: 5.0 },
  { category: "運動", name: "水泳(ゆっくりとした平泳ぎ)", mets: 5.3 },
  { category: "運動", name: "スキー・アクアビクス", mets: 5.3 },
  { category: "運動", name: "バドミントン", mets: 5.5 },
  { category: "運動", name: "ゆっくりとしたジョギング", mets: 6.0 },
  { category: "運動", name: "ウェイトトレーニング(高強度)", mets: 6.0 },
  { category: "運動", name: "バスケットボール", mets: 6.0 },
  { category: "運動", name: "山を登る(軽装)", mets: 6.5 },
  { category: "運動", name: "自転車エルゴメーター(90〜100ワット)", mets: 6.8 },
  { category: "運動", name: "ジョギング", mets: 7.0 },
  { category: "運動", name: "サッカー・スキー・スケート・ハンドボール", mets: 7.0 },
  { category: "運動", name: "エアロビクス", mets: 7.3 },
  { category: "運動", name: "テニス(シングルス)", mets: 7.3 },
  { category: "運動", name: "サイクリング(約20km/時)", mets: 8.0 },
  { category: "運動", name: "激しい強度で行う筋トレ(腕立て伏せ・腹筋運動)", mets: 8.0 },
  { category: "運動", name: "ランニング(約8.0km/時)", mets: 8.3 },
  { category: "運動", name: "水泳(クロール、ふつうの速さ)", mets: 8.3 },
  { category: "運動", name: "ランニング(約9.7km/時)", mets: 9.8 },
  { category: "運動", name: "水泳(クロール、速い)", mets: 10.0 },
  { category: "運動", name: "武道・武術(柔道・空手など)", mets: 10.3 },
  { category: "運動", name: "ランニング(約11.3km/時)", mets: 11.0 },
];
