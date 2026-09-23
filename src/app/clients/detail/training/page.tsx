"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "@/lib/db/use-live-query";
import { getClient, subscribeToClients } from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { listExercises, subscribeToExercises } from "@/lib/db/exercises";
import {
  listExerciseFrequencies,
  listTrainingDates,
  listTrainingLogsByDate,
  listTrainingLogsByUnknownDate,
  subscribeToTrainingLogs,
} from "@/lib/db/training-logs";
import { addDaysISODate, todayISODate } from "@/lib/date";
import { ClientTabs } from "../client-tabs";
import { TrainingLogForm } from "./training-log-form";
import { TrainingLogRow } from "./training-log-row";
import { TrainingSummary } from "./training-summary";

export default function ClientTrainingPage() {
  return (
    <Suspense>
      <ClientTrainingPageInner />
    </Suspense>
  );
}

function ClientTrainingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("id") ?? "";
  const rawDate = searchParams.get("date");
  // 履歴一覧の「日付不明」行から開いたときは、date=unknown という特別な値で
  // 遷移してくる(過去データ移行分、recordedAt=nullの記録)。
  const isUnknownDate = rawDate === "unknown";
  const date = isUnknownDate ? null : rawDate || todayISODate();

  const data = useLiveQuery(async () => {
    const client = await getClient(clientId);
    if (!client) return { client: null };

    const [exercises, logs, dates, frequencies] = await Promise.all([
      listExercises(),
      date !== null ? listTrainingLogsByDate(clientId, date) : listTrainingLogsByUnknownDate(clientId),
      listTrainingDates(clientId),
      listExerciseFrequencies(clientId),
    ]);

    return { client, exercises, logs, dates, frequencies };
  }, [clientId, date], [
    subscribeToClients,
    subscribeToExercises,
    (cb) => subscribeToTrainingLogs(clientId, cb),
  ]);

  if (!clientId) {
    return <NotFound />;
  }

  if (!data) {
    return null;
  }

  if (!data.client) {
    return <NotFound />;
  }

  const { client, exercises, logs, dates, frequencies } = data;
  const today = todayISODate();
  // 「日付不明」の記録一覧を見ている間も、新規記録フォームの日付欄はきちんと
  // 有効な日付を初期値にする(今日の日付にしておく)。
  const formDate = date ?? today;

  return (
    <div className="space-y-6">
      <ClientTabs id={client.id} active="training" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {formatClientName(client.name)} - 筋トレ記録
        </h1>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 p-4 font-medium">
          実施数が多い種目
        </h2>
        <TrainingSummary frequencies={frequencies} />
      </section>

      <TrainingLogForm clientId={clientId} date={formDate} exercises={exercises} />

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="font-medium">トレーニング実施日の履歴</h2>
          {date !== today && (
            <Link
              href={`/clients/detail/training?id=${clientId}`}
              className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
            >
              今日に戻る
            </Link>
          )}
        </div>
        {dates.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">記録のある日はまだありません。</p>
        ) : (
          <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto text-sm">
            {[...dates].reverse().map((day) => (
              <li key={day.recordedAt ?? "unknown"}>
                <Link
                  href={`/clients/detail/training?id=${clientId}&date=${day.recordedAt ?? "unknown"}`}
                  className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 hover:bg-gray-50 ${
                    day.recordedAt === date ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  <span>{day.recordedAt ?? "日付不明"}</span>
                  <span className="text-gray-600">
                    {day.exerciseCount}種目
                    <span className="ml-3 text-xs text-gray-400">
                      {day.exerciseNames.join("、")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-4">
          <h2 className="font-medium">{date ?? "日付不明"} の記録</h2>
          {date !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/clients/detail/training?id=${clientId}&date=${addDaysISODate(date, -1)}`}
                className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
              >
                ← 前日
              </Link>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (!e.target.value) return;
                  router.push(`/clients/detail/training?id=${clientId}&date=${e.target.value}`);
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <Link
                href={`/clients/detail/training?id=${clientId}&date=${addDaysISODate(date, 1)}`}
                className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
              >
                翌日 →
              </Link>
            </div>
          )}
        </div>
        {date === null && (
          <p className="border-b border-gray-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            実施日が分からない過去の記録です。行を編集して日付を入力すると、通常の記録に変わります。
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">種目</th>
                <th className="px-4 py-2">重さ</th>
                <th className="px-4 py-2">回数/秒数</th>
                <th className="px-4 py-2">セット数</th>
                <th className="px-4 py-2">メモ</th>
                <th className="sticky right-0 bg-white px-4 py-2 text-right text-xs font-normal text-gray-400">
                  行クリックで編集
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <TrainingLogRow key={log.id} log={log} clientId={clientId} exercises={exercises} />
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    この日の記録はまだありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">お客様が見つかりません。</p>
      <Link href="/clients" className="text-sm text-gray-900 underline">
        お客様一覧に戻る
      </Link>
    </div>
  );
}
