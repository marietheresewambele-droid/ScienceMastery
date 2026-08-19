/**
 * Reusable, hand-drawn-style apparatus icons for required-practical diagrams.
 *
 * Every icon is drawn in a local coordinate system where (0, 0) is the
 * bottom-centre "footprint" of the object — the point that sits on the
 * bench line in PracticalDiagram. Icons extend upward (negative y) and
 * side to side (±60 units). Callers position an icon with a single
 * translate, e.g. <g transform={`translate(${x} ${y})`}><Beaker /></g>.
 *
 * Colours are drawn from the site's CSS custom properties so the diagrams
 * stay in lockstep with the rest of the design system.
 */

const INK = "var(--color-ink)";
const CARD = "var(--color-card)";
const CREAM_SOFT = "var(--color-cream-soft)";
const TEAL = "var(--color-teal)";
const TEAL_SOFT = "var(--color-teal-soft)";
const ORANGE = "var(--color-orange)";
const ORANGE_SOFT = "var(--color-orange-soft)";
const YELLOW = "var(--color-yellow)";
const YELLOW_SOFT = "var(--color-yellow-soft)";
const MOSS = "var(--color-moss)";
const MOSS_SOFT = "var(--color-moss-soft)";
const BROWN = "var(--color-brown)";

const STROKE = 3;

export function Beaker({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <path d="M -22 -58 L -26 -2 Q -26 6 -18 6 L 18 6 Q 26 6 26 -2 L 22 -58" fill={CARD} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -25 -20 L -25.5 -2 Q -25.5 4 -18 4 L 18 4 Q 25.5 4 25.5 -2 L 25 -20 Z" fill={liquid} stroke="none" />
      <path d="M -24 -58 L 24 -58" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M -22 -58 L -22 -64 M 22 -58 L 22 -64" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function ConicalFlask({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <path d="M -7 -58 L -7 -30 L -28 4 Q -30 8 -24 8 L 24 8 Q 30 8 28 4 L 7 -30 L 7 -58 Z" fill={CARD} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -18 -12 L -24 4 Q -26 8 -22 8 L 22 8 Q 26 8 24 4 L 18 -12 Z" fill={liquid} stroke="none" />
      <path d="M -10 -58 L 10 -58" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
    </g>
  );
}

export function TestTube({ liquid = TEAL_SOFT, rotate = 0 }: { liquid?: string; rotate?: number }) {
  return (
    <g transform={`rotate(${rotate})`}>
      <path d="M -11 -70 L -11 0 Q -11 12 0 12 Q 11 12 11 0 L 11 -70" fill={CARD} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -11 -18 L -11 0 Q -11 12 0 12 Q 11 12 11 0 L 11 -18 Z" fill={liquid} stroke="none" />
    </g>
  );
}

export function TestTubeRack({ count = 3 }: { count?: number }) {
  const spacing = 26;
  const start = -((count - 1) * spacing) / 2;
  const liquids = [TEAL_SOFT, YELLOW_SOFT, ORANGE_SOFT, MOSS_SOFT];
  return (
    <g>
      <rect x={start - 20} y={-14} width={(count - 1) * spacing + 40} height={14} rx={3} fill={BROWN} stroke={INK} strokeWidth={STROKE} />
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} transform={`translate(${start + i * spacing} -14)`}>
          <TestTube liquid={liquids[i % liquids.length]} />
        </g>
      ))}
    </g>
  );
}

