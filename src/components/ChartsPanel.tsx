import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategorySpend, MonthlyPoint } from "../lib/types";

type ChartsPanelProps = {
  categorySpend: CategorySpend[];
  monthlyTrend: MonthlyPoint[];
};

const palette = ["#1d4ed8", "#0f766e", "#f59e0b", "#be123c", "#7c3aed", "#334155"];

export const ChartsPanel = ({ categorySpend, monthlyTrend }: ChartsPanelProps) => (
  <section className="charts-grid">
    <article className="panel chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Category view</p>
          <h2>Budget vs actual</h2>
        </div>
      </div>
      {categorySpend.some((entry) => entry.spent > 0) ? (
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categorySpend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="spent" radius={[8, 8, 0, 0]}>
                {categorySpend.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={entry.difference < 0 ? "#ef4444" : palette[index % palette.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-card chart-empty">
          <h3>No category spend yet</h3>
          <p>Your spending breakdown will appear here once you import or log transactions.</p>
        </div>
      )}
    </article>
    <article className="panel chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Trend</p>
          <h2>Monthly cash flow</h2>
        </div>
      </div>
      {monthlyTrend.length > 0 ? (
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="spending" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-card chart-empty">
          <h3>No monthly trend yet</h3>
          <p>Once your ledger has activity, you will see how income and spending move over time.</p>
        </div>
      )}
    </article>
  </section>
);
