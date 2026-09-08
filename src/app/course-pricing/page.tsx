import { COURSE_PLANS, PRICING_FOOTNOTE } from "@/lib/course-pricing";

export default function CoursePricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">1回あたりのコース料金</h1>
        <p className="mt-1 text-sm text-gray-600">
          コースごとの1回あたりの料金です。
        </p>
      </div>

      <div className="space-y-4">
        {COURSE_PLANS.map((plan) => (
          <section
            key={plan.key}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <h2 className="font-semibold text-gray-900">{plan.name}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2">期間</th>
                    <th className="px-3 py-2">回数</th>
                    <th className="px-3 py-2">コース料金</th>
                    <th className="px-3 py-2">1回あたり</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.fees.map((fee) => (
                    <tr key={fee.monthsLabel} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {fee.monthsLabel}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{fee.sessions}回</td>
                      <td className="px-3 py-2 text-gray-700">
                        {fee.totalFee.toLocaleString()}円
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {fee.perSession.toLocaleString()}円
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-700">{plan.note}</p>
          </section>
        ))}
      </div>

      <p className="text-xs text-gray-500">{PRICING_FOOTNOTE}</p>
    </div>
  );
}
