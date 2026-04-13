import type { Insight } from "../lib/types";

type InsightsPanelProps = {
  insights: Insight[];
};

export const InsightsPanel = ({ insights }: InsightsPanelProps) => (
  <section className="panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">AI coach</p>
        <h2>Financial insights</h2>
      </div>
      <p className="muted compact">
        Local rules power this first version, and the insight layer is structured so we can swap in
        an LLM later for natural-language Q&A.
      </p>
    </div>
    {insights.length === 0 ? (
      <div className="empty-card">
        <h3>No insights yet</h3>
        <p>
          Upload your own CSV or add a few purchases manually, and the coach will start surfacing
          spending patterns, budget pressure, and recurring-charge suggestions.
        </p>
      </div>
    ) : (
      <div className="insight-grid">
        {insights.map((insight) => (
          <article key={insight.id} className={`insight-card insight-${insight.tone}`}>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
          </article>
        ))}
      </div>
    )}
  </section>
);
