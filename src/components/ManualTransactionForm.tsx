import { useState } from "react";
import type { TransactionKind } from "../lib/types";

type ManualTransactionFormProps = {
  onSubmit: (transaction: {
    date: string;
    merchant: string;
    amount: number;
    type: TransactionKind;
    account: string;
    notes: string;
  }) => void;
};

const today = new Date().toISOString().slice(0, 10);

export const ManualTransactionForm = ({ onSubmit }: ManualTransactionFormProps) => {
  const [date, setDate] = useState(today);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionKind>("expense");
  const [account, setAccount] = useState("Manual");
  const [notes, setNotes] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number.parseFloat(amount);
    if (!merchant.trim() || !date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      date,
      merchant: merchant.trim(),
      amount: parsedAmount,
      type,
      account: account.trim() || "Manual",
      notes: notes.trim(),
    });

    setMerchant("");
    setAmount("");
    setNotes("");
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Track your own spending</p>
          <h2>Quick add transaction</h2>
        </div>
        <p className="muted compact">
          If you do not want to upload statements every time, add purchases here and build your own
          running budget history.
        </p>
      </div>
      <form className="manual-form" onSubmit={handleSubmit}>
        <label>
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          <span>Merchant</span>
          <input
            type="text"
            placeholder="Trader Joe's, Uber, Spotify"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
          />
        </label>
        <label>
          <span>Amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          <span>Type</span>
          <select value={type} onChange={(event) => setType(event.target.value as TransactionKind)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          <span>Account</span>
          <input
            type="text"
            placeholder="Chase Freedom"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
          />
        </label>
        <label className="notes-field">
          <span>Notes</span>
          <input
            type="text"
            placeholder="Groceries before the week starts"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button type="submit" className="button button-primary">
          Save transaction
        </button>
      </form>
    </section>
  );
};
