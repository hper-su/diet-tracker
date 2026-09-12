"use client";

import { useRef, useState } from "react";
import { exportAllData, importAllData, ImportFormatError } from "@/lib/db/import-export";

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function DataPage() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `diet-tracker-export-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "エクスポートが完了しました。" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setStatus({ type: "idle" });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importAllData(parsed);
      setStatus({
        type: "success",
        message: "インポートが完了しました。既存のデータは置き換えられました。",
      });
    } catch (error) {
      const message =
        error instanceof ImportFormatError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      setStatus({ type: "error", message });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">データ管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          このアプリのデータは、どの端末からでも同じ内容が見られるようクラウド上の共有データベースに
          保存されています(利用にはインターネット接続が必要です)。この画面のエクスポート/インポートは、
          バックアップの保存や、万一のトラブル時に共有データベースの内容を丸ごと復元するために使います。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">エクスポート</h2>
        <p className="mt-1 text-sm text-gray-600">
          お客様・測定記録・食事記録・食品マスタなど、全データを1つのJSONファイルとして保存します。
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          データをエクスポート
        </button>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">インポート</h2>
        <p className="mt-1 text-sm text-gray-600">
          エクスポートしたJSONファイルを選択すると、共有データベースの現在のデータを置き換えます。
          この変更は全端末に反映されます(この操作は元に戻せません。必要であれば先に現在のデータを
          エクスポートしてください)。
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          disabled={importing}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
          }}
          className="mt-4 block text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
        />
        {importing && <p className="mt-2 text-sm text-gray-500">インポート中…</p>}
      </section>

      {status.type !== "idle" && (
        <p
          className={
            status.type === "success"
              ? "text-sm text-green-700"
              : "text-sm text-red-600"
          }
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
