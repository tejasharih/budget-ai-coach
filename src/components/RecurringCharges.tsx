import { formatTransactionDate } from "../lib/date";
import type { RecurringCharge } from "../lib/types";

type RecurringChargesProps = {
  charges: RecurringCharge[];
};

export const RecurringCharges = ({ charges }: RecurringChargesProps) => (
  <section className="panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Recurring spend</p>
        <h2>Subscription watchlist</h2>
      </div>
    </div>
    {charges.length === 0 ? (
      <div className="empty-card">
        <h3>No recurring charges detected</h3>
        <p>
          After a few statement imports, the app will start spotting subscriptions and repeated
          monthly charges for you.
        </p>
      </div>
    ) : (
      <div className="list-grid">
        {charges.map((charge) => (
          <article key={`${charge.merchant}-${charge.lastChargeDate}`} className="list-row">
            <div>
              <h3>{charge.merchant}</h3>
              <p className="muted">
                {charge.category} • {charge.cadence} • last seen {formatTransactionDate(charge.lastChargeDate)}
              </p>
            </div>
            <strong>${charge.averageAmount.toFixed(2)}</strong>
          </article>
        ))}
      </div>
    )}
  </section>
);
