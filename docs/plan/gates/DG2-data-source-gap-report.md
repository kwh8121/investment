# DG2 — Real Data Source Gap Report

## Status

**Conditional Go — price and benchmark evidence is available; distribution and strategy-time input evidence is still missing.**

- Verified: 2026-09-08
- Scope: DG1-approved Korean ETFs `069500`, `102110`, `229200`, `360750`, `133690` and KOSPI200
- No trading or account-mutating command was used.

## Evidence already available

The authenticated read-only Kiwoom CLI is installed at `/home/kwh8121/.local/bin/kiwoomcli` and reports the real profile as callable through `kiwoomcli doctor`.

The following commands successfully returned JSON data for the approved universe:

```text
kiwoomcli domestic etfs daily --code <ETF_CODE> --pages 1 --format json
kiwoomcli domestic etfs info --code 069500 --format json
kiwoomcli domestic etfs profit --code 069500 --index-code 001 --period year --format json
kiwoomcli domestic sectors daily --market kospi200 --code 001 --pages 1 --format json
```

The daily response contains date, close, volume, NAV, ETF/index display difference, and tracking fields. This is sufficient for price-return, benchmark-ordering, and no-future-leakage checks when the signal and evaluation dates are recorded separately.

## Kiwoom limitation

The installed package source and README expose domestic ETF commands for `info`, `daily`, `profit`, `list`, intraday/fills, `nav`, and `foreign-trend`. No command or local API mapping for Korean ETF distribution history, ex-distribution dates, or strategy-time fundamental/industry trigger snapshots was found.

The ETF `info` response currently provides product metadata such as ETF name, target index, face value, and tax type; `profit` provides period return; neither is distribution evidence. The NAV command also does not provide a distribution history.

## Candidate external sources

1. KRX Data Marketplace/Open API
   - Official reference: https://openapi.krx.co.kr/contents/OPP/DATA/OPPDATA002.jsp
   - Candidate role: official ETF EOD, NAV, index, and product reference data.
   - Required verification: access permission, historical availability for the exact approval period, field definitions, and terms of use.

2. Public Data Portal / Financial Services Commission stock dividend information
   - Official reference: https://www.data.go.kr/data/15043284/openapi.do
   - Candidate role: distribution-like corporate dividend records.
   - Limitation: this is issuer-level stock dividend data and is not automatically equivalent to ETF distribution history; ETF mapping and ex-date semantics must be proven before use.
   - License note: the portal identifies the source as Public Nuri Type 2, so intended use and attribution restrictions must be reviewed before production use.

3. DART/official issuer or asset-manager documents
   - Candidate role: strategy-time fundamental inputs, holdings, sector/industry trigger evidence, and distribution notices.
   - Required verification: publication timestamp must be on or before each signal `as_of` date and the document must identify the relevant ETF or underlying instrument.
   - Minimum evidence: retain the original document URI, retrieval timestamp, document hash, and the exact extracted fields.

## KRX access check — 2026-09-08

- Official KRX documentation confirms an ETF/ETN securities data product and EOD distribution surface:
  - https://openapi.krx.co.kr/contents/OPP/DATA/OPPDATA002.jsp
  - https://openapi.krx.co.kr/contents/OPP/DATA/OPPDATA003.jsp
- Existing project evidence in `docs/references/dg1-data-rights-evidence-register-2026-09-07.md` records a redacted-key request to `https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd?basDd=20260904`, returning HTTP 200 and 1,167 ETF rows. The five approved tickers matched Kiwoom on date, close, volume, and NAV.
- This confirms KRX access for historical ETF price/NAV cross-checking, not ETF distribution-history semantics. The recorded `etf_bydd_trd` evidence does not establish distribution amount, ex-distribution date, or payment date.
- `KRX_API_KEY` is present in the local `.env` (the value is not recorded). A new read-only request was made on 2026-09-09 using the same endpoint and returned HTTP 200. The response contained all five approved tickers; credentials are not copied into this report.

