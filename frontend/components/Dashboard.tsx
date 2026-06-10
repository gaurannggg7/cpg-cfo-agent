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
}

interface Props {
  data: AnalysisResult;
  onNewAnalysis: () => void;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function Dashboard({ data, onNewAnalysis }: Props) {
  const { summary, metrics, runway, anomalies } = data;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">CFO Executive Brief</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Transactions" value={metrics.total_transactions} />
        <MetricCard label="Total Spend" value={`$${metrics.total_spend.toLocaleString()}`} />
        <MetricCard
          label="Avg Transaction"
          value={`$${metrics.avg_transaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricCard
          label="Runway"
          value={runway?.runway_months ? `${runway.runway_months.toFixed(1)} mo` : 'N/A'}
        />
      </div>

      {anomalies?.anomalies && anomalies.anomalies.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
          <h3 className="text-lg font-bold text-red-800 mb-3">
            Anomalies Detected
            {anomalies.risk_level && (
              <span className="ml-2 text-sm font-normal">
                — Risk: {anomalies.risk_level.toUpperCase()}
              </span>
            )}
          </h3>
          <ul className="space-y-2">
            {anomalies.anomalies.map((item, i) => (
              <li key={i} className="text-red-700">• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {runway?.recommendations && runway.recommendations.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="text-lg font-bold text-blue-800 mb-3">Recommendations</h3>
          <ol className="space-y-2 list-decimal list-inside">
            {runway.recommendations.map((rec, i) => (
              <li key={i} className="text-blue-700">{rec}</li>
            ))}
          </ol>
        </div>
      )}

      <button
        onClick={onNewAnalysis}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        Analyze New File
      </button>
    </div>
  );
}
