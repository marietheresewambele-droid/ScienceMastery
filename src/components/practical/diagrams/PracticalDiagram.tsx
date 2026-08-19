"use client";

/**
 * Renders a labelled "bench scene" diagram of the apparatus set-up for a
 * required practical — a row of hand-drawn-style apparatus icons sitting on
 * a bench line, each with a yellow callout label connected by a leader
 * line. Styled after exam-board apparatus diagrams (e.g. Save My Exams)
 * but built entirely from the site's own icon library and design tokens so
 * it stays visually consistent with the rest of ScienceMastery.
 */
import { APPARATUS_ICONS, type ApparatusIconKey } from "./apparatusIcons";

export interface DiagramItem {
  icon: ApparatusIconKey;
  label: string;
  // Icon components each accept their own small set of optional visual
  // props (liquid colour, rotation, lit, etc). Diagram specs are
  // hand-authored data, so we keep this loose rather than unioning every
  // icon's prop type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: any;
}

interface PracticalDiagramProps {
  items: DiagramItem[];
  caption?: string;
}

const SLOT_WIDTH = 148;
const PADDING_X = 76;
const TOP = -132;
const VIEW_HEIGHT = 236;

export default function PracticalDiagram({ items, caption }: PracticalDiagramProps) {
  if (!items || items.length === 0) return null;

  const width = items.length * SLOT_WIDTH + PADDING_X * 2;

  return (
    <div className="sm-panel overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-dark">Apparatus set-up</p>
        <span className="rounded-md border-2 border-ink bg-teal-soft px-3 py-1 text-xs font-bold text-teal-dark">Diagram</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 ${TOP} ${width} ${VIEW_HEIGHT}`}
          className="mx-auto h-auto w-full min-w-[520px] max-w-3xl"
          role="img"
          aria-label={caption ?? `Diagram of the apparatus set-up: ${items.map((item) => item.label).join(", ")}`}
        >
          <line
            x1={PADDING_X - 34}
            y1={0}
            x2={width - PADDING_X + 34}
            y2={0}
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <rect
            x={PADDING_X - 34}
            y={3}
            width={width - (PADDING_X - 34) * 2}
            height={9}
            rx={4}
            fill="var(--color-brown)"
            opacity={0.35}
          />

          {items.map((item, index) => {
            const Icon = APPARATUS_ICONS[item.icon];
            const x = PADDING_X + SLOT_WIDTH * (index + 0.5);
            if (!Icon) return null;
            return (
              <g key={`${item.icon}-${index}`}>
                <g transform={`translate(${x} 0)`}>
                  <Icon {...(item.props ?? {})} />
                </g>
                <line
                  x1={x}
                  y1={6}
                  x2={x}
                  y2={30}
                  stroke="var(--color-ink)"
                  strokeWidth={2}
                  strokeDasharray="2 5"
                  strokeLinecap="round"
                />
                <foreignObject x={x - 66} y={30} width={132} height={66}>
                  <div className="mx-auto flex h-full max-w-[8rem] items-center justify-center rounded-lg border-2 border-ink bg-yellow px-2 py-1 text-center text-[11px] font-bold leading-tight text-ink">
                    {item.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {caption && <p className="mt-4 text-sm leading-6 text-ink-soft">{caption}</p>}
    </div>
  );
}
