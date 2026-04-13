import { format, isValid, parse, parseISO } from "date-fns";
import type {
  Budget,
  CategorySpend,
  FlowSummary,
  Insight,
  MonthlyPoint,
  RecurringCharge,
  SourceBreakdown,
  Transaction,
  TransactionKind,
} from "./types";

export type ManualTransactionInput = {
  date: string;
  merchant: string;
  amount: number;
  type: TransactionKind;
  account: string;
  notes: string;
};

const categoryRules: Array<{ match: RegExp; category: string }> = [
  { match: /(whole foods|trader joe|aldi|walmart|target)/i, category: "Groceries" },
  { match: /(doordash|uber eats|chipotle|panera|shake shack|starbucks)/i, category: "Dining" },
  { match: /(uber|lyft|nj transit|shell|exxon)/i, category: "Transport" },
  { match: /(spotify|netflix|apple|icloud|crunch fitness|gym)/i, category: "Subscriptions" },
  { match: /(airbnb|ticketmaster|amc|concert)/i, category: "Entertainment" },
  { match: /(verizon|at&t|t-mobile)/i, category: "Bills" },
  { match: /(payroll|deposit|cashout|reimbursement)/i, category: "Income" },
];

export const starterBudgets: Budget[] = [
  { category: "Groceries", limit: 320 },
  { category: "Dining", limit: 220 },
  { category: "Transport", limit: 130 },
  { category: "Subscriptions", limit: 80 },
  { category: "Entertainment", limit: 120 },
  { category: "Bills", limit: 110 },
  { category: "Shopping", limit: 140 },
  { category: "Income", limit: 0 },
];

