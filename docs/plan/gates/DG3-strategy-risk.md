# DG3 — Strategy and Risk Gate

## Status

**Implementation complete — operational gate is No-Go until real multi-year evidence is supplied**

**Machine status: No-Go** — `DG3-evidence-input.template.json`과 `evaluateDg3`의 계산 결과가 권위 상태다.

Task 012 provides the rolling backtest and risk-management contract in `src/lib/etf/risk.ts`, but this is not a final Go decision.

`src/lib/etf/dg3-evidence.ts` validates raw-byte SHA-256, publication/fetch chronology, observation dates, and retains provenance alongside normalized backtest observations. It is an evidence boundary, not a substitute for real multi-year data.

## Implemented evidence

- Rolling windows with fixed strategy, universe, benchmark, and backtest versions.
- KRW gross/net return separation with transaction costs.
- Maximum drawdown, recovery period, turnover, benchmark excess, FX/dividend contribution, and market/industry dependence.
- Portfolio limits: 1,000만원 capital basis, maximum 3 positions, 30%/300만원 per ETF, 90% invested, 60% US exposure, and 8% individual risk.
- Loss actions at -8%, -10%, -15%, and -20%.
- Future-information ordering remains enforced by the existing backtest observation validation.

## 실행 가능한 판정기

- 구현: `src/lib/etf/gate-validation.ts`
- 검증: `npm run test:gate-validation`
- 입력 템플릿: `docs/plan/gates/DG3-evidence-input.template.json`
- 원칙: 실제 기간·하락장·누수 검증·승인 누락은 `No-Go`로 구분한다.

## Remaining approval conditions

1. Run 3–5 year rolling windows on approved real data.
2. Include a 2022-style downturn and verify recovery periods.
3. Connect actual distribution-reinvestment and transaction-cost data.
4. Assess delisted instruments and survivorship bias.
5. Review sensitivity for percentile, liquidity, overlap, correlation, and benchmark assumptions.
6. Obtain Owner/Approver decision before DG3 Go.
