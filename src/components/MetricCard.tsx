type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export const MetricCard = ({ label, value, helper }: MetricCardProps) => (
  <article className="panel metric-card">
    <p className="metric-label">{label}</p>
    <p className="metric-value">{value}</p>
    <p className="muted">{helper}</p>
  </article>
);
