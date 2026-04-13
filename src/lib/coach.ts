import type { CategorySpend, RecurringCharge, Transaction } from "./types";

type CoachContext = {
  transactions: Transaction[];
  categorySpend: CategorySpend[];
  recurringCharges: RecurringCharge[];
};

const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`;

const getDiningAnswer = (context: CoachContext) => {
  const dining = context.categorySpend.find((item) => item.category === "Dining");
  if (!dining) {
    return "I am not seeing dining transactions yet, so there is no takeout or restaurant trend to summarize.";
  }

  return `You spent ${formatCurrency(
    dining.spent,
  )} on dining in this dataset. That is your most flexible savings category, so even trimming one or two orders a week would move your monthly net quickly.`;
};

const getSubscriptionAnswer = (context: CoachContext) => {
  if (context.recurringCharges.length === 0) {
    return "I do not see any likely recurring charges yet.";
  }

  const names = context.recurringCharges.slice(0, 4).map((charge) => charge.merchant).join(", ");
  const total = context.recurringCharges.reduce((sum, charge) => sum + charge.averageAmount, 0);

  return `Your likely recurring charges include ${names}. Together they look like about ${formatCurrency(
    total,
  )} per cycle, so that is the fastest place to audit for easy savings.`;
};

const getOverspendingAnswer = (context: CoachContext) => {
  const overspent = context.categorySpend.filter((item) => item.difference < 0);
  if (overspent.length === 0) {
    return "You are currently within budget across all tracked categories in this dataset.";
  }

  const top = overspent[0];
  return `${top.category} is your biggest over-budget category at ${formatCurrency(
    Math.abs(top.difference),
  )} above target. That is the first place I would tighten next month.`;
};

const getSavingsAnswer = (context: CoachContext) => {
  const income = context.transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const spending = context.transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const net = income - spending;

  return net >= 0
    ? `You are net positive by ${formatCurrency(
        net,
      )} in this dataset. Protecting that cushion means keeping dining and entertainment from expanding.`
    : `You are net negative by ${formatCurrency(
        Math.abs(net),
      )} in this dataset. Cutting one overspent category and reviewing subscriptions would help first.`;
};

export const answerBudgetQuestion = (question: string, context: CoachContext) => {
  const normalized = question.toLowerCase();

  if (normalized.includes("takeout") || normalized.includes("dining") || normalized.includes("food")) {
    return getDiningAnswer(context);
  }

  if (
    normalized.includes("subscription") ||
    normalized.includes("recurring") ||
    normalized.includes("monthly charge")
  ) {
    return getSubscriptionAnswer(context);
  }

  if (
    normalized.includes("overspend") ||
    normalized.includes("over budget") ||
    normalized.includes("too much")
  ) {
    return getOverspendingAnswer(context);
  }

  if (normalized.includes("save") || normalized.includes("saving") || normalized.includes("net")) {
    return getSavingsAnswer(context);
  }

  return "Try asking about takeout, subscriptions, overspending, or how much you are saving. That keeps the coach grounded in the current budgeting data.";
};
