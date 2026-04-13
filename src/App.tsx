import {
  ArrowUpRight,
  Bot,
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AiSettingsPanel } from "./components/AiSettingsPanel";
import { ChartsPanel } from "./components/ChartsPanel";
import { CoachConsole } from "./components/CoachConsole";
import { InsightsPanel } from "./components/InsightsPanel";
import { LedgerBreakdown } from "./components/LedgerBreakdown";
import { ManualTransactionForm } from "./components/ManualTransactionForm";
import { MetricCard } from "./components/MetricCard";
import { RecurringCharges } from "./components/RecurringCharges";
import { SetupGuide } from "./components/SetupGuide";
import { TransactionsTable } from "./components/TransactionsTable";
import { UploadPanel } from "./components/UploadPanel";
import { sampleTransactionsCsv } from "./data/sampleTransactions";
import type { AiConfig } from "./lib/ai";
import {
  appendTransactionToCsv,
  buildInsights,
  getCategorySpend,
  getFlowSummaries,
  getMonthlyTrend,
  getRecurringCharges,
  getSourceBreakdown,
  getTopMerchants,
  getTotals,
  mergeTransactionSets,
  parseCsvTransactions,
  serializeTransactionsToCsv,
  starterBudgets,
} from "./lib/budgeting";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const STORAGE_KEY = "budget-ai-coach.csv";
const EMPTY_LEDGER = "date,merchant,amount,type,account,notes";
const AI_CONFIG_KEY = "budget-ai-coach.ai-config";
const AI_ENABLED_KEY = "budget-ai-coach.ai-enabled";
const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "openrouter",
  apiKey: "",
  model: "openrouter/free",
};

