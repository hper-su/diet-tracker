# 食事・体組成管理 (お客様向けダイエット/増量プランナー)

お客様ごとの食事記録・体組成(体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝)を管理するアプリ。
普段の食事を記録して1日の合計カロリー・PFCを算出し、目標体重変化に応じた
1日あたりの摂取目標カロリーを提示する。

ログイン認証はなく、ブラウザの IndexedDB(端末内蔵のデータベース)にすべてのデータを
保存する完全オフライン対応のPWA(Progressive Web App)。サーバーを一切使わないため、
一度ホーム画面にインストールすれば、その端末単体でネット接続なしに動作する。

## セットアップ(開発)

```bash
npm install
npm run dev
```

`http://localhost:3000` にアクセスする(追加のアカウント登録・外部サービス設定は不要)。

## ビルド・配布

```bash
npm run build   # out/ に静的サイトを書き出す(next build + Service Workerマニフェスト生成)
npm run serve   # out/ をローカルで動作確認(http://localhost:3000)
npm run deploy  # out/ を GitHub Pages (gh-pages ブランチ) に公開
```

`npm run deploy` にはあらかじめ GitHub 上にリポジトリを作成し、`git remote add origin ...`
しておく必要がある(`gh-pages` パッケージが `out/` を `gh-pages` ブランチにpushする)。

## タブレットへのインストール(オフライン化)

Service Worker(オフラインキャッシュの仕組み)は `https://` か `localhost` でしか
登録できないため、初回インストール時だけはネット接続とGitHub PagesのURLへの
アクセスが必要。以後は完全にオフラインで動作する。

1. タブレットのブラウザで、GitHub PagesのURL(例: `https://<ユーザー名>.github.io/<リポジトリ名>/clients/`)を開く
2. Safari(iPad): 共有ボタン →「ホーム画面に追加」/ Chrome(Android): メニュー →「アプリをインストール」
3. ホーム画面のアイコンから起動すれば、以後は機内モードでも動作する
4. 既存データを引き継ぐ場合は、下記「データの移行・バックアップ」を参照

## データの移行・バックアップ

「データ管理」画面(`/data`)から、この端末の全データをJSONファイルに
エクスポート/インポートできる。他の端末にデータを移す場合は、エクスポートした
JSONファイルを転送し、移行先の「データ管理」画面からインポートする
(インポートはその端末のデータを丸ごと置き換える)。

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
- `src/app/data` : 全データのエクスポート/インポート(端末間の移行・バックアップ)
- `scripts/extract-mext-foods.cjs` / `extract-pfc-balance-table.cjs` : 文部科学省の公式Excel等から
  `src/lib/db/data/*.json` を再生成するスクリプト(食品マスタの一括シードは現在無効化中のため未使用)
- `scripts/export-sqlite-to-json.cjs` : 旧SQLite版のデータをJSONに変換する一度きりの移行スクリプト
- `scripts/generate-sw-manifest.mjs` : `next build`後に`out/`を走査し、Service Workerが
  オフラインキャッシュする全ファイルの一覧を生成する(`npm run build`から自動実行)
- `scripts/generate-icons.mjs` : PWAアイコン(`public/icon-*.png`)のプレースホルダー生成
  (正式なロゴに差し替える場合、このスクリプトの再実行は不要。ファイルを直接置き換えればよい)
- `src/lib/health` : BMR/PFC/プラン算出などの純粋な計算ロジック(ユニットテスト対象)
- `src/lib/db` : Dexie(IndexedDBラッパー)を使ったブラウザ内蔵データベースへのアクセス層
- `src/lib/db/import-export.ts` : 全データのJSONエクスポート/インポートロジック
- `src/lib/server/current-plan.ts` : お客様のプロフィールと測定値からダイエット/増量プランを算出する共通ロジック(ディレクトリ名は歴史的なもので、実体はブラウザ上で動く非同期関数)
- `public/manifest.json` / `public/sw.js` : PWA化(ホーム画面インストール・オフラインキャッシュ)の設定