## KRX retrieval revalidation — 2026-09-09

The request below was authenticated from the local `.env` without exposing the key:

```text
GET https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd?basDd=20260904
HTTP 200
fetch timestamp: 2026-09-09T03:34:09Z
response size: 553845 bytes
response SHA-256: c92c6e849b6bf2227d663074a0c4691da7fe4dae5ce9729bd7a868c884aa7a5d
```

The selected rows were:

| Ticker   | KRX name            | BAS_DD     |  Close |       NAV |   Volume |
| -------- | ------------------- | ---------- | -----: | --------: | -------: |
| `069500` | KODEX 200           | `20260904` | 105720 | 105733.60 | 20998563 |
| `102110` | TIGER 200           | `20260904` | 105880 | 105956.70 | 10588580 |
| `229200` | KODEX 코스닥150     | `20260904` |  13820 |  13836.96 | 29059015 |
| `360750` | TIGER 미국S&P500    | `20260904` |  25980 |  25944.27 | 37728305 |
| `133690` | TIGER 미국나스닥100 | `20260904` | 176990 | 176257.62 |  2641213 |

This revalidates read-only price/NAV/volume access for the approved universe. It does not establish ETF distribution amount, ex-distribution date, payment date, or total-return semantics, so it does not change `dividendVerified` or the DG2 decision.

## Historical daily capture coverage — 2026-09-11

The following facts are the canonical record of the persisted current-list numeric-candidate Kiwoom bulk capture and the KRX daily snapshots documented in this section. They describe dated snapshots, not a continuous historical series, a final DG2 sample, or a Gate-status change. They do not replace the separate five-ETF-plus-KOSPI200 pilot-period retrieval in `DG2-strategy-validation.md`.

### Kiwoom ETF daily capture

- Requested date: `2026-08-03`.
- Candidate source: the current `ka40004` list contained 1,168 rows; 864 six-digit numeric candidates and 304 unsupported non-numeric identifiers were retained separately.
- Coverage: all 864 numeric candidates had exactly one requested-date daily row; `missing_requested_date = 0`.
- Frozen list SHA-256: `7e945b5986b2b6143202d68dcaaed7b6daf659c498da43f5a8ca9af57b171970`.
- Normalized row fields: `ticker`, `productName`, `date`, `closePrice`, `tradeQuantity`, `nav`, and `tradeValue`. The raw sanitized response retains source fields including `cntr_dt`, `cur_prc`, `trde_qty`, `nav`, and `acc_trde_prica`.
- Raw artifacts are outside Git at `/home/kwh8121/.local/share/stock-market/evidence-bundle/raw/kiwoom-etf-historical-daily/20260803/dg2-20260911/`.

This proves only a single-date numeric-candidate observation. It does not prove the historical universe, ETF/ETN or leverage/inverse classification, listing age, average-trading-value eligibility, `acc_trde_prica` selection semantics, or mappings and historical membership for the 304 unsupported identifiers.

### KRX ETF daily market-data capture

- `2026-09-04`: HTTP 200, 1,167 ETF rows, five approved tickers matched Kiwoom on date, close, volume, and NAV, with raw SHA-256 `c92c6e849b6bf2227d663074a0c4691da7fe4dae5ce9729bd7a868c884aa7a5d`.
- `2026-09-08`: `capture:krx-etf-daily` recorded 1,168 rows with raw SHA-256 `09d381ad522e790d918f7dc73d2f4ee2d3158e5a4909f2e6f706bc60c2c31727`; the external artifact rejects overwrites for that date.
- The validated response contract is `BAS_DD`, `ISU_CD`, `ISU_NM`, `TDD_CLSPRC`, `NAV`, `ACC_TRDVOL`, and `ACC_TRDVAL`. Raw bytes and key-free metadata are stored outside Git.

These are two point-in-time snapshots only. They do not prove a continuous KRX time series, historical Kiwoom universe/eligibility, or cross-source instrument mapping.

