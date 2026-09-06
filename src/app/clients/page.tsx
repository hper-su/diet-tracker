"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { listClients } from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { NewClientForm } from "./new-client-form";

const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export default function ClientsPage() {
  const clients = useLiveQuery(() => listClients(), []);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">お客様一覧</h1>

      <NewClientForm />

      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {clients?.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/detail?id=${client.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <span className="font-medium">
                  {formatClientName(client.name)}
                </span>
                {client.gender && (
                  <span className="ml-2 text-xs text-gray-500">
                    {GENDER_LABELS[client.gender]}
                  </span>
                )}
                {client.memo && (
                  <p className="text-xs text-gray-500">{client.memo}</p>
                )}
              </div>
              <span className="text-xs text-gray-400">
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
