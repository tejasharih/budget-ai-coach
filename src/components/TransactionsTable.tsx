import { formatTransactionDate } from "../lib/date";
import type { Transaction } from "../lib/types";

type TransactionsTableProps = {
  transactions: Transaction[];
};

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => (
  <section className="panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Ledger</p>
        <h2>Recent transactions</h2>
      </div>
    </div>
    {transactions.length === 0 ? (
      <div className="empty-card">
        <h3>Your ledger is empty</h3>
        <p>
          Add a transaction manually or import a card statement CSV to start building a personal
          spending history.
        </p>
      </div>
    ) : (
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .slice()
              .reverse()
              .slice(0, 10)
              .map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatTransactionDate(transaction.date)}</td>
                  <td>{transaction.merchant}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.account}</td>
                  <td className={transaction.type === "income" ? "positive" : ""}>
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