### KRX `etf_bydd_trd` 60개 평일 기준일 empirical backfill — 2026-09-11

The latest completed session was fixed at `2026-09-10`; 60 weekday request dates from `2026-06-19` through `2026-09-10` were queried sequentially. The experiment made 60 primary read-only requests and two additional raw-only retries for validator-rejected responses. No request received a rate-limit or other non-success HTTP response.

| Check                                | Observed result                                                                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date-bound responses                 | All 60 `OutBlock_1` payloads were nonempty and every row's `BAS_DD` matched its requested date.                                                                                                                                                 |
| Row count                            | 69,258 rows total; per-date counts ranged from 1,140 to 1,168.                                                                                                                                                                                  |
| Duplicate identifiers                | No date contained duplicate `ISU_CD` values.                                                                                                                                                                                                    |
| Independent listing-count comparison | Not performed: no independently captured historical KRX listing master exists in this evidence bundle. The results are consistent with a date-level full-universe response but do not prove equality to the historical listed-instrument count. |
| `INVSTASST_NETASST_TOTAMT`           | Key present in all 69,258 rows; populated in 66,949 rows and blank in 2,309 rows.                                                                                                                                                               |
| `ACC_TRDVAL`                         | Key present in all 69,258 rows; populated in 66,949 rows and blank in 2,309 rows.                                                                                                                                                               |

The blank values occurred for every row on `2026-07-17` (1,146 rows) and `2026-08-17` (1,163 rows). Both responses also contained blank `TDD_CLSPRC`, `NAV`, and `ACC_TRDVOL`, so the existing normalized capture correctly rejected them. Their raw bytes and key-free metadata are preserved outside Git as `krx-etf-bydd-trd-20260717.unvalidated.json` and `krx-etf-bydd-trd-20260817.unvalidated.json`; the remaining 58 dates used the normal immutable capture path. This is an observed source-data completeness gap, not a rate-limit finding, and it does not change any Gate decision.

## Required input before DG2 Go

For every approved ETF and the approval period, add evidence with:

- distribution source URI or document ID;
- distribution amount and currency;
- ex-distribution or record date;
- source publication/fetch timestamp;
- mapping from the source instrument to the ETF ticker;
- strategy-time Momentum/Oversold inputs;
- industry or market trigger inputs;
- `strategy_version` and `as_of` for those inputs;
- explicit confirmation that no input was published after the signal date.

These fields must populate `Dg2PriceVerification.dividendVerified` and `strategyInputVerified` only after source-level review. Missing or ambiguous evidence remains `Conditional Go`; it must not be replaced with zero values.

## Strategy-time input manifest — `strategy-v0.2`

The implementation contract is defined in `src/lib/etf/strategy.ts`. For each approved ticker at `as_of=2026-08-03`, the evidence bundle must retain the following inputs before `strategyInputVerified` can become `true`:

- Identity and timing: `ticker`, `asOf`, `valuationCurrency=KRW`, `universeFilterVersion`.
- Data quality and eligibility: `qualityStatus`, `dataConfidence`, `isEtf`, `isLeveragedOrInverse`, `liquidityScore`, `portfolioRiskPassed`.
- Thesis and trigger: `fundamentalTriggerPassed`, non-empty `thesisEvidence`.
- Momentum inputs: `relativeStrength1M`, `relativeStrength3M`, `relativeStrength6M`, `momentumAcceleration`, `industryFundamental`, `volumeLiquidity`, `overheatRisk`.
- Oversold inputs: `drawdownDepth`, `drawdownDuration`, `reversalSignal`, `fundamentalRecovery`, `volumeLiquidity`, `dataConfidence`, `structuralDamage`.
- Source trace for every input: source URI/document ID, source field, publication or effective timestamp, fetch timestamp, raw snapshot hash, transformation/version, and reviewer.

