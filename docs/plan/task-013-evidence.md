# Task 013 — Product Alpha Evidence

## Scope

The home route now exposes a functional internal ETF guide dashboard under the Signal/Guide product shell.

Implemented in `src/components/product-dashboard.tsx`:

- Data Status with `as_of`, approved-universe count, quality flags, and raw-snapshot state.
- Strategy Scanner with percentile, score, return, strategy, and candidate status.
- Weekly Guide with immutable snapshot ID, Thesis, Trigger, Invalidation, and risk contract.
- ETF-level candidate details embedded in scanner and guide views.
- Paper Portfolio with KRW market value, unrealized P/L, cash reserve, and simulated add/reduce controls.
- Price, FX, and dividend contribution display.
- Responsive tab navigation for Overview, Scanner, Weekly Guide, and Paper Portfolio.
- Explicit simulation-only messaging; no real orders are sent.

The implementation intentionally displays DG2/DG3 as conditional evidence states rather than presenting them as final Go decisions.

## Verification

```text
npm run typecheck
npm run lint
npm run build
```

All three commands passed after removing an unused icon import; targeted Prettier and LSP diagnostics also passed.
