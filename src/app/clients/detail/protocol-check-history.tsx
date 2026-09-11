"use client";

import { getProtocolCondition } from "@/lib/conditions";
import type { ProtocolCheck } from "@/lib/db/protocol-checks";
import { deleteProtocolCheckAction } from "./protocol-check-actions";

export function ProtocolCheckHistory({
  clientId,
  checks,
}: {
  clientId: number;
  checks: ProtocolCheck[];
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <h2 className="border-b border-gray-200 p-4 font-medium">
        動作チェック履歴
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-4 py-2">日付</th>
              <th className="px-4 py-2">症状</th>
              <th className="px-4 py-2">結果</th>
              <th className="px-4 py-2">メモ</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {[...checks].reverse().map((check) => {
              const condition = getProtocolCondition(check.conditionId);
              return (
                <tr key={check.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {check.recordedAt}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {condition?.symptomLabel ?? "(不明な項目)"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {check.results.map((result) => (
                        <span
                          key={result.step}
                          title={
                            condition?.protocolTable[result.step]?.step ?? ""
                          }
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                            result.achieved
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.step + 1}
                          {result.achieved ? "○" : "✕"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {check.memo ?? ""}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteProtocolCheckAction}>
                      <input type="hidden" name="id" value={check.id} />
                      <input
                        type="hidden"
                        name="client_id"
                        value={clientId}
                      />
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {checks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  まだ記録がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