The strategy function derives `components`, `score`, `percentile`, `topFivePercent`, G0-G4 results, and exclusion reasons. Those derived values are not substitutes for source evidence. The current function validates ranges and KRW but does not validate that raw lookback observations precede `asOf`; the evidence bundle must therefore include the underlying observation dates and calculation trace for the 1M/3M/6M relative-strength and drawdown windows. Any source first published after `asOf` is a leakage failure.

For scanner-level approval, retain the additional `ScannerCandidate` fields from `src/lib/etf/scanner.ts`: `industry`, `coreIndustry`, `thesisValid`, `overlapRatio`, `portfolioCorrelation`, `radarQualified`, and `radarEvidence`. The fixed scanner limits are maximum overlap `0.5`, maximum portfolio correlation `0.8`, and at most one candidate per core industry.

## Next action

When a closure reopen condition is met, obtain either an approved KRX/Public Data Portal export or a manually reviewed evidence bundle for the five pilot ETFs, then expand the evidence work to the final DG2 sample: exactly 30 eligible Korean ETFs ranked by Kiwoom `tradeValue` at `signalAsOf` (ties broken by ticker ascending), with no actual ticker ranking produced without a retained Kiwoom source snapshot. Then re-run:

```text
npm run test:gate-validation
```

The five-pilot bundle is evidence-readiness history only, not a mandatory member set for the final sample. DG2 may be promoted to `Go` only when the final sample of exactly 30 eligible ETFs, ranked by Kiwoom `tradeValue` at `signalAsOf`, has verified distribution and strategy-time inputs and the Owner/Approver decision is recorded. Until then, do not start DG3 evidence work, Forward Validation, or real-capital deployment.

## Official source discovery snapshot — 2026-09-08

These URLs are source candidates, not yet accepted DG2 evidence. Acceptance still requires fetching the original document, recording its publication/retrieval timestamp and SHA-256, and proving ETF ticker mapping and distribution-date semantics.

| Ticker   | Issuer                   | Official source candidate                                                                                                                        | Current status                                                                                                                   |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `069500` | Samsung Asset Management | https://www.samsungfund.com/etf/product/view.do?id=2ETF01 and the dated product PDF https://m.samsungfund.com/sheet/20260206/2ETF01_20260131.pdf | Product/document candidate located; distribution rows still require extraction and review                                        |
| `102110` | Mirae Asset TIGER ETF    | https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7102110004                                               | Exact official product page and ticker mapping located; distribution notice and dated record still require extraction and review |
| `229200` | Samsung Asset Management | https://www.samsungfund.com/etf/product/view.do?id=2ETF54 and https://www.samsungfund.com/etf/product/distribution.do                            | Product and issuer distribution portal located; dated record still requires extraction and review                                |
| `360750` | Mirae Asset TIGER ETF    | https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7360710008                                               | Exact official product page located; distribution notice and dated record still require extraction and review                    |
| `133690` | Mirae Asset TIGER ETF    | https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7133690008                                               | Exact official product page located; distribution notice and dated record still require extraction and review                    |

The 102110 row is intentionally not marked as verified: an issuer landing page alone does not prove the product-to-ticker mapping or the historical distribution record. Do not set any `dividendVerified` field to `true` from this discovery list alone.

## Official-page retrieval result — 2026-09-08

Anonymous retrieval of the official pages was completed without changing the gate input:

- Samsung KODEX distribution page: https://www.samsungfund.com/etf/product/distribution.do
  - The page identifies itself as the official KODEX ETF distribution-status page, but the anonymous HTML response contained no dated distribution rows for `069500` or `229200`.
- Samsung product pages:
  - `069500`: https://www.samsungfund.com/etf/product/view.do?id=2ETF01
  - `229200`: https://www.samsungfund.com/etf/product/view.do?id=2ETF54
  - Both pages confirmed the official product context, but the distribution data was not present in the anonymous response.
- Mirae Asset annual distribution page: https://investments.miraeasset.com/tigeretf/ko/distribution/annual/list.do
  - The page reported a 2026-09-07 reference date and an annual distribution table, but the anonymous response exposed no ETF rows for the approved tickers (`더보기(0/327)`).
