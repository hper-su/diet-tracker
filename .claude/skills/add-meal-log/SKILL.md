---
name: add-meal-log
description: お客様の食事記録(kcal/PFC計算済み)をdiet-trackerのFirestoreへ登録する。「〇〇様の食事です登録しておいて」のように、食事内容やカロリー・PFCが貼り付けられて登録を頼まれたときに使う。携帯のClaude Code(クラウド環境)からでも、GitHub Actionsのワークフロー経由で登録できる。
---

# 食事記録の登録(携帯・クラウド環境から)

携帯のClaude Code等、このリポジトリのクラウド環境からは Firebase の認証情報を
持っていないため、`scripts/add-meal-log.mjs` を直接実行せず、GitHub Actions の
`.github/workflows/add-meal-log.yml` を起動して登録する(認証情報はリポジトリの
Actions Secrets にある)。

## 手順

1. **登録内容を JSON 配列にする。** 1品目 = 1件。
   ```json
   {"client":"望月","date":"2026-09-25","meal":"breakfast","food":"バナナ1本","kcal":86,"protein":1.1,"fat":0.2,"carb":22.5}
   ```
   - `client`: お客様名の一部(部分一致。「様」は付けない)。複数・0件ヒットはエラーになる
   - `date`: `YYYY-MM-DD`。年が書かれていなければ今日の日付の年を使う
   - `meal`: `breakfast`(朝食) / `lunch`(昼食) / `dinner`(夕食) / `snack`(間食)。
     間食①・間食②などはすべて `snack`
   - `food`: 品目名。量や内訳の補足(「(2枚)」「(あげ・なめこ…)」など)は品目名に含める
   - `kcal` / `protein` / `fat` / `carb`: 数値(0以上)。任意で `qty`(既定1)、`memo`
   - 品目ごとの内訳が無く小計だけの区分は、区分名や品目を並べた名前で1件にする
     (例: `梨・パイナップル・りんご`)
   - 「小計」「本日合計」の行は登録しない(アプリ側で合計される)

2. **合計を検算する。** 各件を足し合わせて、依頼文の小計・本日合計(kcal/P/F/C)と
   一致するか確認する。ずれていたら登録前にユーザーに確認する。

3. **ドライランを実行する。** GitHub MCP の `actions_run_trigger` を使う
   (ツールが未読込なら ToolSearch で `select:mcp__github__actions_run_trigger,mcp__github__actions_list,mcp__github__get_job_logs` を読み込む)。
   - `method`: `run_workflow`, `owner`: `hper-su`, `repo`: `diet-tracker`,
     `workflow_id`: `add-meal-log.yml`, `ref`: `main`
   - `inputs`: `{"dry_run": "true", "json": "<JSON配列を文字列化したもの>"}`

4. **結果を確認する。** 1分ほど待ってから(Bash の `sleep 60` を `run_in_background` で実行)、
   `actions_list`(`list_workflow_runs`, `resource_id`: `add-meal-log.yml`)で最新の実行を取得し、
   `list_workflow_jobs` → `get_job_logs`(`job_id` 指定、`return_content: true`)でログを見る。
   ログの「登録内容(N件)」に正しいお客様のフルネームと全件が出ていることを確認する。

5. **本番登録する。** 手順3と同じ内容で `dry_run` を `"false"` にして実行し、
   ログの最後に「登録しました。」と出ていることを確認する。

6. **報告する。** 登録したお客様名・日付・件数・区分ごとの kcal と合計、ワークフロー実行の
   リンクを日本語で簡潔に伝える。コードの変更は無いのでコミット・プッシュは不要。

## 注意

- 重複チェックは無い。本番登録が成功した実行を再実行すると二重登録になるので、
  同じ内容を再度流さない。誤登録の修正・削除はアプリの画面から行う。
- お客様名がヒットしない・複数ヒットした場合は、ドライランのログに候補が出るので、
  それを見て `client` を直してからやり直す。
