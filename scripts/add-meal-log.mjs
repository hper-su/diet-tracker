#!/usr/bin/env node
// 携帯のClaude Code等、外部で解析済みの食事記録(kcal/PFC計算済み)をdiet-tracker
// のFirestoreへ直接登録するためのCLIツール(食事記録の「案A」連携)。
//
// 食品マスタに無い品目でも、mealLogsの1件として登録する(foodIdはnull、
// foodName/kcal/PFCを直接持つ)。これは「1日の合計の手入力調整」行
// (src/lib/db/meal-logs.ts の ADJUSTMENT_FOOD_NAME)と同じ考え方の延長。
//
// 事前準備:
//   1. Firebaseコンソール Authentication > Users で、この自動登録専用の
//      メール/パスワードアカウントを1件作成する(README参照。スタッフの
//      ログインアカウントとは別に作ることを推奨)。
//   2. リポジトリ直下に .env.automation.local を作成し、以下を設定する
//      (.env*.local は.gitignore対象なのでコミットされない):
//        MEAL_LOG_BOT_EMAIL=automation@example.com
//        MEAL_LOG_BOT_PASSWORD=xxxxxxxx
//
// 使い方(1件登録):
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/add-meal-log.mjs \
//     --client "穴見孝和" --date 2026-09-22 --meal lunch \
//     --food "鶏胸肉のグリル 200g" --kcal 330 --protein 62 --fat 7 --carb 0 \
//     [--qty 1] [--memo "AI推定値"] [--dry-run] [--allow-duplicates]
//
// 使い方(複数件まとめて登録。1日分の食事をまとめて渡す場合など):
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/add-meal-log.mjs --json '[
//       {"client":"穴見孝和","date":"2026-09-22","meal":"breakfast","food":"卵かけご飯","kcal":320,"protein":12,"fat":8,"carb":48},
//       {"client":"穴見孝和","date":"2026-09-22","meal":"lunch","food":"鶏胸肉のグリル 200g","kcal":330,"protein":62,"fat":7,"carb":0,"memo":"AI推定値"}
//     ]'
//   (--file path/to/meals.json でJSONファイルから読み込むことも可能)
//
// 重複チェック: 同じお客様・同じ日付に、区分・品目名・数量・kcal/PFCがすべて
// 一致する記録が既にある場合、その件は登録せずスキップする(同じ依頼を2回
// 実行してしまった場合の二重登録を防ぐため)。同じものを本当に2回食べた等で
// 重複を承知で登録したい場合は --allow-duplicates を付ける。
//
// 登録先のお客様は、アプリの「お客様一覧」に表示されている名前の部分一致で
// 特定する(表記ゆれで複数件・0件ヒットした場合はエラーで候補を表示するので、
// --list-clients でお客様名とIDの一覧を確認してから指定し直すこと)。
//
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/add-meal-log.mjs --list-clients

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  writeBatch,
  doc,
  serverTimestamp,
  terminate,
} from "firebase/firestore";
import {
  parseArgs,
  normalizeEntry,
  mealLogDuplicateKey,
  splitDuplicates,
} from "./lib/meal-log-entry.mjs";

// Firebase SDKが開いたままのハンドル(keepalive接続等)がある状態で
// process.exit()を呼ぶと、Node(Windows)がハンドルの強制クローズ中に
// アサーション落ちすることがあるため、exitCodeを立てて自然終了に任せる
// (メッセージの表示は呼び出し元(main().catch)に一本化する)。
function fail(message) {
  throw new Error(message);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    fail(
      `環境変数 ${name} が設定されていません。--env-file=.env.local ` +
        `--env-file=.env.automation.local を付けて実行しているか確認してください。`,
    );
  }
  return value;
}

