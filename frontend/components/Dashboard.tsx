'use client';

export interface Metrics {
  total_transactions: number;
  total_spend: number;
  avg_transaction: number;
}

interface RunwayData {
  runway_months?: number;
  recommendations?: string[];
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
  // Present in the API response but not rendered by this component.
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
      className={`bg-[#0F0F12]/75 rounded-xl border p-6 transition-colors duration-200 hover:border-white/20 ${
        accent ? 'border-[#7C3AED]/40' : 'border-white/[0.08]'
      }`}
    >
      <p className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF] mb-3">{label}</p>
      <p
        className={`text-3xl font-bold tabular-nums leading-none ${
          accent ? 'text-[#06B6D4]' : 'text-[#E2E8F0]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function Dashboard({ data, onNewAnalysis }: Props) {
  const { summary, metrics, runway, anomalies } = data;

  const riskLevel = anomalies?.risk_level?.toLowerCase();
  const riskBadgeClass =
    riskLevel === 'high'
      ? 'bg-red-500/10 text-red-400 border-red-500/30'
      : riskLevel === 'medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20';

  return (
    <div className="space-y-6">

      <div className="bg-[#0F0F12]/75 rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="border-b border-white/[0.08] px-6 sm:px-8 py-5 flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[#7C3AED] flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF]">AI-Generated</p>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#E2E8F0] leading-tight">CFO Executive Brief</h2>
          </div>
        </div>
        <div className="px-6 sm:px-8 py-7">
          <p className="text-[#E2E8F0]/90 text-base leading-[1.75] whitespace-pre-wrap break-words">{summary}</p>
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

      {anomalies?.anomalies && anomalies.anomalies.length > 0 && (
        <div className="bg-[#0F0F12]/75 rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
              <h3 className="text-base font-bold text-[#E2E8F0]">Anomalies Detected</h3>
            </div>
            {anomalies.risk_level && (
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex-shrink-0 ${riskBadgeClass}`}
              >
                {anomalies.risk_level} Risk
              </span>
            )}
          </div>
          <ul className="px-6 py-5 space-y-3" role="list">
            {anomalies.anomalies.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#E2E8F0]/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {runway?.recommendations && runway.recommendations.length > 0 && (
        <div className="bg-[#0F0F12]/75 rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="border-b border-white/[0.08] px-6 py-4 flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#E2E8F0]">Recommendations</h3>
          </div>
          <ol className="px-6 py-5 space-y-3" role="list">
            {runway.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#E2E8F0]/80">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center justify-center leading-none mt-0.5"
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
        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors duration-200 text-sm tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] focus-visible:ring-[#7C3AED]"
      >
        Analyze New File
      </button>
    </div>
  );
}
