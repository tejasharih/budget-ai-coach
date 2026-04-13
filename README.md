# Budget AI Coach

Budget AI Coach is a local-first personal finance dashboard that ingests real CSV statement exports, separates income from spending and internal transfers, and layers in AI-ready budgeting insights.

It was built as a portfolio-quality project around a real user problem: making sense of checking, credit-card, and Venmo activity without paying for bank-aggregation APIs.

## What the project does

- Imports transaction exports from multiple sources into one merged ledger
- Supports real-world CSV quirks like headerless exports, quoted fields, signed amounts, and bank-specific column names
- Distinguishes between:
  - income
  - spending
  - internal transfers
- Shows dashboard metrics, recurring charges, source/account breakdowns, category trends, and transaction history
- Includes an AI coach with:
  - local fallback logic
  - optional live LLM mode through an API key stored only in browser local storage

## Why this project is strong

- Built around actual financial workflows rather than toy data
- Demonstrates parsing, normalization, deduplication, and accounting logic
- Handles ambiguous financial events like:
  - credit-card bill payments
  - statement credits
  - Venmo peer-to-peer flows
  - Venmo bank transfers
- Balances product thinking, frontend UX, and data logic

## Current feature set

- Multi-CSV import with ledger merging
- Local persistence through `localStorage`
- Manual transaction entry
- Income / spending / transfer accounting
- Category and monthly trend charts
- Recurring-charge detection
- Merchant-level spend ranking
- Source/account breakdowns
- AI-style budgeting insights
- Optional real API-backed coach mode

## Supported import patterns

The app is currently tuned around the formats used during development:

- Wells Fargo checking-style headerless exports
- Discover CSV exports
- Venmo monthly statement exports
- Simple normalized CSVs in the shape:

```csv
date,merchant,amount,type,account,notes
2026-04-12,Whole Foods,79.55,expense,Chase Freedom,Weekly groceries
2026-04-12,Payroll Deposit,640.00,income,Chase Checking,Part-time job
```

## Accounting rules in the app

The dashboard intentionally avoids treating every money movement as spending.

- Purchases are counted as spending
- Paychecks, reimbursements, and incoming Venmo money count as income
- Credit-card bill payments are treated as transfers
- Venmo transfers to a bank account are treated as transfers
- Statement credits and cashback-style credits are excluded from spending

That distinction is important because otherwise linked-account CSV imports can double count the same money movement.

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Suggested next improvements

1. Add filters by account, month, and transaction type
2. Show imported-file history and per-file summaries
3. Add editable category rules and merchant overrides
4. Improve charting for longer time windows
5. Move live AI requests behind a small backend proxy for safer key handling

## Resume framing

Example SWE framing:

- Built a local-first personal finance dashboard that parsed and normalized multi-account CSV exports, separated spending from transfers, and surfaced budget insights across checking, credit-card, and peer-to-peer payment activity.

Example AI framing:

- Developed an AI-ready budgeting assistant that combined deterministic financial normalization with optional LLM-backed natural-language coaching over user transaction history.

Example product framing:

- Designed a budgeting workflow that helped users understand real spending behavior by distinguishing true expenses from internal account transfers and statement credits.