function entriesFromArgs(args) {
  if (typeof args.json === "string") {
    let parsed;
    try {
      parsed = JSON.parse(args.json);
    } catch (error) {
      fail(`--json の内容がJSONとして解析できません: ${error.message}`);
    }
    if (!Array.isArray(parsed)) fail("--json は配列で指定してください。");
    return parsed.map(normalizeEntry);
  }

  if (typeof args.file === "string") {
    let text;
    try {
      text = readFileSync(args.file, "utf8");
    } catch (error) {
      fail(`--file を読み込めません: ${error.message}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      fail(`--file の内容がJSONとして解析できません: ${error.message}`);
    }
    if (!Array.isArray(parsed)) fail("--file の内容は配列で指定してください。");
    return parsed.map(normalizeEntry);
  }

  // 単発指定(--client/--date/--meal/--food/...)。
  return [
    normalizeEntry(
      {
        client: args.client,
        date: args.date,
        meal: args.meal,
        food: args.food,
        qty: args.qty,
        kcal: args.kcal,
        protein: args.protein,
        fat: args.fat,
        carb: args.carb,
        memo: typeof args.memo === "string" ? args.memo : undefined,
      },
      0,
    ),
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 引数の検証はネットワーク接続(Firebaseサインイン)より前に済ませ、
  // 入力ミスの際に無駄な接続を発生させない。
  const entries = args["list-clients"] ? null : entriesFromArgs(args);

  const firebaseConfig = {
    apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  };
  const botEmail = requireEnv("MEAL_LOG_BOT_EMAIL");
  const botPassword = requireEnv("MEAL_LOG_BOT_PASSWORD");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // FirestoreはgetDocs等の単発操作の後も接続を保持し続けるため、
  // 呼び出し後にterminate(db)で明示的に閉じないとNodeプロセスがハングする。
  // (成功・失敗どちらの経路でも必ず閉じるようtry/finallyでくくる)
  try {
    await signInWithEmailAndPassword(auth, botEmail, botPassword);

    const clientsSnap = await getDocs(collection(db, "clients"));

    if (args["list-clients"]) {
      for (const d of clientsSnap.docs) {
        console.log(`${d.data().name}\t${d.id}`);
      }
      return;
    }

    const resolved = entries.map((entry, index) => {
      const label = `${index + 1}件目(${entry.clientQuery})`;
      const candidates = clientsSnap.docs.filter(
        (d) => d.id === entry.clientQuery || String(d.data().name ?? "").includes(entry.clientQuery),
      );
      if (candidates.length === 0) {
        fail(`${label}: お客様が見つかりません。--list-clients で名前を確認してください。`);
      }
      if (candidates.length > 1) {
        fail(
          `${label}: お客様名が複数件ヒットしました。IDで指定し直してください: ` +
            candidates.map((d) => `${d.data().name}(${d.id})`).join(", "),
        );
      }
      const client = candidates[0];
      return { entry, clientId: client.id, clientName: client.data().name };
    });

    console.log(`登録内容(${resolved.length}件):`);
    for (const { entry, clientName } of resolved) {
      console.log(
        `  [${entry.recordedAt} ${entry.mealType}] ${clientName}: ${entry.foodName} ×${entry.quantity}` +
          ` (${entry.kcal}kcal, P${entry.proteinG}/F${entry.fatG}/C${entry.carbG})` +
          (entry.memo ? ` memo="${entry.memo}"` : ""),
      );
    }

    let toInsert = resolved;
    if (args["allow-duplicates"]) {
      console.log("(--allow-duplicates のため重複チェックは行いません)");
    } else {
      // 登録予定に含まれるお客様×日付ごとに既存の記録を読み、突き合わせる
      // (clientId・recordedAtの等価条件のみなので複合インデックスは不要)。
      const existing = [];
      const seen = new Set();
      for (const { entry, clientId } of resolved) {
        const pairKey = `${clientId}\u0000${entry.recordedAt}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        const snap = await getDocs(
          query(
            collection(db, "mealLogs"),
            where("clientId", "==", clientId),
            where("recordedAt", "==", entry.recordedAt),
          ),
        );
        for (const d of snap.docs) existing.push(d.data());
      }
      const { fresh, duplicates } = splitDuplicates(resolved, existing, ({ entry, clientId }) =>
        mealLogDuplicateKey({ clientId, ...entry }),
      );
      if (duplicates.length > 0) {
        console.log(`登録済みのためスキップ(${duplicates.length}件):`);
        for (const { entry, clientName } of duplicates) {
          console.log(
            `  [${entry.recordedAt} ${entry.mealType}] ${clientName}: ${entry.foodName} ×${entry.quantity}` +
              ` (${entry.kcal}kcal, P${entry.proteinG}/F${entry.fatG}/C${entry.carbG})`,
          );
        }
      }
      toInsert = fresh;
    }

    if (args["dry-run"]) {
      console.log(`(--dry-run のため実際の登録は行いません。登録予定: ${toInsert.length}件)`);
      return;
    }

    if (toInsert.length === 0) {
      console.log("新規に登録する記録はありません(すべて登録済みでした)。");
      return;
    }

    // 500件/バッチのFirestore上限を踏まえ、既存のchunkedBatchInsertと同じ
    // 450件区切りでバッチ登録する(通常の利用件数では1バッチで収まる想定)。
    const CHUNK_SIZE = 450;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      if (chunk.length === 1) {
        const { entry, clientId } = chunk[0];
        await addDoc(collection(db, "mealLogs"), {
          clientId,
          recordedAt: entry.recordedAt,
          mealType: entry.mealType,
          foodId: null,
          foodName: entry.foodName,
          quantity: entry.quantity,
          kcal: entry.kcal,
          proteinG: entry.proteinG,
          fatG: entry.fatG,
          carbG: entry.carbG,
          memo: entry.memo,
          createdAt: serverTimestamp(),
        });
      } else {
        const batch = writeBatch(db);
        for (const { entry, clientId } of chunk) {
          const ref = doc(collection(db, "mealLogs"));
          batch.set(ref, {
            clientId,
            recordedAt: entry.recordedAt,
            mealType: entry.mealType,
            foodId: null,
            foodName: entry.foodName,
            quantity: entry.quantity,
            kcal: entry.kcal,
            proteinG: entry.proteinG,
            fatG: entry.fatG,
            carbG: entry.carbG,
            memo: entry.memo,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    }

    console.log(`登録しました(${toInsert.length}件)。`);
  } finally {
    await terminate(db);
  }
}

main().catch((error) => {
  console.error(`エラー: ${error?.message ?? error}`);
  process.exitCode = 1;
});