- Mirae Asset `102110` product page: https://investments.miraeasset.com/tigeretf/ko/product/search/detail/index.do?ksdFund=KR7102110004
  - The page confirmed `TIGER 200 (102110)` and states the distribution schedule (quarter-end reference date and payment within seven business days), but it did not expose the historical amount/date row.

Third-party search results reporting amounts for `069500`, `102110`, and `229200` are retained only as leads. They are not official issuer/market evidence and must not set `dividendVerified=true`. No approved ETF currently has source-level distribution verification in `DG2-evidence-input.template.json`.

## External research follow-up — 2026-09-08

The following leads were returned by a source-research pass. They remain unaccepted until the original artifact is fetched, hashed, and reviewed under `DG2-evidence-bundle-procedure.md`.

| Ticker   | Research lead                                                                                                               | Reported details                                                          | Gate treatment                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `069500` | Samsung Fund notice `https://www.samsungfund.com/etf/lounge/notice-view.do?no=78273`                                        | Reported 2026-07-31 record date, 2026-08-04 payment, and KRW 183 per unit | Strong lead; do not verify until the notice is fetched and the row/ticker mapping is hashed and reviewed                                         |
| `102110` | ETFshopping result plus Mirae distribution page `http://investments.miraeasset.com/tigeretf/ko/distribution/annual/list.do` | Reported 2026-07-31 record date, 2026-08-04 payment, and KRW 133 per unit | Third-party only; official table requires authentication. Also resolve the conflicting ISINs `KR7102110003` and `KR7102110004` before acceptance |
| `229200` | StockEvents/Investing results and Samsung product page `https://www.samsungfund.com/etf/product/view.do?id=2ETF54`          | Reported 2026-07-29 ex-date, 2026-08-05 payment, and KRW 28 per unit      | Inferred/third-party only; no official Q3 row located                                                                                            |
| `360750` | Mirae product/distribution pages                                                                                            | No confirmed Q3 2026 amount or date found                                 | No evidence; remains `false`                                                                                                                     |
| `133690` | Mirae product page and third-party schedule                                                                                 | Q2 KRW 235 was reported; Q3 amount was not confirmed                      | Schedule is not a distribution record; remains `false`                                                                                           |

These findings narrow the next external action but do not change the DG2 input template or gate status. In particular, an expected quarterly schedule, an inferred payment date, or a third-party amount is not sufficient to set `dividendVerified=true`.

## Captured artifact — 069500 — 2026-09-08

The Samsung notice HTML and its payment-schedule image are now captured under `docs/plan/gates/evidence-bundle/raw/`. The normalized record is `docs/plan/gates/evidence-bundle/distribution/069500.json`. It records KRW 183, 0.19%, ex-distribution date 2026-07-30, record date 2026-07-31, and payment date 2026-08-04, with SHA-256 values for both raw artifacts. `distributionVerified` remains `false` pending independent reviewer confirmation and total-return treatment.

The official Samsung notice `no=75493` for `229200` was also captured as `docs/plan/gates/evidence-bundle/distribution/229200-april-outside-window.json`. It confirms KRW 28 with a 2026-05-06 payment date, but that date is outside the 2026-08-03 to 2026-09-08 approval window. It is retained as a negative/out-of-window control and does not satisfy DG2.

## Mirae research follow-up — non-official leads only — 2026-09-08

A follow-up search returned third-party aggregator claims for the three Mirae ETFs: `102110` KRW 133, `360750` KRW 66, and `133690` KRW 255, each reporting a 2026-08-04 payment. The cited pages were FunETF, ETFshopping, StockEvents, Investing.com, and similar aggregators; the Mirae official distribution detail page still requires authentication and no official downloadable record was obtained.

These claims are retained as leads only and do not set `dividendVerified=true`. The `133690` result also reused the `KR7102110004` ISIN associated with `102110`, so the product identity is not reliable without Mirae/ KRX confirmation. The next required artifact for each ticker is an authenticated Mirae distribution record or a directly queryable KRX/KIND disclosure with ticker, amount, dates, and source timestamp.

