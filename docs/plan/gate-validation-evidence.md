# DG2/DG3 Approval Validator Evidence

## Purpose

`src/lib/etf/gate-validation.ts` makes the remaining real-data approval conditions executable and deterministic before Forward Validation starts.

## DG2 checks

- Exactly 30 eligible Korean ETFs, ranked by Kiwoom `tradeValue` at `signalAsOf` (descending, ties broken by ticker ascending), with no duplicates. The five approved Korean pilot tickers are pilot-readiness history only; they are not a mandatory member set for the final 30-ETF sample.
- A retained source-backed selection matching the approved sample exactly: `selectorVersion` bound to `DG2_SAMPLE_SELECTOR_VERSION`, `source: "kiwoom"`, a selection-level `asOf` that is a valid ISO date equal to the sample-level `signalAsOf`, a source-snapshot SHA-256 and fetch timestamp that is a valid date-time not before that `asOf` (a later, retained historical capture is expected and permitted), exactly 30 unique members with valid ranks (a 1–30 permutation) in tradeValue-descending/ticker-ascending order, and a member ticker set identical to `approvedTickers`. Every member ticker and every entry of `approvedTickers` must match the six-digit Korean ticker format (`^\d{6}$`), the same pattern the selector itself enforces. Every verification's `signalAsOf` must equal the sample-level `signalAsOf`. An arbitrary 30-ticker array with no such selection, a selection computed for a different `asOf` than the declared signal date, a self-consistent but fabricated selection using non-ticker-shaped identifiers or a pre-signal fetch timestamp, one whose members differ from `approvedTickers`, or verifications spanning more than one signal date, all cannot reach `Go` — this check is non-blocking, so it degrades the decision to `Conditional Go` rather than `No-Go`, keeping an otherwise-complete five-ticker pilot at `Conditional Go`.
- Exactly one verification record for each ETF in the DG2 sample.
- Actual price and benchmark observations for every ticker.
- Valid ISO dates with evaluation end after signal `asOf`, plus no future leakage.
- Distribution source/ex-date verification.
- Strategy-time fundamental and industry-trigger verification.
- Owner/Approver decision.

Missing distributions or strategy inputs produce `Conditional Go`; a five-ticker pilot, an unverified selection, or mismatched signal dates also produce `Conditional Go` through `DG2-SAMPLE-SIZE` and `DG2-SAMPLE-SELECTION`. Missing price data, invalid ordering, an invalid universe, or missing approval produce `No-Go`.

## DG3 checks

- Three-to-five-year real rolling window.
- 2022-style downturn coverage.
- Future-information verification.
- Distribution reinvestment and transaction costs.
- Delisted universe/survivorship assessment.
- Sensitivity review.
- Owner/Approver decision.

Missing non-critical evidence produces `Conditional Go`; missing real window, downturn, leakage verification, or approval produces `No-Go`.

## Forward-validation start rule

`canStartForwardValidation` is true only when DG2, DG3, and DG4 are all `Go`; Conditional Go or a DG4 waiver never silently starts the operating period.

## Verification

```text
npm run test:gate-validation
```
