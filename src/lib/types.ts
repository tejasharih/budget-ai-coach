export type TransactionKind = "expense" | "income" | "transfer";

export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  type: TransactionKind;
  account: string;
  notes: string;
  category: string;
};

export type Budget = {
  category: string;
  limit: number;
};

export type CategorySpend = {
  category: string;
  spent: number;
  budget: number;
  difference: number;
};

export type MonthlyPoint = {
  month: string;
  income: number;
  spending: number;
};

export type RecurringCharge = {
  merchant: string;
  averageAmount: number;
  chargeCount: number;
  cadence: string;
  lastChargeDate: string;
  category: string;
};

export type InsightTone = "good" | "neutral" | "alert";

export type Insight = {
  id: string;
  title: string;
  description: string;
  tone: InsightTone;
};

export type SourceBreakdown = {
  source: string;
  count: number;
  income: number;
  spending: number;
  transfers: number;
};

export type FlowSummary = {
  label: string;
  count: number;
  amount: number;
};
