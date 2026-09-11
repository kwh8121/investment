# Forward Validation Operating Log

## Start contract

- Start date: pending computed DG4 Go.
- Universe: DG1-approved Korean ETF universe only.
- Strategy version: `strategy-v0.2`.
- Backtest/risk versions: `backtest-v0.1`, `risk-v0.1`.
- Evaluation horizons: 1, 2, 4, and 8 weeks.
- Mode: paper simulation only; no real capital deployment.

## Required fields per recommendation

- Immutable guide and raw snapshot IDs.
- Strategy, score, percentile, strategy version, and universe version.
- Thesis, entry/add trigger, risk, and invalidation.
- `as_of`, approval time, and benchmark.
- Future outcome price, benchmark return, MFE, MAE, and excess return at each horizon.
- Error code when an outcome is misclassified: `DATA`, `SIGNAL`, `THESIS`, `EXECUTION`, or `EXTERNAL`.

## Implementation

- Snapshot and evaluation ledger: `src/lib/etf/forward-validation.ts`.
- Verification: `test/forward-validation.test.ts`.
- Records are append-only; corrections require a new guide version and new validation snapshot.

## Current status

The ledger contract and deterministic tests are ready, but the operating period should not be declared started until the executable DG2, DG3, and DG4 validators all return `Go`.
