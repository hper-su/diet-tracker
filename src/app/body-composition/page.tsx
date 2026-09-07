import { BODY_METRICS } from "@/lib/body-metrics";

export default function BodyCompositionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">体組成ガイド</h1>
        <p className="mt-1 text-sm text-gray-600">
          体組成の各指標についての解説です。目安の基準値は複数の公表資料で広く紹介されている代表的な値であり、年齢・性別・測定機器によって幅があります。診断の根拠にはせず、参考情報としてご活用ください。
        </p>
      </div>

      <div className="space-y-4">
        {BODY_METRICS.map((metric) => (
          <section
            key={metric.key}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {metric.name}
              </h2>
              {metric.unit && (
                <span className="text-xs text-gray-400">({metric.unit})</span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-600">
              {metric.summary}
            </p>
            <p className="mt-2 text-sm text-gray-700">{metric.description}</p>

            {metric.referenceRows && (
              <div className="mt-3">
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {metric.referenceRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm"
                    >
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-semibold text-gray-900">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                {metric.referenceNote && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    {metric.referenceNote}
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
