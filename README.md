# 食事・体組成管理 (お客様向けダイエット/増量プランナー)

お客様ごとの食事記録・体組成(体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝)を管理するアプリ。
普段の食事を記録して1日の合計カロリー・PFCを算出し、目標体重変化に応じた
1日あたりの摂取目標カロリーを提示する。

ログイン認証はなく、Supabase(クラウド上のPostgresデータベース)にすべてのデータを
保存する。どの端末からアクセスしても同じデータが見え、ある端末での変更は
Supabase Realtimeにより他の端末にも自動的に反映される。**利用には常時インターネット
接続が必要(完全にオフラインでは動作しない)。**

## セットアップ(初回のみ・Supabaseプロジェクトの作成)

1. https://supabase.com でアカウントを作成し、新規プロジェクトを作成する
2. プロジェクトの「SQL Editor」を開き、`supabase/schema.sql` の内容を貼り付けて実行する
   (テーブル作成・アクセス権限の設定・運動マスタの初期データ投入まで一括で行われる)
3. プロジェクトの「Settings」→「API」から、Project URL と anon public キーを控える
4. リポジトリ直下に `.env.local` を作成し(`.env.local.example` をコピーして使う)、
   控えた値を設定する

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`NEXT_PUBLIC_` から始まる環境変数はビルド時にアプリのコードへ埋め込まれる(anonキーは
本来ブラウザに公開される前提のキーであり、アクセス制御は`schema.sql`のRLSポリシー側で
行う。今回は「ログイン認証なしで誰でも読み書き可能」というポリシーにしている)。

## セットアップ(開発)

```bash
npm install
npm run dev
```

`http://localhost:3000` にアクセスする。`.env.local` が無い、またはSupabaseの値が
未設定だとアプリの起動時にエラーになる。

## ビルド・配布

```bash
npm run build   # out/ に静的サイトを書き出す(next build)
npm run serve   # out/ をローカルで動作確認(http://localhost:3000)
npm run deploy  # out/ を GitHub Pages (gh-pages ブランチ) に公開
```

`npm run deploy` にはあらかじめ GitHub 上にリポジトリを作成し、`git remote add origin ...`
しておく必要がある(`gh-pages` パッケージが `out/` を `gh-pages` ブランチにpushする)。
ビルド時に `.env.local` の値がアプリに埋め込まれるため、ビルド・デプロイはこのファイルが
存在する端末(またはCI上で同名の環境変数を設定した状態)で行う。

## タブレットへのインストール(ホーム画面アイコン)

1. タブレットのブラウザで、GitHub PagesのURL(例: `https://<ユーザー名>.github.io/<リポジトリ名>/clients/`)を開く
2. Safari(iPad): 共有ボタン →「ホーム画面に追加」/ Chrome(Android): メニュー →「アプリをインストール」
3. ホーム画面のアイコンから起動できる(常時インターネット接続が必要。オフラインでは動作しない)

## データのバックアップ・復元

「データ管理」画面(`/data`)から、共有データベースの全データをJSONファイルに
エクスポート/インポートできる。インポートは共有データベースの内容を丸ごと置き換え、
結果は全端末に反映される(トラブル時の復元・定期バックアップ用。日常的な端末間の
データ移行は不要になった。全端末が同じSupabaseプロジェクトを見ているため)。

以前のSQLite版(`data/app.db`)からデータを引き継ぐ場合は、一度だけ以下を実行して
JSONに変換してから、上記のインポート機能を使う。

```bash
node scripts/export-sqlite-to-json.cjs
```

(`diet-tracker-export.json` という名前でリポジトリ直下に書き出される)

## 使い方の流れ

1. 「お客様」でお客様を新規登録する(名前は必須、生年月日・性別・身長・メモは任意)
2. お客様の「概要」タブでプロフィールを編集し、体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝を記録する(体組成計でわかる項目だけでよい。基礎代謝を記録すると、Mifflin-St Jeor式による推定値より実測値が優先される)
3. 「食品マスタ」で普段食べる食品を基準量(1人前・100g等)あたりの栄養価で登録する(全お客様共通)。事前に登録済みの食品はないため、必要な食品を都度登録する
4. お客様の「プラン」タブで1か月あたりの目標体重変化を設定し、摂取目標カロリー・PFCバランスを確認する
5. お客様の「食事記録」タブで日付ごとに食品を選んで記録する。数量は基準量の倍数(例: 1.5人前なら1.5)。目標摂取カロリーとの差分もその場で確認できる

## 構成

- `src/app/clients` : お客様一覧・新規登録
- `src/app/clients/detail` : お客様のプロフィール編集・測定値記録・推移グラフ(概要タブ、`?id=`で対象を指定)
- `src/app/clients/detail/plan` : 目標設定・ダイエット/増量プランの算出結果・PFCバランス
- `src/app/clients/detail/meals` : 日付ごとの食事記録・その日の合計と目標摂取カロリーとの差分
- `src/app/foods` : 食品マスタの検索・登録・削除(全お客様共通)
- `src/app/data` : 全データのエクスポート/インポート(バックアップ・復元)
- `supabase/schema.sql` : Supabaseプロジェクトに最初に一度だけ実行するテーブル定義・
  アクセス権限(RLS)・運動マスタ初期データのSQL
- `scripts/extract-mext-foods.cjs` / `extract-pfc-balance-table.cjs` : 文部科学省の公式Excel等から
  `src/lib/db/data/*.json` を再生成するスクリプト(食品マスタの一括シードは現在無効化中のため未使用)
- `scripts/export-sqlite-to-json.cjs` : 旧SQLite版のデータをJSONに変換する一度きりの移行スクリプト
- `scripts/generate-icons.mjs` : PWAアイコン(`public/icon-*.png`)のプレースホルダー生成
  (正式なロゴに差し替える場合、このスクリプトの再実行は不要。ファイルを直接置き換えればよい)
- `src/lib/health` : BMR/PFC/プラン算出などの純粋な計算ロジック(ユニットテスト対象)
- `src/lib/db` : Supabase(クラウドDB)へのアクセス層。`supabase.ts`がクライアント生成、
  `realtime.ts`/`use-live-query.ts`が他端末での変更を検知して自動再取得する仕組み
- `src/lib/db/import-export.ts` : 全データのJSONエクスポート/インポートロジック
- `src/lib/server/current-plan.ts` : お客様のプロフィールと測定値からダイエット/増量プランを算出する共通ロジック(ディレクトリ名は歴史的なもので、実体はブラウザ上で動く非同期関数)
- `public/manifest.json` / `public/sw.js` : PWA化(ホーム画面インストール)の設定。
  常時オンライン前提のため、`sw.js`はオフラインキャッシュを行わない
