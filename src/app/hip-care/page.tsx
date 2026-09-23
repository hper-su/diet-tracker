import {
  PAGE_SUBTITLE,
  WHY_IMPORTANT_PARAGRAPHS,
  STRETCH_GUIDES,
  STRETCH_NOTE,
  MUSCLE_GROUPS,
  TRAINING_MENU,
  DESK_WORKER_TIPS,
  CLOSING_NOTE,
} from "@/lib/hip-care";

export default function HipCarePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">股関節ケアガイド</h1>
        <p className="mt-1 text-sm text-gray-600">{PAGE_SUBTITLE}</p>
      </div>

      <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <h2 className="font-semibold text-gray-900">股関節がなぜ大切なのか</h2>
        {WHY_IMPORTANT_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="text-xs text-gray-500">
          股関節の柔軟性・左右差のセルフチェックは、お客様の概要タブの「動作チェック」から
          「股関節に違和感がある」を選ぶと記録できます。
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">部位別ストレッチ方法</h2>
        <p className="mt-1 text-sm text-gray-700">
          動作チェックで硬さや左右差を感じた部位は、下記のストレッチで重点的にケアしましょう。
          入浴後や運動後など、筋肉が温まっているタイミングで行うとより効果的です。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2">部位</th>
                <th className="px-3 py-2">ストレッチ方法</th>
                <th className="px-3 py-2">ポイント</th>
              </tr>
            </thead>
            <tbody>
              {STRETCH_GUIDES.map((g) => (
                <tr key={g.part} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{g.part}</td>
                  <td className="px-3 py-2 text-gray-700">{g.method}</td>
                  <td className="px-3 py-2 text-gray-700">{g.point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">※ {STRETCH_NOTE}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">股関節を支える23の筋肉</h2>
        <p className="mt-1 text-sm text-gray-700">
          股関節まわりには約23個の筋肉が関わり、それぞれが異なる役割を担っています。ここでは代表的な筋肉を部位別にまとめました。
        </p>
        <div className="mt-3 space-y-4">
          {MUSCLE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-gray-900">{group.title}</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2">筋肉名(読み方)</th>
                      <th className="px-3 py-2">はたらき</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.muscles.map((m) => (
                      <tr key={m.name} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                          {m.name}
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            ({m.reading})
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{m.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">股関節を整える筋力トレーニング</h2>
        <div className="mt-3 space-y-3">
          {TRAINING_MENU.map((item) => (
            <div key={item.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="mt-1 text-sm text-gray-700">{item.method}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">デスクワーカーへのおすすめ習慣</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {DESK_WORKER_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
