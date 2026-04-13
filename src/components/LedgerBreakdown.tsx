import type { FlowSummary, SourceBreakdown } from "../lib/types";

type LedgerBreakdownProps = {
  sources: SourceBreakdown[];
  flows: FlowSummary[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const LedgerBreakdown = ({ sources, flows }: LedgerBreakdownProps) => (
  <section className="split-grid">
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h2>Money flow breakdown</h2>
        </div>
        <p className="muted compact">
          Separate inflows, true spending, and internal transfers so the top-line totals are easier
          to trust.
        </p>
      </div>
      <div className="flow-grid">
        {flows.map((flow) => (
          <article key={flow.label} className="flow-card">
            <p className="hero-highlight-label">{flow.label}</p>
            <strong>{currencyFormatter.format(flow.amount)}</strong>
            <p className="muted">{flow.count} transactions</p>
          </article>
        ))}
      </div>
    </section>

    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sources</p>
          <h2>Account and import mix</h2>
        </div>
      </div>
      {sources.length === 0 ? (
        <div className="empty-card">
          <h3>No imported sources yet</h3>
          <p>Upload statements and the dashboard will show what each source contributes.</p>
        </div>
      ) : (
        <div className="list-grid">
          {sources.map((source) => (
            <article key={source.source} className="source-row">
              <div>
                <h3>{source.source}</h3>
                <p className="muted">{source.count} transactions</p>
              </div>
              <div className="source-metrics">
                <span>In {currencyFormatter.format(source.income)}</span>
                <span>Out {currencyFormatter.format(source.spending)}</span>
                <span>Xfer {currencyFormatter.format(source.transfers)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  </section>
);
