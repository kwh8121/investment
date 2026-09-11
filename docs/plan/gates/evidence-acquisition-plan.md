# DG2/DG3 Evidence Acquisition Plan

실제 DG2 번들 작성 절차와 검토 체크리스트는 [`DG2-evidence-bundle-procedure.md`](./DG2-evidence-bundle-procedure.md)를 따른다.

## Decision rule

Do not promote a gate because a source exists. Promote it only when every required field has a source record, an effective date, a fetch/publication timestamp, a reproducible transformation, and an Owner/Approver decision.

## Final DG2 sample rule

The final DG2 sample is exactly 30 eligible Korean ETFs, ranked by Kiwoom `tradeValue` at `signalAsOf` (ties broken by ticker ascending). The current five-ticker pilot (`069500`, `102110`, `229200`, `360750`, `133690`) is retained only as pilot-readiness history; it is not a mandatory member set for the final 30-ETF sample, and no actual ticker ranking may be produced without a retained Kiwoom source snapshot.

`src/lib/etf/gate-validation.ts` enforces this mechanically through the non-blocking `DG2-SAMPLE-SELECTION` check on `Dg2ApprovalInput.selection` and `Dg2ApprovalInput.signalAsOf`. Populate `selection` with `selectorVersion` (bound to `DG2_SAMPLE_SELECTOR_VERSION`), `source: "kiwoom"`, `asOf` (the selector's own as-of date — must be a valid ISO date equal to the sample-level `signalAsOf`, so a genuine selection computed for a different date is rejected), a `sourceSnapshot` (`sha256`, and `fetchedAt` — a valid date-time that must not be before that `asOf`; a later, retained historical capture is expected and permitted), and exactly 30 `members` (`ticker`, `tradeValue`, `rank`) matching `approvedTickers` exactly and the ranking rule above. Every member ticker and every entry of `approvedTickers` must match the six-digit Korean ticker format the selector itself enforces, so self-consistent but fabricated identifiers cannot pass. Set `signalAsOf` once at the sample level so it can be compared against every verification's own `signalAsOf`. An arbitrary 30-ticker array with no such `selection`, a `selection` computed for a mismatched `asOf`, a `selection` using non-ticker-shaped identifiers or a pre-signal `fetchedAt`, a `selection` whose members differ from `approvedTickers`, or verifications spanning more than one signal date all fail this check and keep DG2 at `Conditional Go` — never `No-Go`, so an otherwise-complete five-ticker pilot is unaffected. Only a genuinely source-backed, date-matching, ticker-format-valid, single-date selection can clear this check toward `Go`.

## Phase 1 — Freeze the approval scope

Create one immutable manifest for the current approval period:

- Universe: the final `kiwoom-trade-value-top-30` sample — exactly 30 eligible Korean ETFs selected by `selectDg2SampleByTradeValue` from a retained Kiwoom source snapshot at `signalAsOf`, ranked by `tradeValue` descending with ticker-ascending tie-break. Do not hard-code actual ticker values into the manifest before that snapshot is captured and reviewed.
- Benchmark: KOSPI200
- Signal date: `2026-08-03`
- Evaluation end: `2026-09-08`
- Strategy versions: the exact Momentum/Oversold version used for the signal
- Required output: source URI/document ID, `as_of`, fetched/publication timestamp, SHA-256, and reviewer, plus the selector's selection metadata (`selectorVersion`, `sampleSize`, per-ticker `rank` and `tradeValue`) sufficient to reproduce the frozen ranking

The five-ETF pilot (`069500`, `102110`, `229200`, `360750`, `133690`) is retained separately as pilot-readiness history only; it is not the Universe for the frozen manifest and its membership in the final 30-ETF sample is not assumed.

The Kiwoom daily responses already cover price and benchmark observations; retain the raw JSON and a normalized summary without credentials or account identifiers.

## Phase 2 — Close DG2 distribution evidence

Use this source priority:

1. ETF issuer or asset-manager distribution notice and official product documents.
2. KRX ETF reference/event data after access is approved and the field semantics are confirmed.
3. Public Data Portal dividend data only as corroborating evidence; it is issuer-level stock dividend data and is not sufficient by itself to prove ETF distributions.

For each ETF, record:

- distribution amount and currency;
- ex-distribution/record date and payment date when available;
- source URL or document identifier;
- publication date and fetch timestamp;
- mapping proof from the source product to the ETF ticker;
- whether the distribution is included in total return or must be added separately.

If a source cannot prove ETF-level distribution semantics, leave `dividendVerified=false`; never convert the missing amount to zero.

## Phase 3 — Close DG2 strategy-input evidence

For each signal date and each strategy, freeze the input snapshot used to calculate the score:

- Momentum inputs and lookback window;
- Oversold inputs and lookback window;
- strategy version and configuration;
- underlying ETF constituents or proxy data;
- industry/market trigger source;
- publication timestamp not later than `signalAsOf`;
- transformation code/version and reviewer.

Any input first published after the signal date is invalid for the signal and must produce a leakage finding.

## Phase 4 — Build DG3 real-risk evidence

Acquire a 3–5 year daily history for the approved universe and benchmark, including:

- price/NAV and distribution-reinvestment treatment;
- transaction costs, spread, and turnover assumptions;
- 2022-style downturn coverage or an explicitly documented comparable stress period;
- delisted instruments and historical universe membership to assess survivorship bias;
- sensitivity runs for percentile cutoff, liquidity floor, overlap, correlation, benchmark, and cost assumptions.

The backtest output must retain raw source references and version identifiers for every window. A fixture or current five-week window cannot satisfy DG3.

## Phase 5 — Evidence review and gate decision

1. Validate source dates and SHA-256 manifests.
2. Re-run normalization and calculations from raw inputs.
3. Populate `DG2-evidence-input.template.json` and `DG3-evidence-input.template.json`.
4. Run `npm run test:gate-validation`.
5. Review blocking and conditional reasons; do not override them in documentation.
6. Record Owner/Approver and decision date in the DG2/DG3 gate documents.
7. Start Forward Validation only when DG2, DG3, and DG4 all return `Go`.

## Current blocker

The Kiwoom CLI currently supplies the price, benchmark, ETF metadata, profit, and NAV surfaces but not ETF distribution history or strategy-time fundamental/industry snapshots. Phases 2 and 3 are suspended for the current anonymous/public-access environment: do not repeat the same KIND, issuer-page, or public chart lookups. `DG2-data-source-gap-report.md` is the authoritative current-access closure and lists the only reopen conditions. No code-level gate bypass is appropriate.
