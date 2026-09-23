#!/usr/bin/env node
// 過去の筋トレ記録(Excel「お客様筋トレ記録」)をtrainingLogs/exercises/clientsへ
// 一括登録する一回限りの移行スクリプト。
//
// 事前準備:
//   1. Excelの「全データ」シートを、以下の形の配列JSONとして書き出しておく
//      (列: 氏名/トレーニング回/種目/重さ/回数・秒数/セット数/メモ)。
//        [{ "client": "望月良枝", "session": 1, "exercise": "ラットプル",
//           "weight": "25,20", "reps": "10", "sets": "3", "memo": "" }, ...]
//   2. .env.automation.local に MEAL_LOG_BOT_EMAIL/MEAL_LOG_BOT_PASSWORD が
//      設定済みであること(README参照。他の自動登録スクリプトと共用)。
//
// 使い方:
//   node --env-file=.env.local --env-file=.env.automation.local \
//     scripts/import-training-logs.mjs --source path/to/rows.json [--dry-run]
//
// 挙動:
//   - お客様は氏名の空白を無視した完全一致で既存お客様に紐付ける。表記ゆれが
//     判明している4名分はlib/client-name-match.mjsのCLIENT_NAME_OVERRIDESで
//     読み替える。それでも見つからないお客様名は新規お客様として作成する。
//   - 日付は、そのお客様の体重測定記録(measurements)の日付を古い順に、
//     トレーニング回の新しい方から順に割り当てる。測定記録がセッション数より
//     少ない場合、古い方のセッションは日付不明(recordedAt=null)にする。
//   - 種目名は lib/exercise-normalize.mjs のルールで正規化・分割し、種目マスタ
//     (exercises)に無ければ新規作成する。「判読不能」行は除外する。
//   - --dry-run では実際の書き込みは行わず、登録内容の要約だけを表示する。

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  writeBatch,
  serverTimestamp,
  terminate,
} from "firebase/firestore";
import { parseExerciseCell } from "./lib/parse-training-row.mjs";
import { assignTrainingSessionDates } from "./lib/assign-training-dates.mjs";
import { findMatchingClient, resolveClientName } from "./lib/client-name-match.mjs";

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

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--source") {
      args.source = argv[++i];
    }
  }
  return args;
}

function loadSourceRows(sourcePath) {
  let text;
  try {
    text = readFileSync(sourcePath, "utf8").replace(/^﻿/, "");
  } catch (error) {
    fail(`--source を読み込めません: ${error.message}`);
  }
  let rows;
  try {
    rows = JSON.parse(text);
  } catch (error) {
    fail(`--source の内容がJSONとして解析できません: ${error.message}`);
  }
  if (!Array.isArray(rows)) fail("--source の内容は配列で指定してください。");
  return rows;
}

