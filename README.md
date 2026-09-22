# 食事・体組成管理 (お客様向けダイエット/増量プランナー)

お客様ごとの食事記録・体組成(体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝)を管理するアプリ。
普段の食事を記録して1日の合計カロリー・PFCを算出し、目標体重変化に応じた
1日あたりの摂取目標カロリーを提示する。

ログインが必要(スタッフ1アカウントのみ、Firebase Authentication・メール/パスワード)で、
Firestore(クラウド上のドキュメントデータベース)にすべてのデータを保存する。どの端末から
アクセスしても同じデータが見え、ある端末での変更は他の端末にも自動的に反映される。**利用
には常時インターネット接続が必要(完全にオフラインでは動作しない)。**

## セットアップ(初回のみ・Firebaseプロジェクトの作成)

1. https://console.firebase.google.com でアカウントを作成し、新規プロジェクトを作成する
2. 左メニューの「構築」→「Firestore Database」を開き、「データベースの作成」で有効化する
   (ロケーションは任意。セキュリティルールは後述の`firestore.rules`で上書きする)
3. 左メニューの「構築」→「Authentication」を開き、「メール/パスワード」プロバイダを有効化し、
   「Users」タブからスタッフ用のログインアカウント(メールアドレス・パスワード)を1件作成する
4. Firestore Database → 「ルール」タブに、リポジトリの `firestore.rules` の内容をそのまま
   貼り付けて公開する(ログイン済みユーザーのみ全操作可、というルール)
5. Firestore Database → 「インデックス」タブ→「複合」で、`firestore.indexes.json` に
   記載されている6件の複合インデックスを手動で作成する(Firebase CLIを使わない場合、
   1件ずつ「インデックスを作成」から `collectionGroup`/`fields` の内容をそのまま入力する。
   作成し忘れても、該当する画面を開いた際にコンソールにインデックス作成用リンク付きの
   エラーが表示されるので、それをクリックして作成することもできる)
6. プロジェクトの概要画面から「アプリを追加」→ウェブアプリを登録し、表示される
   `firebaseConfig` の値を控える
7. リポジトリ直下に `.env.local` を作成し(`.env.local.example` をコピーして使う)、
   控えた値を設定する

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxxxxxxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxxxxxxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxxxx
```

`NEXT_PUBLIC_` から始まる環境変数はビルド時にアプリのコードへ埋め込まれる(apiKeyは
本来ブラウザに公開される前提のキーであり、アクセス制御は`firestore.rules`側で行う)。

## セットアップ(開発)

```bash
npm install
npm run dev
```

`http://localhost:3000` にアクセスする。`.env.local` が無い、またはFirebaseの値が
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
データ移行は不要になった。全端末が同じFirebaseプロジェクトを見ているため)。

以前のSQLite版(`data/app.db`)からデータを引き継ぐ場合は、一度だけ以下を実行して
JSONに変換してから、上記のインポート機能を使う。

```bash
node scripts/export-sqlite-to-json.cjs
```

(`diet-tracker-export.json` という名前でリポジトリ直下に書き出される)

## 外部(携帯のClaude Code等)からの食事記録の登録

食品マスタから選ぶ代わりに、写真やメモから解析した食事内容(品目名・kcal・
たんぱく質/脂質/炭水化物)を、アプリを開かずに直接Firestoreへ登録できる
CLIツールを用意している(`scripts/add-meal-log.mjs`)。

セットアップ(初回のみ):

1. Firebaseコンソール Authentication > Users で、この登録専用の
   メール/パスワードアカウントを1件作成する(スタッフのログインアカウントとは
   別にすることを推奨。権限の範囲は同じだが、あとから無効化・パスワード変更が
   独立して行える)
2. リポジトリ直下に `.env.automation.local` を作成し、以下を設定する
   (`.env*.local` は`.gitignore`対象なのでコミットされない)

   ```
   MEAL_LOG_BOT_EMAIL=automation@example.com
   MEAL_LOG_BOT_PASSWORD=xxxxxxxx
   ```

使い方は `scripts/add-meal-log.mjs` の冒頭コメントを参照(1件登録・複数件の
JSONまとめ登録・`--list-clients`によるお客様名/ID確認・`--dry-run`に対応)。
登録される行は「食品マスタに無い手入力の食事記録」(`foodId: null`)として
扱われ、既存の食事記録一覧・集計にそのまま合算される。

