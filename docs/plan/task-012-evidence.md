# Task 012 — Rolling Backtest and Risk Evidence

## Scope

Task 012 adds rolling backtest and risk-management primitives without claiming a final DG3 Go before approved real-universe validation.

Implemented in `src/lib/etf/risk.ts`:

- Separate rolling windows with strategy-versioned backtest results.
- Transaction-cost deduction after gross KRW return.
- Explicit survivorship-bias note when delisted instruments are absent.
- Maximum drawdown, recovery days, turnover, benchmark excess, FX dependence, dividend contribution, and market/industry concentration metrics.
- Portfolio limits for capital, maximum three positions, 30%/3,000,000 KRW per ETF, 90% invested weight, 60% US weight, and 8% individual risk.
- Loss stages at -8%, -10%, -15%, and -20% with explicit actions and hard-stop handling.

## Verification

```text
npm run test:task-012
```

The tests cover rolling windows and costs, drawdown and recovery, dependency metrics, portfolio limits, and loss-stage actions.

## Gate status

The implementation and deterministic tests are complete, but DG3 remains pending real multi-year data, 2022 downturn coverage, delisted-instrument assessment, and Owner/Approver review.
