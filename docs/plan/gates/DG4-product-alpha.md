# DG4 — Product Alpha Readiness

## Status

**Implementation QA passed — operational gate is No-Go until upstream gates and approval complete**

**Machine status: No-Go** — `DG4-evidence-input.json`과 `evaluateDg4`의 계산 결과가 권위 상태다.

## Verified

- Task 005–012 tests pass.
- Task 014 smoke checks pass for deterministic re-execution, immutable correction versions, and hard-stop thresholds.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Targeted Prettier, LSP diagnostics, and `git diff --check` pass.
- Task 013 dashboard includes Data Status, Scanner, Weekly Guide, ETF detail context, Paper Portfolio, responsive layouts, and semantic tab accessibility attributes.
- Forward validation ledger fixes guide snapshots and records 1/2/4/8-week outcomes, MFE, MAE, benchmark excess, and error codes append-only.

## Remaining conditions

1. Resolve DG2 actual distribution/fundamental-input validation.
2. Resolve DG3 real multi-year rolling backtest and downturn evidence.
3. Keep `npm run check-all` green, including machine-status synchronization.
4. Record approved exceptions and operational burden before alpha start.
5. Obtain Owner/Approver decision after DG2 and DG3 are `Go`.