## 使い方の流れ

1. 「お客様」でお客様を新規登録する(名前は必須、生年月日・性別・身長・メモは任意)
2. お客様の「概要」タブでプロフィールを編集し、体重・体脂肪率・筋肉量・内臓脂肪・基礎代謝を記録する(体組成計でわかる項目だけでよい。基礎代謝を記録すると、Mifflin-St Jeor式による推定値より実測値が優先される)
3. 「食品マスタ」で普段食べる食品を基準量(1人前・100g等)あたりの栄養価で登録する(全お客様共通)。事前に登録済みの食品はないため、必要な食品を都度登録する
4. お客様の「プラン」タブで1か月あたりの目標体重変化を設定し、摂取目標カロリー・PFCバランスを確認する
5. お客様の「食事記録」タブで日付ごとに食品を選んで記録する。数量は基準量の倍数(例: 1.5人前なら1.5)。目標摂取カロリーとの差分もその場で確認できる
   - 画面中ほどの「過去の記録」に、記録のある日が新しい順に(合計kcal・PFC付きで)並ぶ。日付をクリックするとその日の記録を開ける(初期は直近90日、「さらに90日前まで表示」で最大730日まで遡れる。未来日付の記録も表示される)
   - 記録の行をクリック(またはフォーカスしてEnter/スペース)すると、その場で編集できる。編集フォームでは日付も変更でき、別の日に記録を移せる

## 構成

- `src/app/clients` : お客様一覧・新規登録
- `src/app/clients/detail` : お客様のプロフィール編集・測定値記録・推移グラフ(概要タブ、`?id=`で対象を指定)
- `src/app/clients/detail/plan` : 目標設定・ダイエット/増量プランの算出結果・PFCバランス
- `src/app/clients/detail/meals` : 日付ごとの食事記録(過去の日ごとの履歴一覧・行クリックでの編集・日付変更)、その日の合計と目標摂取カロリーとの差分
- `src/app/foods` : 食品マスタの検索・登録・削除(全お客様共通)
- `src/app/data` : 全データのエクスポート/インポート(バックアップ・復元)
- `firestore.rules` : Firebaseコンソールの Firestore Database → ルール タブに貼り付ける
  アクセス制御(ログイン済みユーザーのみ全操作可)
- `firestore.indexes.json` : `clientId`絞り込み+日付順ソートを行うクエリ(measurements/
  mealLogs/usualMeals/protocolChecks)に必要な複合インデックスの定義。
  Firebase CLIが無い場合はコンソールから手動で同じ内容を作成する(セットアップ手順参照)
- `supabase/schema.sql` : (過去のSupabase版、参考用)当時のテーブル定義・RLS・
  運動マスタ初期データのSQL。現在のバックエンドはFirestoreのため実運用では使わない
- `scripts/extract-mext-foods.cjs` / `extract-pfc-balance-table.cjs` : 文部科学省の公式Excel等から
  `src/lib/db/data/*.json` を再生成するスクリプト(食品マスタの一括シードは現在無効化中のため未使用)
- `scripts/export-sqlite-to-json.cjs` : 旧SQLite版のデータをJSONに変換する一度きりの移行スクリプト
- `scripts/generate-icons.mjs` : PWAアイコン(`public/icon-*.png`)のプレースホルダー生成
  (正式なロゴに差し替える場合、このスクリプトの再実行は不要。ファイルを直接置き換えればよい)
- `src/lib/health` : BMR/PFC/プラン算出などの純粋な計算ロジック(ユニットテスト対象)
- `src/lib/db` : Firestore(クラウドDB)へのアクセス層。`firebase.ts`がクライアント生成、
  各モジュールの`subscribeTo*`関数+`use-live-query.ts`が他端末での変更を検知して
  自動再取得する仕組み
- `src/lib/db/import-export.ts` : 全データのJSONエクスポート/インポートロジック
- `src/lib/server/current-plan.ts` : お客様のプロフィールと測定値からダイエット/増量プランを算出する共通ロジック(ディレクトリ名は歴史的なもので、実体はブラウザ上で動く非同期関数)
- `public/manifest.json` / `public/sw.js` : PWA化(ホーム画面インストール)の設定。
  常時オンライン前提のため、`sw.js`はオフラインキャッシュを行わない
