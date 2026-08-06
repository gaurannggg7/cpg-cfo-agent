'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface CategoryTotal {
  name: string;
  amount: number;
}

/**
 * The backend's `categories` field is LLM-generated JSON with no schema
 * guarantee. Confirmed by hitting the live API directly: the per-category
 * spend lists (`categories.categories.COGS`, etc.) are arrays of
 * description strings, not amounts — the only numeric data usable for a
 * chart is `categories.total_by_category`. If that key is missing or
 * malformed, this returns an empty array and the chart renders nothing
 * rather than guessing at a shape.
 */
function parseCategoryTotals(categories: unknown): CategoryTotal[] {
  if (!categories || typeof categories !== 'object') return [];
  const totals = (categories as Record<string, unknown>).total_by_category;
  if (!totals || typeof totals !== 'object') return [];

  return Object.entries(totals as Record<string, unknown>)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([name, value]) => ({ name, amount: Math.abs(value as number) }))
    .sort((a, b) => b.amount - a.amount);
}

interface Props {
  categories: unknown;
}

export default function SpendByCategoryChart({ categories }: Props) {
  const data = parseCategoryTotals(categories);
  if (data.length === 0) return null;

  // The backend has no per-category risk field — there's no "this bucket
  // is dangerous" signal in the data. Flagging the single largest spend
  // category is a real, computed distinction (it's the one worth a CFO's
  // attention first), not a fabricated risk score.
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
      <div className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-[var(--accent-base)] flex-shrink-0" aria-hidden="true" />
        <h3 className="text-base font-semibold text-[var(--text)]">Spend by Category</h3>
      </div>
      <div className="px-4 py-5" style={{ height: data.length * 48 + 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              width={90}
            />
            <Tooltip
              cursor={{ fill: 'var(--border)', opacity: 0.4 }}
              contentStyle={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text)',
                fontSize: 12,
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
            />
            <Bar dataKey="amount" radius={[0, 2, 2, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.amount === maxAmount ? '#A8613C' : '#5C6B4A'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
