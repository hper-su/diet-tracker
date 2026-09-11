// 動作チェックプロトコルの各ステップに出てくる「SLR」「キャット&ドッグ」等の
// 専門用語を、簡易的な棒人間アイコンで補足するための最小限のピクトグラム集。
// 写実的な絵ではなく、動作のイメージを掴むための簡略化した線画。

export type MovementIconId =
  | "supine-knee-hug"
  | "quadruped-cat-dog"
  | "supine-knee-roll"
  | "plank-bracing"
  | "standing-trunk-bend"
  | "hip-hinge"
  | "quad-set"
  | "supine-slr"
  | "seated-knee-extend"
  | "shallow-squat"
  | "lunge-side-step"
  | "shoulder-rom"
  | "overhead-raise"
  | "isometric-shoulder-resistance"
  | "shoulder-press-row"
  | "neck-rom"
  | "chin-tuck";

export const MOVEMENT_ICON_LABELS: Record<MovementIconId, string> = {
  "supine-knee-hug": "仰向け膝抱え込み",
  "quadruped-cat-dog": "四つ這いキャット&ドッグ",
  "supine-knee-roll": "仰向けニーロール",
  "plank-bracing": "プランク(ドローイン・ブレーシング)",
  "standing-trunk-bend": "立位での体幹の前屈・後屈・回旋",
  "hip-hinge": "ヒップヒンジ(お尻を後ろに引く動き)",
  "quad-set": "パテラセッティング(膝を伸ばしたまま力を入れる)",
  "supine-slr": "仰向けSLR(仰向けで片脚を伸ばしたまま持ち上げる)",
  "seated-knee-extend": "座位での膝の曲げ伸ばし",
  "shallow-squat": "浅いスクワット",
  "lunge-side-step": "ランジ・サイドステップ",
  "shoulder-rom": "肩を上げる・回す可動域チェック",
  "overhead-raise": "バンザイ動作(両手を上げる)",
  "isometric-shoulder-resistance": "肩を軽い力で押し合う(動かさない)",
  "shoulder-press-row": "ショルダープレス・ローイングの構え",
  "neck-rom": "首を倒す・回す可動域チェック",
  "chin-tuck": "チンタック(あごを引く)",
};

const STROKE = "#4b5563";
const JOINT = "#4b5563";
const ARROW = "#e11d48";

function Fig(props: React.SVGProps<SVGGElement>) {
  return (
    <g
      stroke={STROKE}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...props}
    />
  );
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={5} fill={JOINT} />;
}

