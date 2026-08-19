'use client';

import SpendByCategoryChart from './SpendByCategoryChart';

export interface Metrics {
  total_transactions: number;
  total_spend: number;
  avg_transaction: number;
}

interface RunwayData {
  runway_months?: number | null;
  recommendations?: string[];
  // Set by the backend whenever runway_months is null — cash_on_hand wasn't
  // supplied, or revenue already covers spend. Surfaced instead of leaving
  // the reader to guess why the number is missing.
  reason?: string | null;
}

interface AnomalyData {
  anomalies?: string[];
  risk_level?: string;
}

export interface AnalysisResult {
  summary: string;
  metrics: Metrics;
  runway: RunwayData;
  anomalies: AnomalyData;
  // LLM-generated JSON, no guaranteed shape — SpendByCategoryChart parses
  // it defensively rather than trusting a fixed type here.
  categories?: unknown;
}

interface Props {
  data: AnalysisResult;
  onNewAnalysis: () => void;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div
      className={`bg-[var(--surface)] rounded border p-6 transition-colors duration-200 hover:border-[var(--border-strong)] ${
        accent ? 'border-[var(--accent-base)]/40' : 'border-[var(--border)]'
      }`}
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-dim)] mb-3">{label}</p>
      <p
        className={`text-3xl font-semibold tabular-nums leading-none ${
          accent ? 'text-[var(--accent-base)]' : 'text-[var(--text)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function Dashboard({ data, onNewAnalysis }: Props) {
  const { summary, metrics, runway, anomalies, categories } = data;

  const riskLevel = anomalies?.risk_level?.toLowerCase();
  const riskBadgeClass =
    riskLevel === 'high'
      ? 'bg-[var(--accent-flag)]/15 text-[var(--accent-flag)] border-[var(--accent-flag)]/40'
      : riskLevel === 'medium'
      ? 'bg-[var(--accent-flag)]/8 text-[var(--accent-flag)]/80 border-[var(--accent-flag)]/20'
      : 'bg-[var(--accent-base)]/10 text-[var(--accent-base)] border-[var(--accent-base)]/25';

  return (
    <div className="space-y-6">

      <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 sm:px-8 py-5 flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[var(--accent-flag)] flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-dim)]">AI-Generated</p>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text)] leading-tight">CFO Executive Brief</h2>
          </div>
        </div>
        <div className="px-6 sm:px-8 py-7">
          <p className="text-[var(--text)]/90 text-base leading-[1.75] whitespace-pre-wrap break-words">{summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Transactions" value={metrics.total_transactions} />
        <MetricCard
          label="Total Spend"
          value={`$${metrics.total_spend.toLocaleString()}`}
        />
        <MetricCard
          label="Avg Transaction"
          value={`$${metrics.avg_transaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricCard
          label="Runway"
          value={runway?.runway_months ? `${runway.runway_months.toFixed(1)} mo` : 'N/A'}
          accent={!!runway?.runway_months}
        />
      </div>

      {!runway?.runway_months && runway?.reason && (
        <p className="text-xs text-[var(--text-dim)] -mt-2 px-1">
          Runway not shown: {runway.reason}.
        </p>
      )}

      <SpendByCategoryChart categories={categories} />

      {anomalies?.anomalies && anomalies.anomalies.length > 0 && (
        <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[var(--accent-flag)] flex-shrink-0" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[var(--text)]">Anomalies Detected</h3>
            </div>
            {anomalies.risk_level && (
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border flex-shrink-0 ${riskBadgeClass}`}
              >
                {anomalies.risk_level} Risk
              </span>
            )}
          </div>
          <ul className="px-6 py-5 space-y-3" role="list">
            {anomalies.anomalies.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--text)]/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-flag)] flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {runway?.recommendations && runway.recommendations.length > 0 && (
        <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
          <div className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-[var(--accent-base)] flex-shrink-0" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[var(--text)]">Recommendations</h3>
          </div>
          <ol className="px-6 py-5 space-y-3" role="list">
            {runway.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--text)]/80">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-base)]/10 border border-[var(--accent-base)]/30 text-[var(--accent-base)] text-[11px] font-semibold flex items-center justify-center leading-none mt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        onClick={onNewAnalysis}
        className="w-full bg-[var(--accent-flag)] hover:bg-[var(--accent-flag-hover)] text-[var(--bg)] font-semibold py-3.5 px-6 rounded transition-colors duration-200 text-sm tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:ring-[var(--accent-flag)]"
      >
        Analyze New File
      </button>
    </div>
  );
}