// クライアントごとに、セッション番号(古い順)でグループ化する。
function groupByClient(rows) {
  const byClient = new Map();
  for (const row of rows) {
    const clientName = String(row.client ?? "").trim();
    if (!clientName) continue;
    if (!byClient.has(clientName)) byClient.set(clientName, []);
    byClient.get(clientName).push(row);
  }
  return byClient;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source) {
    fail("--source <path> でExcelから書き出したJSONファイルを指定してください。");
  }
  const rows = loadSourceRows(args.source);
  const byClient = groupByClient(rows);

  const firebaseConfig = {
    apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  };
  const botEmail = requireEnv("MEAL_LOG_BOT_EMAIL");
  const botPassword = requireEnv("MEAL_LOG_BOT_PASSWORD");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInWithEmailAndPassword(auth, botEmail, botPassword);

    const clientsSnap = await getDocs(collection(db, "clients"));
    const existingClients = clientsSnap.docs.map((d) => ({ id: d.id, name: d.data().name }));

    const exercisesSnap = await getDocs(collection(db, "exercises"));
    const exerciseIdByName = new Map(
      exercisesSnap.docs.map((d) => [d.data().name, d.id]),
    );
    const newExerciseNames = new Set();

    const newClients = []; // { excelName, name }
    const plannedLogs = []; // { clientKey, recordedAt, exerciseName, resolved, weight, reps, sets, memo }
    let illegibleCount = 0;
    const clientSummaries = [];

    for (const [excelName, clientRows] of byClient) {
      const matched = findMatchingClient(existingClients, excelName);
      const clientKey = matched ? matched.id : `new:${excelName}`;
      if (!matched) {
        const alreadyQueued = newClients.some((c) => c.excelName === excelName);
        if (!alreadyQueued) {
          newClients.push({ excelName, name: resolveClientName(excelName) });
        }
      }

      // セッション番号(古い順)ごとに行をまとめる。
      const bySession = new Map();
      for (const row of clientRows) {
        const session = Number(row.session);
        if (!bySession.has(session)) bySession.set(session, []);
        bySession.get(session).push(row);
      }
      const sessionNumbers = Array.from(bySession.keys()).sort((a, b) => a - b);

      // 既存お客様のみ、体重測定記録の日付(古い順)を取得する。新規お客様は
      // まだ測定記録が無いため、全セッションが日付不明になる。
      let measurementDates = [];
      if (matched) {
        // src/lib/db/measurements.tsのlistMeasurements()と同じ
        // (clientId, recordedAt, createdAt)複合インデックスに乗せるため、
        // orderByは2つとも指定する(recordedAtだけだと別インデックスが必要になる)。
        const measurementsSnap = await getDocs(
          query(
            collection(db, "measurements"),
            where("clientId", "==", matched.id),
            orderBy("recordedAt", "asc"),
            orderBy("createdAt", "asc"),
          ),
        );
        measurementDates = measurementsSnap.docs.map((d) => d.data().recordedAt);
      }
      const sessionDates = assignTrainingSessionDates(sessionNumbers.length, measurementDates);

      let resolvedCount = 0;
      let unresolvedCount = 0;
      for (let i = 0; i < sessionNumbers.length; i++) {
        const recordedAt = sessionDates[i];
        for (const row of bySession.get(sessionNumbers[i])) {
          const entries = parseExerciseCell(String(row.exercise ?? ""), String(row.memo ?? ""));
          if (entries === null) {
            illegibleCount += 1;
            continue;
          }
          for (const entry of entries) {
            if (entry.resolved) {
              resolvedCount += 1;
              if (!exerciseIdByName.has(entry.exerciseName)) {
                newExerciseNames.add(entry.exerciseName);
              }
            } else {
              unresolvedCount += 1;
            }
            plannedLogs.push({
              clientKey,
              recordedAt,
              exerciseName: entry.exerciseName,
              resolved: entry.resolved,
              weight: String(row.weight ?? "").trim(),
              reps: String(row.reps ?? "").trim(),
              sets: String(row.sets ?? "").trim(),
              memo: entry.memo,
            });
          }
        }
      }

      const unknownDateCount = sessionDates.filter((d) => d === null).length;
      clientSummaries.push({
        excelName,
        matchedName: matched?.name ?? null,
        isNew: !matched,
        sessionCount: sessionNumbers.length,
        unknownDateCount,
        resolvedCount,
        unresolvedCount,
      });
    }

    console.log(`対象: ${byClient.size}名のお客様、${rows.length}行`);
    console.log("");
    for (const s of clientSummaries) {
      const label = s.isNew ? `${s.excelName}(新規登録)` : `${s.excelName} → ${s.matchedName}`;
      console.log(
        `  ${label}: セッション${s.sessionCount}回` +
          (s.unknownDateCount > 0 ? `(うち日付不明${s.unknownDateCount}回)` : "") +
          ` / 種目行 解決済み${s.resolvedCount}件・未解決${s.unresolvedCount}件`,
      );
    }
    console.log("");
    console.log(`新規作成するお客様(${newClients.length}名): ${newClients.map((c) => c.name).join("、") || "なし"}`);
    console.log(
      `新規作成する種目マスタ(${newExerciseNames.size}件): ${Array.from(newExerciseNames).join("、") || "なし"}`,
    );
    console.log(`除外した行(判読不能): ${illegibleCount}件`);
    console.log(`登録するトレーニング記録: ${plannedLogs.length}件`);

    if (args.dryRun) {
      console.log("");
      console.log("(--dry-run のため実際の登録は行いません)");
      return;
    }

    // 1. 新規お客様を作成する(src/lib/db/clients.tsのinsertClientと同じ初期値)。
    const clientIdByKey = new Map();
    for (const { excelName, name } of newClients) {
      const ref = await addDoc(collection(db, "clients"), {
        name,
        birthdate: null,
        heightCm: null,
        gender: null,
        activityLevel: "moderate",
        pfcPreset: "health",
        course: null,
        purpose: null,
        targetMonthlyWeightChangeKg: null,
        targetWeightChangeKg: null,
        targetPeriodMonths: null,
        targetWeightKg: null,
        targetBodyFatPct: null,
        memo: "筋トレ記録の過去データ移行で新規登録(体重データ未登録)",
        createdAt: serverTimestamp(),
      });
      clientIdByKey.set(`new:${excelName}`, ref.id);
    }

    // 2. 新規の種目マスタを作成する。
    const exerciseIdByNameFinal = new Map(exerciseIdByName);
    for (const name of newExerciseNames) {
      const ref = await addDoc(collection(db, "exercises"), {
        name,
        aliases: [],
        createdAt: serverTimestamp(),
      });
      exerciseIdByNameFinal.set(name, ref.id);
    }

    // 3. トレーニング記録を登録する(500件/バッチのFirestore上限を踏まえ、
    //    450件区切りでバッチ登録する)。
    const CHUNK_SIZE = 450;
    for (let i = 0; i < plannedLogs.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const log of plannedLogs.slice(i, i + CHUNK_SIZE)) {
        const clientId = log.clientKey.startsWith("new:")
          ? clientIdByKey.get(log.clientKey)
          : log.clientKey;
        const exerciseId = log.resolved ? (exerciseIdByNameFinal.get(log.exerciseName) ?? null) : null;
        const ref = doc(collection(db, "trainingLogs"));
        batch.set(ref, {
          clientId,
          recordedAt: log.recordedAt,
          exerciseId,
          exerciseName: log.exerciseName,
          weight: log.weight,
          reps: log.reps,
          sets: log.sets,
          memo: log.memo,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    console.log("登録しました。");
  } finally {
    await terminate(db);
  }
}

main().catch((error) => {
  console.error(`エラー: ${error?.message ?? error}`);
  process.exitCode = 1;
});