function Ground({ y = 52 }: { y?: number }) {
  return (
    <line
      x1={4}
      y1={y}
      x2={56}
      y2={y}
      stroke="#d1d5db"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

// 仰向け(supine)ポーズ用: 寝ている土台をはっきり示すマット状の帯。
// 単なる線だと「立っている図」との区別がつきにくいための補強。
function Mat({ y }: { y: number }) {
  return <rect x={3} y={y} width={54} height={5} rx={2.5} fill="#e5e7eb" />;
}

function Arrow(props: React.SVGProps<SVGPathElement>) {
  return (
    <path
      stroke={ARROW}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...props}
    />
  );
}

const ICON_CONTENT: Record<MovementIconId, React.ReactNode> = {
  "supine-knee-hug": (
    <>
      <Mat y={44} />
      <Head cx={11} cy={40} />
      <Fig>
        <line x1={16} y1={41} x2={28} y2={41} />
        <line x1={28} y1={41} x2={21} y2={21} />
        <line x1={21} y1={21} x2={26} y2={33} />
        <line x1={18} y1={41} x2={24} y2={29} />
      </Fig>
    </>
  ),
  "quadruped-cat-dog": (
    <>
      <Ground y={48} />
      <Head cx={14} cy={30} />
      <Fig>
        <line x1={18} y1={32} x2={42} y2={39} />
        <line x1={18} y1={32} x2={18} y2={48} />
        <line x1={42} y1={39} x2={42} y2={48} />
      </Fig>
      <Arrow d="M28 22 L28 33" />
      <Arrow d="M25 24 L28 21 L31 24" />
      <Arrow d="M25 31 L28 34 L31 31" />
    </>
  ),
  "supine-knee-roll": (
    <>
      <Mat y={44} />
      <Head cx={11} cy={40} />
      <Fig>
        <line x1={16} y1={41} x2={29} y2={41} />
        <line x1={29} y1={41} x2={40} y2={30} />
        <line x1={40} y1={30} x2={30} y2={22} />
      </Fig>
      <Arrow d="M42 18 Q50 22 46 29" />
      <Arrow d="M44 15 L42 18 L46 20" />
    </>
  ),
  "plank-bracing": (
    <>
      <Ground y={48} />
      <Head cx={14} cy={34} />
      <Fig>
        <line x1={18} y1={36} x2={46} y2={40} />
        <line x1={18} y1={36} x2={18} y2={48} />
        <line x1={46} y1={40} x2={46} y2={48} />
      </Fig>
      <Fig strokeWidth={5}>
        <line x1={30} y1={36.5} x2={34} y2={37.5} />
      </Fig>
    </>
  ),
  "standing-trunk-bend": (
    <>
      <Ground />
      <Head cx={22} cy={22} />
      <Fig>
        <line x1={22} y1={27} x2={30} y2={35} />
        <line x1={30} y1={35} x2={22} y2={52} />
        <line x1={30} y1={35} x2={38} y2={52} />
        <line x1={24} y1={29} x2={14} y2={26} />
      </Fig>
      <Arrow d="M40 14 Q48 24 30 35" />
      <Arrow d="M35 15 L40 13 L41 19" />
    </>
  ),
  "hip-hinge": (
    <>
      <Ground />
      <Head cx={16} cy={26} />
      <Fig>
        <line x1={17} y1={30} x2={30} y2={35} />
        <line x1={30} y1={35} x2={26} y2={52} />
        <line x1={30} y1={35} x2={37} y2={52} />
        <line x1={18} y1={29} x2={13} y2={44} />
      </Fig>
      <Arrow d="M8 46 L13 44" />
      <Arrow d="M10 41 L13 44 L15 40" />
    </>
  ),
  "quad-set": (
    <>
      <line x1={10} y1={41} x2={54} y2={41} stroke="#d1d5db" strokeWidth={2} />
      <Head cx={10} cy={37} />
      <Fig>
        <line x1={15} y1={39} x2={26} y2={41} />
        <line x1={26} y1={41} x2={50} y2={41} />
      </Fig>
      <Arrow d="M38 30 L38 38" />
      <Arrow d="M35 34 L38 39 L41 34" />
      <Arrow d="M30 25 L33 29" />
      <Arrow d="M46 25 L43 29" />
    </>
  ),
  "supine-slr": (
    <>
      <Mat y={44} />
      <Head cx={9} cy={40} />
      <Fig>
        <line x1={14} y1={41} x2={28} y2={41} />
        <line x1={28} y1={41} x2={46} y2={41} />
        <line x1={28} y1={41} x2={28} y2={19} />
      </Fig>
      <Arrow d="M36 34 L36 22" />
      <Arrow d="M33 26 L36 21 L39 26" />
    </>
  ),
  "seated-knee-extend": (
    <>
      <line x1={22} y1={34} x2={46} y2={34} stroke="#d1d5db" strokeWidth={2} />
      <Head cx={30} cy={14} />
      <Fig>
        <line x1={30} y1={19} x2={30} y2={34} />
        <line x1={30} y1={34} x2={46} y2={34} />
        <line x1={46} y1={34} x2={46} y2={50} />
      </Fig>
      <Arrow d="M46 48 Q54 42 52 32" />
      <Arrow d="M48 33 L52 31 L53 35" />
    </>
  ),
  "shallow-squat": (
    <>
      <Ground />
      <Head cx={30} cy={14} />
      <Fig>
        <line x1={30} y1={19} x2={30} y2={34} />
        <line x1={30} y1={34} x2={22} y2={42} />
        <line x1={22} y1={42} x2={20} y2={52} />
        <line x1={30} y1={34} x2={38} y2={42} />
        <line x1={38} y1={42} x2={40} y2={52} />
        <line x1={30} y1={22} x2={18} y2={26} />
        <line x1={30} y1={22} x2={42} y2={26} />
      </Fig>
    </>
  ),
  "lunge-side-step": (
    <>
      <Ground />
      <Head cx={30} cy={14} />
      <Fig>
        <line x1={30} y1={19} x2={30} y2={35} />
        <line x1={30} y1={35} x2={30} y2={52} />
        <line x1={30} y1={35} x2={48} y2={48} />
        <line x1={30} y1={20} x2={20} y2={26} />
        <line x1={30} y1={20} x2={40} y2={26} />
      </Fig>
      <Arrow d="M34 40 L46 47" />
      <Arrow d="M42 43 L46 47 L41 48" />
    </>
  ),
  "shoulder-rom": (
    <>
      <Ground />
      <Head cx={30} cy={12} />
      <Fig>
        <line x1={30} y1={17} x2={30} y2={35} />
        <line x1={30} y1={35} x2={24} y2={52} />
        <line x1={30} y1={35} x2={36} y2={52} />
        <line x1={30} y1={20} x2={22} y2={32} />
        <line x1={30} y1={20} x2={46} y2={14} />
      </Fig>
      <Arrow d="M40 8 Q48 12 44 20" />
    </>
  ),
  "overhead-raise": (
    <>
      <Ground />
      <Head cx={30} cy={12} />
      <Fig>
        <line x1={30} y1={17} x2={30} y2={35} />
        <line x1={30} y1={35} x2={24} y2={52} />
        <line x1={30} y1={35} x2={36} y2={52} />
        <line x1={30} y1={19} x2={18} y2={4} />
        <line x1={30} y1={19} x2={42} y2={4} />
      </Fig>
    </>
  ),
  "isometric-shoulder-resistance": (
    <>
      <Ground />
      <line x1={46} y1={18} x2={46} y2={32} stroke="#d1d5db" strokeWidth={3} />
      <Head cx={30} cy={12} />
      <Fig>
        <line x1={30} y1={17} x2={30} y2={35} />
        <line x1={30} y1={35} x2={24} y2={52} />
        <line x1={30} y1={35} x2={36} y2={52} />
        <line x1={30} y1={20} x2={22} y2={30} />
        <line x1={30} y1={19} x2={38} y2={24} />
        <line x1={38} y1={24} x2={46} y2={25} />
      </Fig>
      <Arrow d="M40 30 L43 27" />
      <Arrow d="M40 34 L43 31" />
    </>
  ),
  "shoulder-press-row": (
    <>
      <Ground />
      <Head cx={30} cy={12} />
      <Fig>
        <line x1={30} y1={17} x2={30} y2={35} />
        <line x1={30} y1={35} x2={24} y2={52} />
        <line x1={30} y1={35} x2={36} y2={52} />
        <line x1={30} y1={19} x2={20} y2={24} />
        <line x1={20} y1={24} x2={20} y2={10} />
        <line x1={30} y1={19} x2={40} y2={24} />
        <line x1={40} y1={24} x2={40} y2={10} />
      </Fig>
    </>
  ),
  "neck-rom": (
    <>
      <Head cx={30} cy={14} />
      <Fig>
        <line x1={30} y1={19} x2={30} y2={40} />
      </Fig>
      <Arrow d="M16 8 Q30 2 44 8" />
      <Arrow d="M19 6 L16 8 L18 11" />
      <Arrow d="M41 6 L44 8 L42 11" />
      <Arrow d="M30 20 L30 27" />
      <Arrow d="M27 24 L30 28 L33 24" />
    </>
  ),
  "chin-tuck": (
    <>
      <Head cx={33} cy={16} />
      <Fig>
        <line x1={33} y1={21} x2={29} y2={21} />
        <line x1={31} y1={21} x2={30} y2={32} />
        <line x1={30} y1={32} x2={30} y2={40} />
      </Fig>
      <Arrow d="M46 16 L38 16" />
      <Arrow d="M41 13 L38 16 L41 19" />
    </>
  ),
};

export function MovementIcon({
  id,
  size = 40,
  className,
}: {
  id: MovementIconId;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={MOVEMENT_ICON_LABELS[id]}
    >
      {ICON_CONTENT[id]}
    </svg>
  );
}
