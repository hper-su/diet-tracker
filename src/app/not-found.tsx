import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        ページが見つかりません
      </h1>
      <p className="text-sm text-gray-500">
        お探しのページは存在しないか、URLが正しくない可能性があります。
      </p>
      <Link
        href="/"
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        ダッシュボードに戻る
      </Link>
    </div>
  );
}