## External research revalidation — 2026-09-09

A follow-up source pass found the following additional leads, but none satisfies the repository's source-level acceptance conditions by itself:

- `102110`: ETFShopping reports KRW 133, a 2026-07-31 reference date, and 2026-08-04 payment completion at <https://etfshopping.com/etf/102110>. This is an aggregator view of attributed depository data, not a retained KSD export or directly fetched official response; no raw artifact, hash, or reviewer record was obtained. Keep `dividendVerified=false`.
- `133690`: a KRX-related disclosure mirror reports a 2026-07-30 distribution ex-date and base price at <https://www.thinkpool.com/item/133690/disclosures/all/566325>. The amount remains conflicting between third-party reports (KRW 255 versus KRW 235), and no official issuer/KRX amount record was captured. Keep `dividendVerified=false`.
- `360750`: a third-party page reports KRW 66 for the 2026-07-31 reference date and 2026-08-04 payment at <https://moneyformer.com/tiger-%eb%af%b8%ea%b5%adsp500>, but no official Mirae, KRX, or KSD record was found. Keep `dividendVerified=false`.

These results narrow the evidence gap but do not change the DG2 decision. The required next artifact remains a directly retained official issuer, KRX/KIND, or KSD record with ticker mapping, amount, dates, retrieval metadata, and SHA-256.

## KRX direct ex-distribution artifacts — 2026-09-09

The KIND issuer-search endpoint was queried directly for the approved ETF codes over 2026-07-20 through 2026-08-05. The following official KRX documents were fetched from their raw `99400.htm` URLs. Each explicitly identifies the product, states `분배락` as the reason, and gives an effective date of 2026-07-30.

| Ticker   | Product             | KIND receipt     | Raw source URL                                                               | Raw SHA-256                                                        | Base price (KRW) |
| -------- | ------------------- | ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------: |
| `069500` | KODEX 200           | `20260729001409` | `https://kind.krx.co.kr/external/2026/07/29/001409/20260729002400/99400.htm` | `d5ea8000b380e4f2c11ea4ec67d86f110f1940991df3ac9eff208eb77ae25074` |           89,425 |
| `102110` | TIGER 200           | `20260729001401` | `https://kind.krx.co.kr/external/2026/07/29/001401/20260729002409/99400.htm` | `958ddb86ded405b358c895083922ea3c15938df63f8774b9064265e187f81ced` |           89,265 |
| `360750` | TIGER 미국S&P500    | `20260729001286` | `https://kind.krx.co.kr/external/2026/07/29/001286/20260729002516/99400.htm` | `5af95cef94efadaed56e2d83d78dd3bd15cde34b940018a26615b01f633aa51d` |           26,590 |
| `133690` | TIGER 미국나스닥100 | `20260729001390` | `https://kind.krx.co.kr/external/2026/07/29/001390/20260729002419/99400.htm` | `6450f765a234acb05ce548a0ca0681077810437471264ce2d3f2442924407cbf` |          177,025 |

`229200` returned no distribution or ex-distribution disclosure in the same search window; only an 2026-08-05 ETF registration/rules-change disclosure was returned. These KRX records are useful official confirmation of product mapping and ex-distribution timing for four ETFs, but they omit distribution amount, record date, payment date, and total-return treatment. They therefore remain supplemental evidence and must not set `dividendVerified=true` or change DG2's Conditional Go verdict.

## Official-source recheck — 2026-09-10

The public KIND issuer-search endpoint was rechecked directly for all five approved ticker identifiers. It reconfirmed the 2026-07-29 ex-distribution-price disclosures for `069500`, `102110`, `360750`, and `133690`, and only the 2026-08-05 registration/rules-change disclosure for `229200`. No queried KIND result supplied a target-ticker distribution amount, record date, payment date, or total-return treatment.