const parseAmount = (value: string) => {
  const normalized = value
    .replace(/[$,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1")
    .trim();
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const headerAliases = {
  date: ["date", "datetime", "transactiondate", "postingdate", "postdate"],
  merchant: ["merchant", "description", "details", "transactiondescription", "name"],
  amount: ["amount", "amounttotal", "transactionamount"],
  debit: ["debit", "debits", "withdrawal", "withdrawals"],
  credit: ["credit", "credits", "deposit", "deposits"],
  type: ["type", "transactiontype"],
  account: ["account", "accountname", "card", "cardname"],
  notes: ["notes", "memo", "category", "reference"],
} as const;

const findHeaderIndex = (headers: string[], aliases: readonly string[]) =>
  headers.findIndex((header) => aliases.includes(header));

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsers = [
    () => parseISO(trimmed),
    () => parse(trimmed, "M/d/yyyy", new Date()),
    () => parse(trimmed, "MM/dd/yyyy", new Date()),
    () => parse(trimmed, "M/d/yy", new Date()),
    () => parse(trimmed, "MM/dd/yy", new Date()),
    () => parse(trimmed, "yyyy-MM-dd", new Date()),
  ];

  for (const parser of parsers) {
    const parsed = parser();
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  }

  return "";
};

const looksLikeDate = (value: string) => normalizeDate(value) !== "";

const looksLikeHeaderlessBankExport = (columns: string[]) => {
  if (columns.length < 2) {
    return false;
  }

  return looksLikeDate(columns[0] ?? "") && Number.isFinite(parseAmount(columns[1] ?? ""));
};

const findStructuredHeaderRowIndex = (lines: string[]) => {
  return lines.findIndex((line) => {
    const headers = parseCsvLine(line).map(normalizeHeader);
    const hasDateColumn =
      headers.includes("date") || headers.includes("datetime") || headers.includes("transactiondate");
    const hasAmountColumn =
      headers.includes("amount") ||
      headers.includes("amounttotal") ||
      headers.includes("debit") ||
      headers.includes("credit");

    return hasDateColumn && hasAmountColumn;
  });
};

const cleanAmountString = (value: string) =>
  value
    .replace(/[$,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1")
    .trim();

const normalizeType = (value: string): TransactionKind =>
  value.trim().toLowerCase() === "income" ? "income" : "expense";

export const inferCategory = (merchant: string, type: TransactionKind) => {
  if (type === "transfer") {
    return "Transfer";
  }

  if (type === "income") {
    return "Income";
  }

  const match = categoryRules.find((rule) => rule.match.test(merchant));
  return match?.category ?? "Shopping";
};

const looksLikeIncome = (merchant: string, notes: string) => {
  const combined = `${merchant} ${notes}`.toLowerCase();
  return /(payment|deposit|refund|reimbursement|payroll|credit adjustment|interest payment|cashback)/i.test(
    combined,
  );
};

const looksLikeCreditCardPayment = (merchant: string, notes: string) => {
  const combined = `${merchant} ${notes}`.toLowerCase();
  return /(discover e-?payment|credit card payment|card payment|internet payment.*thank you|payment.*thank you|online payment)/i.test(
    combined,
  );
};

const looksLikeStatementCredit = (merchant: string, notes: string) => {
  const combined = `${merchant} ${notes}`.toLowerCase();
  return /(cashback bonus redemption|statement crdt|rebate credit|awards and rebate credits|refund)/i.test(
    combined,
  );
};

const looksLikeBankAccount = (value: string) =>
  /(wells fargo|bank account|checking|savings|truist|chase|boa|bank of america|capital one|\*\d{4})/i.test(
    value,
  );

export const parseCsvTransactions = (csv: string) => {
  const rawLines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerRowIndex = findStructuredHeaderRowIndex(rawLines);
  const lines = headerRowIndex >= 0 ? rawLines.slice(headerRowIndex) : rawLines;
  const [firstLine, ...restLines] = lines;

  if (!firstLine) {
    return [];
  }

  const firstColumns = parseCsvLine(firstLine);
  const hasHeader = !looksLikeHeaderlessBankExport(firstColumns);
  const rows = hasHeader ? restLines : lines;
  const normalizedHeaders = hasHeader ? firstColumns.map(normalizeHeader) : [];
  const dateIndex = findHeaderIndex(normalizedHeaders, headerAliases.date);
  const merchantIndex = findHeaderIndex(normalizedHeaders, headerAliases.merchant);
  const amountIndex = findHeaderIndex(normalizedHeaders, headerAliases.amount);
  const debitIndex = findHeaderIndex(normalizedHeaders, headerAliases.debit);
  const creditIndex = findHeaderIndex(normalizedHeaders, headerAliases.credit);
  const typeIndex = findHeaderIndex(normalizedHeaders, headerAliases.type);
  const accountIndex = findHeaderIndex(normalizedHeaders, headerAliases.account);
  const notesIndex = findHeaderIndex(normalizedHeaders, headerAliases.notes);
  const importSource =
    !hasHeader
      ? "Wells Fargo Checking"
      : normalizedHeaders.includes("datetime") && normalizedHeaders.includes("amounttotal")
        ? "Venmo"
        : normalizedHeaders.includes("postdate") && normalizedHeaders.includes("transdate")
          ? "Discover"
          : "Imported";

  return rows
    .map((row, index) => {
      if (!row.trim()) {
        return null;
      }

      const columns = parseCsvLine(row);
      const shiftedColumns =
        hasHeader && normalizedHeaders.length === columns.length - 1 && columns[0] === ""
          ? columns.slice(1)
          : columns;
      const rowColumns = shiftedColumns;
      const rawDate = hasHeader
        ? dateIndex >= 0
          ? rowColumns[dateIndex] ?? ""
          : rowColumns[0] ?? ""
        : rowColumns[0] ?? "";
      const rawMerchant = hasHeader
        ? merchantIndex >= 0
          ? rowColumns[merchantIndex] ?? ""
          : rowColumns[1] ?? ""
        : rowColumns[4] ?? rowColumns[3] ?? "Bank transaction";
      const rawAmount = hasHeader
        ? amountIndex >= 0
          ? parseAmount(rowColumns[amountIndex] ?? "0")
          : parseAmount(rowColumns[debitIndex] ?? "0") || parseAmount(rowColumns[creditIndex] ?? "0")
        : Math.abs(parseAmount(rowColumns[1] ?? "0"));
      const rawDebit = debitIndex >= 0 ? parseAmount(rowColumns[debitIndex] ?? "0") : 0;
      const rawCredit = creditIndex >= 0 ? parseAmount(rowColumns[creditIndex] ?? "0") : 0;
      const rawType = typeIndex >= 0 ? rowColumns[typeIndex] ?? "" : "";
      const account = (accountIndex >= 0 ? rowColumns[accountIndex] : undefined) || importSource;
      const notes = hasHeader
        ? notesIndex >= 0
          ? rowColumns[notesIndex] ?? ""
          : ""
        : `${rowColumns[2] ?? ""} ${rowColumns[3] ?? ""}`.trim();
      const date = normalizeDate(rawDate);
      const fromIndex = findHeaderIndex(normalizedHeaders, ["from"]);
      const toIndex = findHeaderIndex(normalizedHeaders, ["to"]);
      const fromValue = fromIndex >= 0 ? rowColumns[fromIndex] ?? "" : "";
      const toValue = toIndex >= 0 ? rowColumns[toIndex] ?? "" : "";
      const fundingSourceIndex = findHeaderIndex(normalizedHeaders, ["fundingsource"]);
      const destinationIndex = findHeaderIndex(normalizedHeaders, ["destination"]);
      const fundingSource = fundingSourceIndex >= 0 ? rowColumns[fundingSourceIndex] ?? "" : "";
      const destinationValue = destinationIndex >= 0 ? rowColumns[destinationIndex] ?? "" : "";
      const merchantName = rawMerchant || toValue || fromValue || "Unknown merchant";
      const signedAmountSource = amountIndex >= 0 ? rowColumns[amountIndex] ?? "" : rowColumns[1] ?? "";
      const signedAmountValue = Number.parseFloat(cleanAmountString(signedAmountSource));
      const hasPeerTransferColumns = fromIndex >= 0 || toIndex >= 0;
      const isVenmoStyleImport =
        normalizedHeaders.includes("datetime") && normalizedHeaders.includes("amounttotal");

      let type: TransactionKind;
      let amount = Math.abs(rawAmount);

      if (!hasHeader) {
        const signedAmountValue = Number.parseFloat(cleanAmountString(rowColumns[1] ?? ""));
        if (looksLikeCreditCardPayment(merchantName, notes)) {
          type = "transfer";
          amount = Math.abs(signedAmountValue);
        } else if (looksLikeStatementCredit(merchantName, notes)) {
          type = "income";
          amount = Math.abs(signedAmountValue);
        } else if (Number.isFinite(signedAmountValue) && signedAmountValue < 0) {
          type = "expense";
          amount = Math.abs(signedAmountValue);
        } else if (looksLikeIncome(merchantName, notes)) {
          type = "income";
          amount = Math.abs(signedAmountValue);
        } else {
          type = "income";
          amount = Math.abs(signedAmountValue);
        }
      } else if (rawCredit > 0 && rawDebit === 0) {
        type = "income";
        amount = rawCredit;
      } else if (rawDebit > 0 && rawCredit === 0) {
        type = "expense";
        amount = rawDebit;
      } else if (looksLikeCreditCardPayment(merchantName, notes)) {
        type = "transfer";
        amount = Math.abs(signedAmountValue || rawAmount);
      } else if (looksLikeStatementCredit(merchantName, notes)) {
        type = "income";
        amount = Math.abs(signedAmountValue || rawAmount);
      } else if (
        isVenmoStyleImport &&
        rawType === "Standard Transfer" &&
        (looksLikeBankAccount(destinationValue) || looksLikeBankAccount(fundingSource))
      ) {
        type = "transfer";
        amount = Math.abs(signedAmountValue || rawAmount);
      } else if (isVenmoStyleImport && Number.isFinite(signedAmountValue) && signedAmountValue !== 0) {
        type = signedAmountValue < 0 ? "expense" : "income";
        amount = Math.abs(signedAmountValue);
      } else if (hasPeerTransferColumns && Number.isFinite(signedAmountValue) && signedAmountValue !== 0) {
        type = signedAmountValue < 0 ? "expense" : "income";
        amount = Math.abs(signedAmountValue);
      } else if (rawType) {
        type = normalizeType(rawType);
      } else {
        if (Number.isFinite(signedAmountValue) && signedAmountValue < 0) {
          type = "expense";
        } else if (looksLikeIncome(merchantName, notes)) {
          type = "income";
        } else {
          type = "expense";
        }
        amount = Math.abs(Number.isFinite(signedAmountValue) && signedAmountValue !== 0 ? signedAmountValue : rawAmount);
      }

      if (amount === 0) {
        return null;
      }

      const finalMerchant =
        hasHeader && normalizeHeader(rowColumns[typeIndex] ?? "") === "payment" && fromValue && toValue
          ? type === "expense"
            ? toValue
            : fromValue
          : merchantName;

      const transaction: Transaction = {
        id: `${date}-${finalMerchant}-${index}`,
        date,
        merchant: finalMerchant,
        amount,
        type,
        account,
        notes,
        category: inferCategory(merchantName, type),
      };

      return transaction;
    })
    .filter((transaction): transaction is Transaction => Boolean(transaction?.date && transaction?.merchant));
};

export const appendTransactionToCsv = (
  currentCsv: string,
  transaction: ManualTransactionInput,
) => {
  const sanitized = [
    transaction.date,
    transaction.merchant,
    transaction.amount.toFixed(2),
    transaction.type,
    transaction.account || "Manual",
    transaction.notes.replace(/,/g, " "),
  ].join(",");

  const trimmed = currentCsv.trim();
  const hasRows = trimmed.length > 0;

  if (!hasRows) {
    return `date,merchant,amount,type,account,notes\n${sanitized}`;
  }

  return `${trimmed}\n${sanitized}`;
};

const transactionFingerprint = (transaction: Transaction) =>
  [
    transaction.date,
    transaction.merchant.toLowerCase(),
    transaction.amount.toFixed(2),
    transaction.type,
    transaction.account.toLowerCase(),
  ].join("|");

export const serializeTransactionsToCsv = (transactions: Transaction[]) => {
  const header = "date,merchant,amount,type,account,notes";
  const rows = transactions.map((transaction) =>
    [
      transaction.date,
      transaction.merchant.replace(/,/g, " "),
      transaction.amount.toFixed(2),
      transaction.type,
      transaction.account.replace(/,/g, " "),
      transaction.notes.replace(/,/g, " "),
    ].join(","),
  );

  return [header, ...rows].join("\n");
};

export const mergeTransactionSets = (...transactionGroups: Transaction[][]) => {
  const merged = new Map<string, Transaction>();

  for (const transactions of transactionGroups) {
    for (const transaction of transactions) {
      merged.set(transactionFingerprint(transaction), transaction);
    }
  }

  return [...merged.values()].sort((left, right) => {
    if (left.date === right.date) {
      return left.merchant.localeCompare(right.merchant);
    }

    return left.date.localeCompare(right.date);
  });
};

export const getTotals = (transactions: Transaction[]) => {
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.amount;
      } else if (transaction.type === "expense") {
        acc.spending += transaction.amount;
      }

      return acc;
    },
    { income: 0, spending: 0 },
  );
};

export const getSourceBreakdown = (transactions: Transaction[]): SourceBreakdown[] => {
  const grouped = new Map<string, SourceBreakdown>();

  for (const transaction of transactions) {
    const source = transaction.account || "Imported";
    const existing = grouped.get(source) ?? {
      source,
      count: 0,
      income: 0,
      spending: 0,
      transfers: 0,
    };

    existing.count += 1;
    if (transaction.type === "income") {
      existing.income += transaction.amount;
    } else if (transaction.type === "expense") {
      existing.spending += transaction.amount;
    } else {
      existing.transfers += transaction.amount;
    }

    grouped.set(source, existing);
  }

  return [...grouped.values()].sort((left, right) => right.count - left.count);
};

export const getFlowSummaries = (transactions: Transaction[]): FlowSummary[] => {
  const flows: TransactionKind[] = ["income", "expense", "transfer"];

  return flows.map((flow) => {
    const matching = transactions.filter((transaction) => transaction.type === flow);
    return {
      label: flow === "income" ? "Income" : flow === "expense" ? "Spending" : "Transfers",
      count: matching.length,
      amount: matching.reduce((sum, transaction) => sum + transaction.amount, 0),
    };
  });
};

export const getCategorySpend = (
  transactions: Transaction[],
  budgets: Budget[],
): CategorySpend[] => {
  const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense");
  const grouped = new Map<string, number>();

  for (const transaction of expenseTransactions) {
    grouped.set(transaction.category, (grouped.get(transaction.category) ?? 0) + transaction.amount);
  }

  const categories = new Set([...budgets.map((budget) => budget.category), ...grouped.keys()]);

  return [...categories]
    .filter((category) => category !== "Income")
    .map((category) => {
      const spent = grouped.get(category) ?? 0;
      const budget = budgets.find((item) => item.category === category)?.limit ?? 0;

      return {
        category,
        spent,
        budget,
        difference: budget - spent,
      };
    })
    .sort((left, right) => right.spent - left.spent);
};

export const getMonthlyTrend = (transactions: Transaction[]): MonthlyPoint[] => {
  const grouped = new Map<string, MonthlyPoint>();

  for (const transaction of transactions) {
    const parsedDate = parseISO(transaction.date);
    if (!isValid(parsedDate)) {
      continue;
    }

    const month = format(parsedDate, "MMM");
    const existing = grouped.get(month) ?? { month, income: 0, spending: 0 };

    if (transaction.type === "income") {
      existing.income += transaction.amount;
    } else {
      existing.spending += transaction.amount;
    }

    grouped.set(month, existing);
  }

  return [...grouped.values()];
};

export const getTopMerchants = (transactions: Transaction[]) => {
  const grouped = new Map<string, number>();

  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    grouped.set(transaction.merchant, (grouped.get(transaction.merchant) ?? 0) + transaction.amount);
  }

  return [...grouped.entries()]
    .map(([merchant, amount]) => ({ merchant, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
};

export const getRecurringCharges = (transactions: Transaction[]): RecurringCharge[] => {
  const grouped = new Map<string, Transaction[]>();

  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    const key = `${transaction.merchant}-${transaction.category}`;
    const existing = grouped.get(key) ?? [];
    existing.push(transaction);
    grouped.set(key, existing);
  }

  return [...grouped.values()]
    .filter((charges) => charges.length >= 2)
    .map((charges) => {
      const sortedCharges = [...charges].sort((left, right) => left.date.localeCompare(right.date));
      const amounts = sortedCharges.map((item) => item.amount);
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

      return {
        merchant: sortedCharges[0].merchant,
        averageAmount,
        chargeCount: sortedCharges.length,
        cadence: "Likely monthly",
        lastChargeDate: sortedCharges.at(-1)?.date ?? sortedCharges[0].date,
        category: sortedCharges[0].category,
      };
    })
    .sort((left, right) => right.averageAmount - left.averageAmount);
};

export const buildInsights = (transactions: Transaction[], budgets: Budget[]): Insight[] => {
  if (transactions.length === 0) {
    return [];
  }

  const totals = getTotals(transactions);
  const categorySpend = getCategorySpend(transactions, budgets);
  const recurringCharges = getRecurringCharges(transactions);
  const topBudgetPressure = categorySpend.find((entry) => entry.difference < 0);
  const topSafeCategory = categorySpend.find(
    (entry) => entry.budget > 0 && entry.spent / entry.budget < 0.7,
  );
  const dining = categorySpend.find((entry) => entry.category === "Dining");

  const insights: Insight[] = [
    {
      id: "savings-rate",
      title: "Net cash flow snapshot",
      description: `You brought in $${totals.income.toFixed(0)} and spent $${totals.spending.toFixed(
        0,
      )}, leaving $${(totals.income - totals.spending).toFixed(0)} available this period.`,
      tone: totals.income > totals.spending ? "good" : "alert",
    },
  ];

  if (topBudgetPressure) {
    insights.push({
      id: "budget-pressure",
      title: `${topBudgetPressure.category} is over budget`,
      description: `Spending in ${topBudgetPressure.category.toLowerCase()} is $${Math.abs(
        topBudgetPressure.difference,
      ).toFixed(0)} over your target. Tightening that category gives you the fastest path to a better month.`,
      tone: "alert",
    });
  }

  if (dining) {
    insights.push({
      id: "dining-trend",
      title: "Dining is your biggest flexible spend",
      description: `Dining added up to $${dining.spent.toFixed(
        0,
      )}. Setting one or two weekly meal limits would create the biggest immediate savings without changing fixed bills.`,
      tone: "neutral",
    });
  }

  if (recurringCharges.length > 0) {
    const recurringTotal = recurringCharges.reduce((sum, charge) => sum + charge.averageAmount, 0);
    insights.push({
      id: "recurring",
      title: "Recurring charges are easy wins to review",
      description: `You have ${recurringCharges.length} likely recurring charges worth about $${recurringTotal.toFixed(
        0,
      )} per cycle. This is a great place for a quick savings audit.`,
      tone: "neutral",
    });
  }

  if (topSafeCategory) {
    insights.push({
      id: "safe-category",
      title: `${topSafeCategory.category} is under control`,
      description: `You are using only ${Math.round(
        (topSafeCategory.spent / topSafeCategory.budget) * 100,
      )}% of your ${topSafeCategory.category.toLowerCase()} budget, which gives you some room to stay flexible elsewhere.`,
      tone: "good",
    });
  }

  return insights;
};
