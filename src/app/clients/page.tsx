"use client";

import Link from "next/link";
import { useLiveQuery } from "@/lib/db/use-live-query";
import {
  listClientsByRecentActivity,
  subscribeToClients,
} from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { isBirthdayToday } from "@/lib/health/age";
import { NewClientForm } from "./new-client-form";

const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export default function ClientsPage() {
  const clients = useLiveQuery(
    () => listClientsByRecentActivity(),
    [],
    [subscribeToClients],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">お客様一覧</h1>

      <NewClientForm />

      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {clients?.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/detail?id=${client.id}`}
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 ${
                client.hasMeasurements ? "" : "bg-amber-50"
              }`}
            >
              <div className="min-w-0">
                <span className="font-medium">
                  {formatClientName(client.name)}
                </span>
                {client.birthdate && isBirthdayToday(client.birthdate) && (
                  <span title="本日お誕生日です" className="ml-1">
                    🎂
                  </span>
                )}
                {!client.hasMeasurements && (
                  <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900">
                    体重データ未登録
                  </span>
                )}
                {client.gender && (
                  <span className="ml-2 text-xs text-gray-500">
                    {GENDER_LABELS[client.gender]}
                  </span>
                )}
                {client.memo && (
                  <p className="text-xs break-words text-gray-500">
                    {client.memo}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {client.birthdate ?? ""}
                {client.heightCm ? ` ・ ${client.heightCm}cm` : ""}
              </span>
            </Link>
          </li>
        ))}
        {clients?.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            まだお客様が登録されていません。
          </li>
        )}
      </ul>
    </div>
  );
}