export function PetriDish() {
  return (
    <g>
      <ellipse cx={0} cy={-6} rx={40} ry={12} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <ellipse cx={0} cy={-10} rx={34} ry={9} fill={MOSS_SOFT} stroke={INK} strokeWidth={2} />
      <circle cx={-14} cy={-10} r={4} fill={CARD} stroke={INK} strokeWidth={1.5} />
      <circle cx={10} cy={-8} r={4} fill={CARD} stroke={INK} strokeWidth={1.5} />
      <circle cx={2} cy={-13} r={4} fill={CARD} stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

export function Cup({ liquid = ORANGE_SOFT }: { liquid?: string }) {
  return (
    <g>
      <path d="M -20 -50 L -16 4 Q -16 10 -10 10 L 10 10 Q 16 10 16 4 L 20 -50 Z" fill={CREAM_SOFT} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -18 -50 L 18 -50" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M -17 -32 L -15 4 Q -15 8 -10 8 L 10 8 Q 15 8 15 4 L 17 -32 Z" fill={liquid} stroke="none" />
      <path d="M -14 -55 Q 0 -66 14 -55" fill="none" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function MeasuringCylinder({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <path d="M -12 -70 L -12 0 Q -12 10 0 10 Q 12 10 12 0 L 12 -70 Z" fill={CARD} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -12 -25 L -12 0 Q -12 10 0 10 Q 12 10 12 0 L 12 -25 Z" fill={liquid} stroke="none" />
      {[-55, -45, -35].map((y) => (
        <line key={y} x1={-12} y1={y} x2={-6} y2={y} stroke={INK} strokeWidth={1.5} />
      ))}
      <path d="M -16 -70 L 16 -70" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
    </g>
  );
}

export function BunsenBurner({ lit = true }: { lit?: boolean }) {
  return (
    <g>
      {lit && (
        <path d="M 0 -48 Q 9 -34 3 -24 Q 8 -20 0 -12 Q -8 -20 -3 -24 Q -9 -34 0 -48 Z" fill={ORANGE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      )}
      <rect x={-9} y={-30} width={18} height={30} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <path d="M -22 0 L 22 0 L 17 12 L -17 12 Z" fill={BROWN} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -9 -18 L -22 -14" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export function TripodGauze() {
  return (
    <g>
      <line x1={0} y1={-40} x2={-26} y2={4} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <line x1={0} y1={-40} x2={26} y2={4} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <line x1={0} y1={-40} x2={0} y2={4} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <rect x={-28} y={-44} width={56} height={8} fill={CREAM_SOFT} stroke={INK} strokeWidth={2} />
      {[-20, -8, 4, 16].map((x) => (
        <line key={x} x1={x} y1={-44} x2={x} y2={-36} stroke={INK} strokeWidth={1} />
      ))}
    </g>
  );
}

export function RetortStand({ clampHeight = -60 }: { clampHeight?: number }) {
  return (
    <g>
      <rect x={-30} y={2} width={60} height={8} fill={BROWN} stroke={INK} strokeWidth={STROKE} />
      <line x1={-22} y1={2} x2={-22} y2={-96} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <line x1={-22} y1={clampHeight} x2={6} y2={clampHeight} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <rect x={-2} y={clampHeight - 5} width={14} height={10} rx={2} fill={CARD} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function Thermometer() {
  return (
    <g>
      <rect x={-5} y={-70} width={10} height={58} rx={5} fill={CARD} stroke={INK} strokeWidth={2.5} />
      <circle cx={0} cy={-4} r={10} fill={ORANGE} stroke={INK} strokeWidth={2.5} />
      <rect x={-2.5} y={-40} width={5} height={38} fill={ORANGE} />
      {[-60, -50, -40].map((y) => (
        <line key={y} x1={5} y1={y} x2={9} y2={y} stroke={INK} strokeWidth={1.5} />
      ))}
    </g>
  );
}

export function Stopwatch() {
  return (
    <g>
      <rect x={-6} y={-72} width={12} height={6} fill={INK} />
      <circle cx={0} cy={-46} r={26} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <circle cx={0} cy={-46} r={19} fill="none" stroke={INK} strokeWidth={1.5} />
      <line x1={0} y1={-46} x2={0} y2={-58} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <line x1={0} y1={-46} x2={9} y2={-40} stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Ruler() {
  return (
    <g>
      <rect x={-55} y={-14} width={110} height={14} fill={YELLOW_SOFT} stroke={INK} strokeWidth={STROKE} />
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={i} x1={-50 + i * 10} y1={-14} x2={-50 + i * 10} y2={i % 5 === 0 ? -4 : -8} stroke={INK} strokeWidth={1.3} />
      ))}
    </g>
  );
}

export function Balance() {
  return (
    <g>
      <rect x={-34} y={-4} width={68} height={10} rx={2} fill={CREAM_SOFT} stroke={INK} strokeWidth={STROKE} />
      <rect x={-16} y={-30} width={32} height={26} fill={CARD} stroke={INK} strokeWidth={2.5} />
      <text x={0} y={-14} textAnchor="middle" fontSize={13} fontWeight={700} fill={INK}>0.0</text>
    </g>
  );
}

export function Microscope() {
  return (
    <g>
      <rect x={-30} y={0} width={60} height={8} rx={2} fill={BROWN} stroke={INK} strokeWidth={STROKE} />
      <path d="M -4 0 L -4 -20 Q -4 -50 22 -60" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <rect x={-16} y={-20} width={24} height={10} fill={CARD} stroke={INK} strokeWidth={2} />
      <circle cx={22} cy={-64} r={7} fill={CARD} stroke={INK} strokeWidth={2.5} />
      <rect x={-10} y={-4} width={20} height={5} fill={INK} />
    </g>
  );
}

export function PlantSeedling({ pot = MOSS_SOFT }: { pot?: string }) {
  return (
    <g>
      <path d="M -18 0 L -14 -26 L 14 -26 L 18 0 Z" fill={BROWN} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <line x1={0} y1={-26} x2={0} y2={-58} stroke={MOSS} strokeWidth={4} strokeLinecap="round" />
      <path d="M 0 -50 Q 18 -56 22 -40 Q 6 -40 0 -50" fill={pot} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 0 -40 Q -18 -46 -22 -30 Q -4 -30 0 -40" fill={pot} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

export function Quadrat() {
  return (
    <g>
      <rect x={-30} y={-30} width={60} height={30} fill="none" stroke={INK} strokeWidth={STROKE} />
      <line x1={-10} y1={-30} x2={-10} y2={0} stroke={INK} strokeWidth={1.5} />
      <line x1={10} y1={-30} x2={10} y2={0} stroke={INK} strokeWidth={1.5} />
      <line x1={-30} y1={-10} x2={30} y2={-10} stroke={INK} strokeWidth={1.5} />
      <path d="M -24 -6 Q -20 -16 -16 -6" fill="none" stroke={MOSS} strokeWidth={3} strokeLinecap="round" />
      <path d="M 2 -4 Q 6 -14 10 -4" fill="none" stroke={MOSS} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function FunnelFilterPaper() {
  return (
    <g>
      <path d="M -22 -50 L 22 -50 L 4 -8 L -4 -8 Z" fill={CREAM_SOFT} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -22 -50 L 22 -50 L 0 -14 Z" fill="none" stroke={INK} strokeWidth={1.5} />
      <line x1={0} y1={-8} x2={0} y2={2} stroke={INK} strokeWidth={STROKE} />
    </g>
  );
}

export function Dropper() {
  return (
    <g transform="rotate(20)">
      <path d="M -6 -60 L 6 -60 L 6 -20 Q 6 -6 0 0 Q -6 -6 -6 -20 Z" fill={CARD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={-7} y={-70} width={14} height={12} rx={3} fill={ORANGE} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function Burette({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <line x1={-24} y1={4} x2={-24} y2={-96} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <rect x={-30} y={0} width={40} height={8} fill={BROWN} stroke={INK} strokeWidth={2.5} />
      <rect x={-6} y={-92} width={12} height={70} fill={CARD} stroke={INK} strokeWidth={2.5} />
      <rect x={-6} y={-60} width={12} height={38} fill={liquid} />
      <path d="M -6 -22 L 6 -22 L 0 -10 Z" fill={CARD} stroke={INK} strokeWidth={2} />
      <line x1={-24} y1={-70} x2={-6} y2={-70} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

export function CircuitBoard() {
  return (
    <g>
      <rect x={-50} y={-52} width={100} height={44} rx={6} fill={CREAM_SOFT} stroke={INK} strokeWidth={STROKE} />
      <line x1={-38} y1={-30} x2={-20} y2={-30} stroke={INK} strokeWidth={2.5} />
      <rect x={-20} y={-38} width={16} height={16} fill={CARD} stroke={INK} strokeWidth={2} />
      <text x={-12} y={-27} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>A</text>
      <line x1={-4} y1={-30} x2={10} y2={-30} stroke={INK} strokeWidth={2.5} />
      <path d="M 10 -30 l 4 -6 l 4 8 l 4 -8 l 4 8 l 4 -8 l 4 6" fill="none" stroke={ORANGE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={30} y1={-30} x2={38} y2={-30} stroke={INK} strokeWidth={2.5} />
      <path d="M -38 -30 L -38 -10 L 38 -10 L 38 -30" fill="none" stroke={INK} strokeWidth={2.5} />
      <circle cx={0} cy={-10} r={11} fill={CARD} stroke={INK} strokeWidth={2} />
      <text x={0} y={-6} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>V</text>
      <rect x={-14} y={-58} width={6} height={12} fill={INK} />
      <rect x={8} y={-60} width={4} height={16} fill={INK} />
    </g>
  );
}

export function PowerSupplyBox() {
  return (
    <g>
      <rect x={-30} y={-46} width={60} height={46} rx={4} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <circle cx={-12} cy={-24} r={9} fill={CREAM_SOFT} stroke={INK} strokeWidth={2} />
      <circle cx={12} cy={-24} r={9} fill={CREAM_SOFT} stroke={INK} strokeWidth={2} />
      <line x1={-6} y1={2} x2={-6} y2={12} stroke={INK} strokeWidth={2.5} />
      <line x1={6} y1={2} x2={6} y2={12} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

export function ElectrolysisCell({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <path d="M -30 -50 L -30 4 Q -30 10 -22 10 L 22 10 Q 30 10 30 4 L 30 -50" fill={CARD} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M -29 -20 L -29 4 Q -29 8 -22 8 L 22 8 Q 29 8 29 4 L 29 -20 Z" fill={liquid} stroke="none" />
      <line x1={-12} y1={-58} x2={-12} y2={-14} stroke={INK} strokeWidth={2.5} />
      <line x1={12} y1={-58} x2={12} y2={-14} stroke={INK} strokeWidth={2.5} />
      <circle cx={-12} cy={-16} r={3} fill={CARD} stroke={INK} strokeWidth={1.5} />
      <circle cx={12} cy={-18} r={3} fill={CARD} stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

export function SpringMasses() {
  return (
    <g>
      <line x1={0} y1={-70} x2={0} y2={-50} stroke={INK} strokeWidth={2.5} />
      <path
        d="M 0 -50 q 10 6 0 12 q -10 6 0 12 q 10 6 0 12 q -10 6 0 12 q 10 6 0 12"
        fill="none"
        stroke={INK}
        strokeWidth={2.5}
      />
      <rect x={-13} y={8} width={26} height={14} fill={ORANGE_SOFT} stroke={INK} strokeWidth={2.5} />
      <rect x={-11} y={22} width={22} height={10} fill={ORANGE_SOFT} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function RampTrolley() {
  return (
    <g>
      <path d="M -50 4 L 30 -40 L 36 -30 L -44 14 Z" fill={CREAM_SOFT} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      <g transform="translate(-4 -20)">
        <rect x={-16} y={-12} width={32} height={12} rx={2} fill={ORANGE} stroke={INK} strokeWidth={2.5} />
        <circle cx={-9} cy={2} r={5} fill={CARD} stroke={INK} strokeWidth={2} />
        <circle cx={9} cy={2} r={5} fill={CARD} stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
}

export function LightGate() {
  return (
    <g>
      <rect x={-4} y={-50} width={8} height={50} fill={BROWN} stroke={INK} strokeWidth={2.5} />
      <rect x={-24} y={-64} width={48} height={16} rx={3} fill={CARD} stroke={INK} strokeWidth={2.5} />
      <circle cx={-14} cy={-56} r={3} fill={ORANGE} />
      <circle cx={14} cy={-56} r={3} fill={ORANGE} />
    </g>
  );
}

export function RayBox() {
  return (
    <g>
      <rect x={-30} y={-30} width={40} height={30} rx={3} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <circle cx={-10} cy={-15} r={5} fill={YELLOW} stroke={INK} strokeWidth={2} />
      <line x1={10} y1={-15} x2={70} y2={-15} stroke={ORANGE} strokeWidth={2.5} strokeDasharray="1 6" strokeLinecap="round" />
    </g>
  );
}

export function GlassBlock() {
  return (
    <g>
      <rect x={-30} y={-40} width={60} height={40} fill={TEAL_SOFT} stroke={INK} strokeWidth={STROKE} opacity={0.85} />
      <line x1={-30} y1={-40} x2={30} y2={-40} stroke={INK} strokeWidth={1.5} opacity={0.4} />
    </g>
  );
}

export function Protractor() {
  return (
    <g>
      <path d="M -30 0 A 30 30 0 0 1 30 0 Z" fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <line x1={-30} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={2} />
      {[-60, -30, 0, 30, 60].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg} x1={0} y1={0} x2={26 * Math.sin(rad)} y2={-26 * Math.cos(rad)} stroke={INK} strokeWidth={1} />;
      })}
    </g>
  );
}

export function LesliesCube() {
  return (
    <g>
      <rect x={-24} y={-48} width={48} height={48} fill={ORANGE_SOFT} stroke={INK} strokeWidth={STROKE} />
      <path d="M -24 -48 L -8 -60 L 40 -60 L 24 -48 Z" fill={CREAM_SOFT} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 24 -48 L 40 -60 L 40 -12 L 24 0 Z" fill={CARD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={-6} y1={-10} x2={-30} y2={-10} stroke={ORANGE} strokeWidth={2} strokeDasharray="1 5" />
    </g>
  );
}

export function Cube({ fill = CARD }: { fill?: string }) {
  return (
    <g>
      <rect x={-22} y={-44} width={44} height={44} fill={fill} stroke={INK} strokeWidth={STROKE} />
      <path d="M -22 -44 L -8 -56 L 36 -56 L 22 -44 Z" fill={CREAM_SOFT} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 22 -44 L 36 -56 L 36 -12 L 22 0 Z" fill={CARD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

export function HeaterBlock() {
  return (
    <g>
      <Cube fill={ORANGE_SOFT} />
      <line x1={2} y1={-44} x2={2} y2={-70} stroke={INK} strokeWidth={2.5} />
      <line x1={2} y1={-70} x2={30} y2={-70} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

export function CondenserFlask({ liquid = TEAL_SOFT }: { liquid?: string }) {
  return (
    <g>
      <ConicalFlask liquid={liquid} />
      <line x1={4} y1={-58} x2={40} y2={-72} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      <rect x={30} y={-88} width={44} height={18} rx={9} fill={CARD} stroke={INK} strokeWidth={2.5} transform="rotate(-18 30 -88)" />
      <TestTube liquid={liquid} />
    </g>
  );
}

export function GasSyringe() {
  return (
    <g>
      <rect x={-30} y={-14} width={50} height={16} fill={CARD} stroke={INK} strokeWidth={STROKE} />
      <rect x={-14} y={-11} width={26} height={10} fill={TEAL_SOFT} />
      <line x1={20} y1={-6} x2={44} y2={-6} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <rect x={-38} y={-16} width={10} height={20} fill={BROWN} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export const APPARATUS_ICONS = {
  beaker: Beaker,
  conicalFlask: ConicalFlask,
  testTube: TestTube,
  testTubeRack: TestTubeRack,
  petriDish: PetriDish,
  cup: Cup,
  measuringCylinder: MeasuringCylinder,
  bunsenBurner: BunsenBurner,
  tripodGauze: TripodGauze,
  retortStand: RetortStand,
  thermometer: Thermometer,
  stopwatch: Stopwatch,
  ruler: Ruler,
  balance: Balance,
  microscope: Microscope,
  plantSeedling: PlantSeedling,
  quadrat: Quadrat,
  funnelFilterPaper: FunnelFilterPaper,
  dropper: Dropper,
  burette: Burette,
  circuitBoard: CircuitBoard,
  powerSupplyBox: PowerSupplyBox,
  electrolysisCell: ElectrolysisCell,
  springMasses: SpringMasses,
  rampTrolley: RampTrolley,
  lightGate: LightGate,
  rayBox: RayBox,
  glassBlock: GlassBlock,
  protractor: Protractor,
  lesliesCube: LesliesCube,
  cube: Cube,
  heaterBlock: HeaterBlock,
  condenserFlask: CondenserFlask,
  gasSyringe: GasSyringe,
} as const;

export type ApparatusIconKey = keyof typeof APPARATUS_ICONS;
