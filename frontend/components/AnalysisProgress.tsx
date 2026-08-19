'use client';

import { useEffect, useState } from 'react';

/**
 * Stage timing is paced from real measured latency, not invented. Source:
 * eval/RESULTS.md §3 per-node means (categorize 8.32s, detect_anomalies
 * 4.71s, summarize 14.45s) — the backend fans categorize/detect_anomalies/
 * runway_calc out in parallel and joins at summarize, so those two stages
 * start together and each completes on its own measured mean.
 *
 * This is a client-side estimate used to PACE stage transitions, not a real
 * progress signal — /analyze is a single blocking request with no
 * server-sent progress. Stage-level indication is honest about that; a
 * percentage bar would not be; the real elapsed-seconds counter below is a
 * live truthful number rather than an estimate.
 */
const PARSE_END_MS = 1200;
const CATEGORIZE_MEAN_MS = 8320;
const DETECT_MEAN_MS = 4710;
const FAN_IN_MS = PARSE_END_MS + Math.max(CATEGORIZE_MEAN_MS, DETECT_MEAN_MS);

// Render's free tier spins down on inactivity; the first request after that
// can hang for up to ~50s waking it back up. There is no server signal
// distinguishing "waking up" from "just a slow warm request" — a single
// blocking HTTP call carries no such flag — so this fires on elapsed time
// alone. Per product decision, shown on every request past this threshold,
// including normal warm ones (this model's own measured p50 already exceeds
// 10s — see eval/MIGRATION_NOTES.md §3): the note only ever appears once real
// backend work is legitimately still in flight, so it doesn't mislead even
// when the guess about *why* is wrong.
const COLD_START_THRESHOLD_MS = 10000;

type StageStatus = 'pending' | 'active' | 'done';

interface Stage {
  key: string;
  label: string;
  startsAt: number;
  /** undefined = stays active until the request resolves (summarize) */
  endsAt?: number;
}

const STAGES: Stage[] = [
  { key: 'parsing', label: 'Parsing transactions', startsAt: 0, endsAt: PARSE_END_MS },
  { key: 'categorizing', label: 'Categorizing spend', startsAt: PARSE_END_MS, endsAt: PARSE_END_MS + CATEGORIZE_MEAN_MS },
  { key: 'detecting', label: 'Detecting anomalies', startsAt: PARSE_END_MS, endsAt: PARSE_END_MS + DETECT_MEAN_MS },
  { key: 'summarizing', label: 'Generating summary', startsAt: FAN_IN_MS },
];

function statusFor(stage: Stage, elapsed: number): StageStatus {
  if (elapsed < stage.startsAt) return 'pending';
  if (stage.endsAt !== undefined && elapsed >= stage.endsAt) return 'done';
  return 'active';
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'done') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-base)] flex items-center justify-center">
        <svg className="w-3 h-3 text-[var(--bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[var(--accent-flag)] border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
    );
  }
  return <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[var(--border-strong)]" aria-hidden="true" />;
}

interface Props {
  /** Elapsed ms since the request was submitted, ticked by the parent. */
  elapsedMs: number;
}

export default function AnalysisProgress({ elapsedMs }: Props) {
  const summarizeStage = STAGES.find((s) => s.key === 'summarizing')!;
  const inSummarize = elapsedMs >= summarizeStage.startsAt;
  const summarizeElapsed = elapsedMs - summarizeStage.startsAt;

  let summarizeNote: string | null = null;
  if (inSummarize) {
    if (summarizeElapsed > 15000) {
      summarizeNote = 'Still working — this step typically takes the longest.';
    } else if (summarizeElapsed > 6000) {
      summarizeNote = 'Synthesizing the executive brief…';
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8">
      <ul className="space-y-4" role="list">
        {STAGES.map((stage) => {
          const status = statusFor(stage, elapsedMs);
          return (
            <li key={stage.key} className="flex items-center gap-3">
              <StageIcon status={status} />
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    status === 'pending' ? 'text-[var(--text-dim)]' : 'text-[var(--text)]'
                  }`}
                >
                  {stage.label}
                </p>
                {stage.key === 'summarizing' && status === 'active' && summarizeNote && (
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{summarizeNote}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-[var(--text-dim)] text-center mt-6 tabular-nums" aria-live="polite">
        {Math.round(elapsedMs / 1000)}s elapsed
      </p>

      {elapsedMs > COLD_START_THRESHOLD_MS && (
        <p className="text-xs text-[var(--text-dim)] text-center mt-3 pt-3 border-t border-[var(--border)]">
          Waking up the server — first request after inactivity takes about a minute.
        </p>
      )}
    </div>
  );
}

export function useElapsedMs(active: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 200);
    return () => clearInterval(id);
  }, [active]);

  return elapsedMs;
}