function App() {
  const [rawCsv, setRawCsv] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved.trim() === sampleTransactionsCsv.trim()) {
      return EMPTY_LEDGER;
    }

    return saved;
  });
  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem(AI_ENABLED_KEY) === "true");
  const [importMessage, setImportMessage] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (!saved) {
      return DEFAULT_AI_CONFIG;
    }

    try {
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, rawCsv);
  }, [rawCsv]);

  useEffect(() => {
    localStorage.setItem(AI_ENABLED_KEY, String(aiEnabled));
  }, [aiEnabled]);

  useEffect(() => {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(aiConfig));
  }, [aiConfig]);

  const transactions = parseCsvTransactions(rawCsv);
  const totals = getTotals(transactions);
  const categorySpend = getCategorySpend(transactions, starterBudgets);
  const recurringCharges = getRecurringCharges(transactions);
  const monthlyTrend = getMonthlyTrend(transactions);
  const insights = buildInsights(transactions, starterBudgets);
  const topMerchants = getTopMerchants(transactions);
  const sourceBreakdown = getSourceBreakdown(transactions);
  const flowSummaries = getFlowSummaries(transactions);
  const largestCategory = categorySpend.find((entry) => entry.spent > 0);
  const budgetUsed = totals.income > 0 ? Math.min((totals.spending / totals.income) * 100, 100) : 0;
  const isUsingSample = rawCsv.trim() === sampleTransactionsCsv.trim();
  const hasTransactions = transactions.length > 0;

  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AI_CONFIG_KEY);
    localStorage.removeItem(AI_ENABLED_KEY);
    setRawCsv(EMPTY_LEDGER);
    setImportMessage("");
    setAiEnabled(false);
    setAiConfig(DEFAULT_AI_CONFIG);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">B</div>
          <div>
            <p className="eyebrow">Personal finance operating system</p>
            <h1 className="brand-title">Budget AI Coach</h1>
          </div>
        </div>
        <div className="topbar-status">
          <span className="status-pill">{hasTransactions ? "Personal ledger active" : "Ready for first import"}</span>
          <span className="status-pill subtle">{aiEnabled ? "Live AI enabled" : "Local AI mode"}</span>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <section className="sidebar-nav panel">
            <div className="nav-item active">
              <LayoutDashboard size={16} />
              Overview
            </div>
            <div className="nav-item">
              <Upload size={16} />
              Imports
            </div>
            <div className="nav-item">
              <Wallet size={16} />
              Transactions
            </div>
            <div className="nav-item">
              <Bot size={16} />
              AI Coach
            </div>
          </section>

          <UploadPanel
            onSampleLoad={() => setRawCsv(sampleTransactionsCsv)}
            onFilesLoaded={(files) => {
              const existingTransactions = parseCsvTransactions(rawCsv);
              const importedGroups = files.map((file) => parseCsvTransactions(file.contents));
              const importedTransactions = importedGroups.flat();
              const mergedTransactions = mergeTransactionSets(existingTransactions, ...importedGroups);

              setRawCsv(serializeTransactionsToCsv(mergedTransactions));
              setImportMessage(
                importedTransactions.length > 0
                  ? `Imported ${importedTransactions.length} transaction${
                      importedTransactions.length === 1 ? "" : "s"
                    } from ${files.length} file${files.length === 1 ? "" : "s"}. Ledger now has ${
                      mergedTransactions.length
                    } unique transaction${mergedTransactions.length === 1 ? "" : "s"}.`
                  : "No recognizable transactions were found. Try CSVs with columns like date, description, amount, debit, or credit.",
              );
            }}
            isUsingSample={isUsingSample}
            importMessage={importMessage}
          />
          <SetupGuide
            transactionCount={transactions.length}
            isUsingSample={isUsingSample}
            onStartFresh={() => {
              setRawCsv(EMPTY_LEDGER);
              setImportMessage("");
            }}
            onLoadSample={() => setRawCsv(sampleTransactionsCsv)}
            onClearAllData={clearAllData}
          />
          <AiSettingsPanel
            config={aiConfig}
            enabled={aiEnabled}
            onEnabledChange={setAiEnabled}
            onConfigChange={setAiConfig}
          />
        </aside>

        <main className="main-column">
          <section className="hero-panel">
            <div className="hero-copy hero-main">
              <p className="eyebrow">Desktop finance dashboard</p>
              <h2 className="hero-heading">Track your own spending, cleanly.</h2>
              <p className="hero-text">
                Import real card statements, log purchases manually, and let the dashboard turn
                your personal transaction history into practical budgeting signals.
              </p>
              <div className="hero-tags">
                <span>
                  <ReceiptText size={16} />
                  CSV imports from your actual accounts
                </span>
                <span>
                  <Wallet size={16} />
                  Manual entries for daily tracking
                </span>
                <span>
                  <Sparkles size={16} />
                  AI-ready finance coaching
                </span>
              </div>
              <div className="hero-highlight">
                <div>
                  <p className="hero-highlight-label">Top spending area</p>
                  <strong>{largestCategory?.category ?? "Waiting for your data"}</strong>
                </div>
                <div>
                  <p className="hero-highlight-label">Spend vs income</p>
                  <strong>{hasTransactions ? `${Math.round(budgetUsed)}%` : "No activity yet"}</strong>
                </div>
                <div>
                  <p className="hero-highlight-label">Ledger status</p>
                  <strong>{hasTransactions ? "Tracking live" : "Ready for setup"}</strong>
                </div>
              </div>
            </div>
            <aside className="hero-copy hero-spotlight">
              <p className="eyebrow">Why this is usable</p>
              <h2>Your cards, no paid sync required</h2>
              <p className="muted">
                This app is designed around the financial data you can already access yourself:
                statement CSVs plus quick manual updates between imports.
              </p>
              <div className="spotlight-stack">
                <article>
                  <span>Real transaction data</span>
                  <strong>Upload statements from Chase, Capital One, and similar portals</strong>
                </article>
                <article>
                  <span>Fast logging</span>
                  <strong>Add purchases manually without waiting for monthly exports</strong>
                </article>
                <article>
                  <span>AI path</span>
                  <strong>Use local logic now and turn on live API answers when you want</strong>
                </article>
              </div>
              <div className="hero-cta">
                <ArrowUpRight size={16} />
                Built to become your own budgeting dashboard
              </div>
            </aside>
          </section>

          <section className="metrics-grid metrics-lifted">
            <MetricCard
              label="Income"
              value={hasTransactions ? currencyFormatter.format(totals.income) : "$0"}
              helper="Tracked inflows for the current dataset"
            />
            <MetricCard
              label="Spending"
              value={hasTransactions ? currencyFormatter.format(totals.spending) : "$0"}
              helper="All expense transactions after normalization"
            />
            <MetricCard
              label="Net"
              value={hasTransactions ? currencyFormatter.format(totals.income - totals.spending) : "$0"}
              helper="Income minus spending"
            />
            <MetricCard
              label="Recurring charges"
              value={hasTransactions ? `${recurringCharges.length}` : "0"}
              helper="Detected by repeated merchant and category patterns"
            />
          </section>

          <section className="split-grid split-grid-top">
            <ManualTransactionForm
              onSubmit={(transaction) =>
                setRawCsv((current) => appendTransactionToCsv(current, transaction))
              }
            />
            <CoachConsole
              transactions={transactions}
              categorySpend={categorySpend}
              recurringCharges={recurringCharges}
              aiEnabled={aiEnabled}
              aiConfig={aiConfig}
            />
          </section>

          <InsightsPanel insights={insights} />
          <LedgerBreakdown sources={sourceBreakdown} flows={flowSummaries} />
          <ChartsPanel categorySpend={categorySpend} monthlyTrend={monthlyTrend} />

          <section className="split-grid">
            <RecurringCharges charges={recurringCharges} />
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Merchant view</p>
                  <h2>Where money goes fastest</h2>
                </div>
              </div>
              {topMerchants.length === 0 ? (
                <div className="empty-card">
                  <h3>No merchant trends yet</h3>
                  <p>Your top merchants will show up here once your personal spending history starts building.</p>
                </div>
              ) : (
                <div className="list-grid">
                  {topMerchants.map((merchant) => (
                    <article key={merchant.merchant} className="list-row">
                      <div>
                        <h3>{merchant.merchant}</h3>
                        <p className="muted">Top expense merchant in this period</p>
                      </div>
                      <strong>${merchant.amount.toFixed(2)}</strong>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>

          <TransactionsTable transactions={transactions} />
        </main>
      </div>
    </div>
  );
}

export default App;
