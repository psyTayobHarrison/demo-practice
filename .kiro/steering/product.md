# Product Overview

## What this is
A personal expense and budget tracker. Log expenses, set a monthly
budget per category, and see a comparison of what was budgeted vs.
what was actually spent.

## Core features
1. **Expenses** — record an expense: amount, category, date, description.
2. **Budgets** — set a spending limit per category, per period (calendar month).
3. **Comparison** — for a given period, show spent vs. budgeted per
   category: remaining amount, percent used, and a status
   (under / close / over budget).

## Domain vocabulary
- **Period**: a calendar month (e.g. "2026-07"). One budget per
  category per period.
- **Category**: a spending bucket (Groceries, Rent, Transport, etc.),
  user-defined, not hardcoded.
- **Over/under budget**: derived, not stored — always computed live
  from expenses + budgets for a period, never cached or persisted.

## Out of scope for now
- No multi-user / auth — single user, no login.
- No recurring-transaction automation yet.
- No bank integration or CSV import yet.
- No multi-currency.

Treat this as a learning project for evaluating the Kiro CLI, not a
production app — favor clear, conventional code over defensive
engineering for hypothetical scale or extra users.