# DG2 Evidence Review Checklist

Use one copy of this checklist per evidence bundle. Do not set a verification flag to `true` until every applicable item is checked and the artifact is listed in the manifest.

## Scope

- [ ] Bundle uses signal date `2026-08-03`.
- [ ] Bundle uses evaluation end `2026-09-08`.
- [ ] Bundle uses `strategy-v0.2` and `KRW`.
- [ ] Pilot bundle covers exactly `069500`, `102110`, `229200`, `360750`, and `133690`.
- [ ] Pilot completion is not recorded as DG2 `Go`; final promotion requires a reviewed sample of exactly 30 eligible ETFs ranked by Kiwoom `tradeValue` at `signalAsOf`, and these five pilot ETFs are pilot-readiness history only, not mandatory final-sample members.
- [ ] Benchmark is `KOSPI200`.

## Distribution evidence — each ETF

- [ ] Official issuer, asset-manager, or approved KRX source.
- [ ] Source directly identifies the ETF ticker and product name.
- [ ] Distribution amount and currency are explicit.
- [ ] Record/ex-date and payment date are explicit or documented as unavailable.
- [ ] Publication/effective date and fetch timestamp are recorded.
- [ ] Raw artifact URL/document ID is recorded.
- [ ] Raw artifact SHA-256 and file size match the manifest.
- [ ] Total-return treatment is documented.

## Strategy-time evidence — each ETF and strategy

- [ ] Momentum and Oversold are separate artifacts.
- [ ] Every raw input field required by `strategy-v0.2` is present.
- [ ] Lookback observation dates are present.
- [ ] Every source was available on or before `2026-08-03`.
- [ ] No post-signal publication or future observation is used.
- [ ] Transformation code/version and calculation trace are recorded.
- [ ] G0-G4 and exclusion reasons are reproducible.
- [ ] Scanner overlap, correlation, and core-industry constraints are recorded when applicable.

## Sample-selection provenance — required for `Go`, not for pilot-readiness

- [ ] `DG2-evidence-input.template.json` sets a single top-level `signalAsOf`, and every verification's `signalAsOf` equals it exactly.
- [ ] `selection.selectorVersion` equals `DG2_SAMPLE_SELECTOR_VERSION` from `src/lib/etf/collection.ts`.
- [ ] `selection.source` is `"kiwoom"`.
- [ ] `selection.asOf` is a valid ISO date and equals the top-level `signalAsOf` exactly — a genuine selection computed for any other date must be rejected, not relabeled.
- [ ] `selection.sourceSnapshot.sha256` and `selection.sourceSnapshot.fetchedAt` are recorded for the retained raw Kiwoom snapshot (the raw bytes themselves stay outside the repository); `fetchedAt` is a valid date-time not before `selection.asOf` (a later, retained historical capture is expected and permitted).
- [ ] `selection.members` has exactly 30 unique tickers with ranks forming a 1–30 permutation, ordered by `tradeValue` descending with ticker-ascending tie-break.
- [ ] Every ticker in `selection.members` and every entry of `approvedTickers` matches the six-digit Korean ticker format (`^\d{6}$`) — non-ticker-shaped placeholders or labels are not eligible members.
- [ ] The `selection.members` ticker set is exactly `approvedTickers` — no substitutions, additions, or omissions.
- [ ] Without a complete, matching `selection`, the non-blocking `DG2-SAMPLE-SELECTION` check fails and DG2 stays `Conditional Go` (never `No-Go`); this is expected and correct for pilot-readiness bundles, including the current five-ticker pilot, which intentionally leaves `selection: null`.

## Decision

- [ ] `dividendVerified` is true only for ETFs passing every distribution check.
- [ ] `strategyInputVerified` is true only for ETFs passing every strategy-input check.
- [ ] Missing data remains `false` or `null`; it is never converted to zero.
- [ ] Owner and Approver are recorded.
- [ ] Decision date is recorded.
- [ ] `npm run test:gate-validation` passes.
- [ ] `npm run typecheck` passes.

Decision: `pending`
