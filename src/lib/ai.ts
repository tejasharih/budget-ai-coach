import type { CategorySpend, RecurringCharge, Transaction } from "./types";

export type AiConfig = {
  provider: "openrouter";
  apiKey: string;
  model: string;
};

type AiBudgetContext = {
  question: string;
  transactions: Transaction[];
  categorySpend: CategorySpend[];
  recurringCharges: RecurringCharge[];
};

const summarizeTransactions = (transactions: Transaction[]) =>
  transactions
    .slice(-20)
    .map(
      (transaction) =>
        `${transaction.date} | ${transaction.merchant} | ${transaction.category} | ${transaction.type} | $${transaction.amount.toFixed(2)}`,
    )
    .join("\n");

const summarizeCategories = (categorySpend: CategorySpend[]) =>
  categorySpend
    .map(
      (category) =>
        `${category.category}: spent $${category.spent.toFixed(2)}, budget $${category.budget.toFixed(
          2,
        )}, difference $${category.difference.toFixed(2)}`,
    )
    .join("\n");

const summarizeRecurring = (recurringCharges: RecurringCharge[]) =>
  recurringCharges
    .map(
      (charge) =>
        `${charge.merchant}: avg $${charge.averageAmount.toFixed(2)}, ${charge.cadence}, category ${charge.category}`,
    )
    .join("\n");

export const askBudgetModel = async (config: AiConfig, context: AiBudgetContext) => {
  const systemPrompt =
    "You are a practical budgeting coach. Use only the provided financial data. Do not invent transactions, balances, or subscriptions. Keep the answer concise, specific, and actionable.";

  const userPrompt = [
    "Question:",
    context.question,
    "",
    "Category summary:",
    summarizeCategories(context.categorySpend) || "No category data available.",
    "",
    "Recurring charges:",
    summarizeRecurring(context.recurringCharges) || "No recurring charges detected.",
    "",
    "Recent transactions:",
    summarizeTransactions(context.transactions) || "No transactions available.",
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `OpenRouter request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("No model response returned.");
  }

  return content.trim();
};
