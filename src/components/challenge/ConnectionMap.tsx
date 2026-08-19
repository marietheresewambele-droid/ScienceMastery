"use client";

import type { ChallengeConnection } from "@/types/challenge";

interface ConnectionMapProps {
  connections: ChallengeConnection[];
  selfMarks: Record<string, boolean>;
  onMark: (connectionId: string, made: boolean) => void;
}

function ConnectionChain({ targetLink, made }: { targetLink: string; made: boolean | undefined }) {
  const nodes = targetLink.split(/\s*→\s*/).filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {nodes.map((node, index) => (
        <span key={index} className="flex items-center gap-2">
          <span
            className={`rounded-md border-2 border-ink px-3 py-1.5 text-sm font-bold ${
              made === true
                ? "bg-moss-soft text-moss-dark"
                : made === false
                  ? "bg-orange-soft text-orange-dark"
                  : "bg-card text-ink"
            }`}
          >
            {node}
          </span>
          {index < nodes.length - 1 && (
            <svg className="h-4 w-4 shrink-0 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}

export default function ConnectionMap({ connections, selfMarks, onMark }: ConnectionMapProps) {
  const madeCount = connections.filter((connection) => selfMarks[connection.id]).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-ink">Connection map</h3>
        <span className="rounded-md border-2 border-ink bg-ink px-4 py-1.5 text-sm font-bold text-cream">
          Connections made: {madeCount}/{connections.length}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full border-2 border-ink bg-cream-soft">
        <div
          className="h-full rounded-full bg-orange transition-all"
          style={{ width: `${(madeCount / connections.length) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        For each link below, be honest about whether your final answer actually made this causal connection — not just mentioned both ideas.
      </p>

      <div className="mt-6 space-y-4">
        {connections.map((connection, index) => {
          const mark = selfMarks[connection.id];
          return (
            <article
              key={connection.id}
              className={`rounded-2xl border-2 border-ink p-5 transition ${
                mark === true
                  ? "bg-moss-soft"
                  : mark === false
                    ? "bg-orange-soft"
                    : "bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-dark">
                  {index + 1}. {connection.concept}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onMark(connection.id, true)}
                    className={`rounded-lg border-2 border-ink px-3 py-1.5 text-xs font-bold transition ${
                      mark === true ? "bg-moss text-white" : "bg-card text-ink-soft hover:bg-moss-soft"
                    }`}
                  >
                    I made this link
                  </button>
                  <button
                    type="button"
                    onClick={() => onMark(connection.id, false)}
                    className={`rounded-lg border-2 border-ink px-3 py-1.5 text-xs font-bold transition ${
                      mark === false ? "bg-orange-dark text-white" : "bg-card text-ink-soft hover:bg-orange-soft"
                    }`}
                  >
                    I missed this
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <ConnectionChain targetLink={connection.targetLink} made={mark} />
              </div>

              <details className="mt-3 text-sm text-ink-soft">
                <summary className="cursor-pointer font-semibold text-ink-soft">Show evidence</summary>
                <p className="mt-2 leading-6">{connection.evidenceRequired}</p>
              </details>

              {mark !== undefined && (
                <p className={`mt-3 text-sm leading-6 ${mark ? "text-moss-dark" : "text-orange-dark"}`}>
                  {mark ? connection.successFeedback : connection.missingFeedback}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