Anonymous retrieval of the official KODEX and TIGER distribution pages likewise exposed page structure but no target-ticker historical detail rows. These are availability observations only; they do not add a new accepted artifact, change any verification flag, or change the DG2 Conditional Go decision.

## TIGER public price-series candidate — 2026-09-10

The official TIGER product-search endpoint resolved `102110` to `KR7102110004`. Its unauthenticated chart endpoint returned daily rows for `2026-02-03` through `2026-08-03` when queried with:

```text
GET https://investments.miraeasset.com/tigeretf/ko/product/chart/prdct-profit-list.ajax?ksdFund=KR7102110004&strtDt=20260203&endDt=20260803&period=6M
```

The response contains `wkdate`, `nav`, `prc`, `jisu`, and `nationPrc` values. It is a candidate raw price/NAV source for price-derived 1M/3M/6M and drawdown calculations only; it does not include distribution amount, record date, payment date, publication timestamp, or the non-price strategy inputs required by the DG2 contract. Before use, retain the exact raw response outside the repository, record its SHA-256 and retrieval metadata, and supply input-level calculation traces and source provenance through the DG2 evidence contract.

The same endpoint was captured for the remaining TIGER ETFs at `2026-09-09T23:42:19Z` (raw responses are outside the repository under `/tmp/opencode/`):

| Ticker   | Official fund ID | Rows | Raw SHA-256                                                        |
| -------- | ---------------- | ---: | ------------------------------------------------------------------ |
| `102110` | `KR7102110004`   |  120 | `7861b6f82ae5bbe3f4b3910d1d7108c2caa43dc14cb5f236b68c4f527b6621be` |
| `360750` | `KR7360750004`   |  118 | `a51a4c3d73643a70b9c2e057caaa70c0c70e9e34f8693546e6d883d3bd119cc9` |
| `133690` | `KR7133690008`   |  118 | `50d17174c5131b5a0716a072eb7315408e81d95a3fdff763f7b6bb82778a25d4` |

All three responses span from `2026-02-03` to `2026-08-03`. They are candidate price-series captures, not accepted strategy artifacts: the response format provides derived percentage series and does not by itself prove the required raw price observations, distribution treatment, non-price inputs, or per-input reviewer provenance.

## Current-access closure — 2026-09-10

The following evidence-acquisition paths are closed for the current anonymous/public-access environment. “Closed” records an exhausted path; it does not mean the DG2 requirement is met or that any verification flag may change.

| Evidence scope                            | Current result                                        | Closure reason                                                                                                                                                                                        | Reopen condition                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `102110`, `360750`, `133690` distribution | No accepted official amount/date artifact             | Public TIGER list/chart responses omit distribution amount, record/ex-date, payment date, and publication metadata; detail history requires authenticated access or a per-notice official document ID | Authenticated official distribution export, official notice HTML/PDF, or directly queryable KRX/KIND/KSD record with all required fields |
| `229200` distribution                     | No approved-window artifact                           | KIND returned only the 2026-08-05 registration/rules-change notice; the captured Samsung April payment is outside the approval window                                                                 | Official in-window distribution document with ticker, amount, dates, and source metadata                                                 |
| `069500` distribution                     | Source artifact retained but not accepted             | Independent review found no documented total-return window convention, incomplete manifest/reviewer fields, and raw-origin storage outside the required location                                      | Resolve total-return convention, complete manifest/reviewer record, and place originals outside the repository before a new review       |
| 5 ETF strategy inputs                     | Price candidates only; no accepted 5×2 evidence batch | Public price/NAV captures do not supply all non-price inputs, input-level publication provenance, reviewer identity, or complete calculation traces                                                   | Approved raw price export plus source-backed industry, quality, eligibility, trigger, and risk inputs for all 10 artifacts               |

No current-access closure changes `dividendVerified`, `strategyInputVerified`, the manifest decision, or DG2's `Conditional Go` status. DG3 and Forward Validation remain blocked until a reopened path produces a complete reviewed bundle.
