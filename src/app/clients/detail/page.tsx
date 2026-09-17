"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "@/lib/db/use-live-query";
import { getClient, subscribeToClients } from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { listMeasurements, subscribeToMeasurements } from "@/lib/db/measurements";
import { listProtocolChecks, subscribeToProtocolChecks } from "@/lib/db/protocol-checks";
import { findLatestNonNull } from "@/lib/health/measurements";
import { projectWeightAchievement } from "@/lib/health/weight-projection";
import { ClientTabs } from "./client-tabs";
import { ProfileForm } from "./profile-form";
import { MeasurementForm } from "./measurement-form";
import { MeasurementChart, type MeasurementPoint } from "./measurement-chart";
import { MeasurementRow } from "./measurement-row";
import { ProtocolCheckForm } from "./protocol-check-form";
import { ProtocolCheckHistory } from "./protocol-check-history";

export default function ClientDetailPage() {
  return (
    <Suspense>
      <ClientDetailPageInner />
    </Suspense>
  );
}

function ClientDetailPageInner() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("id") ?? "";

  const data = useLiveQuery(async () => {
    const client = await getClient(clientId);
    const [measurements, protocolChecks] = client
      ? await Promise.all([
          listMeasurements(clientId),
          listProtocolChecks(clientId),
        ])
      : [[], []];
    return { client, measurements, protocolChecks };
  }, [clientId], [
    subscribeToClients,
    (cb) => subscribeToMeasurements(clientId, cb),
    (cb) => subscribeToProtocolChecks(clientId, cb),
  ]);

  if (!clientId) {
    return <NotFound />;
  }

  if (!data) {
    return null;
  }

  const { client, measurements, protocolChecks } = data;

  if (!client) {
    return <NotFound />;
  }

  const chartData: MeasurementPoint[] = measurements.map((m) => ({
    recordedAt: m.recordedAt,
    weightKg: m.weightKg,
    bodyFatPct: m.bodyFatPct,
    projectedWeightKg: null,
  }));

  const latestWeight = findLatestNonNull(measurements, "weightKg");
  const projection =
    latestWeight?.weightKg != null &&
    client.targetWeightKg != null &&
    client.targetMonthlyWeightChangeKg != null
      ? projectWeightAchievement({
          latestWeightKg: Number(latestWeight.weightKg),
          latestDate: latestWeight.recordedAt,
          monthlyRateKg: client.targetMonthlyWeightChangeKg,
          targetWeightKg: client.targetWeightKg,
        })
      : null;

  if (projection && latestWeight) {
    const latestRow = chartData.find(
      (row) => row.recordedAt === latestWeight.recordedAt,
    );
    if (latestRow) {
      latestRow.projectedWeightKg = latestRow.weightKg;
    }
    if (projection.achievementDate !== latestWeight.recordedAt) {
      chartData.push({
        recordedAt: projection.achievementDate,
        weightKg: null,
        bodyFatPct: null,
        projectedWeightKg: client.targetWeightKg,
      });
      // 追加した予測到達点は必ずしも配列末尾の日付より新しいとは限らない
      // (体重を伴わない直近の記録が別途あるケースなど)。Rechartsはカテゴリ軸を
      // 配列順に描画するため、日付順を保つよう並べ直す。
      chartData.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    }
  }

  return (
    <div className="space-y-6">
      <ClientTabs id={client.id} active="profile" />

      <div>
        <h1 className="text-lg font-semibold">
          {formatClientName(client.name)}
        </h1>
        {client.memo && <p className="text-sm text-gray-500">{client.memo}</p>}
      </div>

      <ProfileForm key={client.id} client={client} />

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-medium">体重・体脂肪率の推移</h2>
        <MeasurementChart data={chartData} targetWeightKg={client.targetWeightKg} />
        {client.targetWeightKg != null && (
          <p className="mt-2 text-xs text-gray-500">
            {projection ? (
              <>
                現在のペース(月{client.targetMonthlyWeightChangeKg}kg)なら、目標体重
                {client.targetWeightKg}kgに到達するのは
                <span className="font-medium text-gray-700">
                  {" "}
                  {projection.achievementDate}{" "}
                </span>
                頃の見込みです。
              </>
            ) : (
              "現在のペースでは目標体重に近づいていません。「プラン」タブで目標体重変化の向きを確認してください。"
            )}
          </p>
        )}
      </section>

      <MeasurementForm clientId={client.id} heightCm={client.heightCm} />

      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 p-4 font-medium">記録履歴</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">日付</th>
                <th className="px-4 py-2">体重(kg)</th>
                <th className="px-4 py-2">BMI</th>
                <th className="px-4 py-2">体脂肪率(%)</th>
                <th className="px-4 py-2">筋肉量(kg)</th>
                <th className="px-4 py-2">体水分率(%)</th>
                <th className="px-4 py-2">内臓脂肪</th>
                <th className="px-4 py-2">基礎代謝(kcal)</th>
                <th className="px-4 py-2">メモ</th>
                <th className="sticky right-0 bg-white px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m) => (
                <MeasurementRow
                  key={m.id}
                  measurement={m}
                  clientId={client.id}
                  heightCm={client.heightCm}
                />
              ))}
              {measurements.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                    まだ記録がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ProtocolCheckForm clientId={client.id} />

      <ProtocolCheckHistory clientId={client.id} checks={protocolChecks} />
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
