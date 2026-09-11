# DG2 — 전략 방향성 판정

## 판정 상태

**Conditional Go — 사용자 승인 완료, 실제 승인 기간 데이터 검증 조건부**

**Machine status: Conditional Go** — `DG2-evidence-input.template.json`과 `evaluateDg2`의 계산 결과가 권위 상태다.

- 판정일: 2026-09-08
- Approver: 사용자
- 승인 조건: `signalAsOf` 기준 Kiwoom `tradeValue` 상위 30개 적격 한국 ETF 표본(정확히 30종)에 대해 실제 승인 기간 데이터·분배금·전략 시점 입력을 검증하고 Owner/Approver가 결과를 재확인한다.

Task 008의 실행 계약과 검증 코드는 완료했지만, 현재 입력은 DG1에서 승인한 한국 ETF 5개를 기반으로 한 결정론적 pilot fixture다. 이 5개 pilot ETF는 최종 DG2 표본의 필수 구성원이 아니라 pilot-readiness 이력으로만 보존한다. 최종 DG2 표본은 `signalAsOf` 시점 Kiwoom `tradeValue` 기준 상위 30개 적격 ETF로 정확히 30종을 선정하며, 실제 종목명은 원문 스냅샷을 보존한 뒤에만 확정한다. 그 표본과 실제 증거·검토가 완성되기 전에는 DG2 Go 판정으로 간주하지 않는다.

## 검증 범위

- DG1 승인 한국 ETF 5개(`069500`, `102110`, `229200`, `360750`, `133690`)
- Momentum/Oversold 독립 실행 및 후보 집합 분리
- 상위 퍼센타일 `90/95/97.5` 민감도
- 유동성 최소값 `60/80` 민감도
- KRW 가격수익률, 환율 기여도 0 확인, 분배금 기여도, 최종 KRW 총수익률 분리
- 산업·시장·기간 집중 시 과적합 경고

## 증거

- 구현: `src/lib/etf/backtest.ts`
- 테스트: `test/etf-backtest.test.ts`
- 실행 명령: `npm run test:task-008`
- 회귀 명령: `npm run test:task-005`, `npm run test:task-006`, `npm run test:task-007`

현재 fixture 검증 결과:

- Task 008 테스트 5개 통과
- Task 005~007 회귀 테스트 12개 통과
- Momentum과 Oversold가 서로 다른 후보 집합으로 실행됨
- 6개 컷·유동성 조합이 모두 계산됨
- 상위 후보의 벤치마크 대비 초과수익과 KRW 기여도 분해가 계산됨
- 집중 fixture에서 과적합 경고 3종이 발생함

기준 설정(`percentileCutoff=95`, `liquidityMinimum=70`)의 fixture 결과:

| 전략     | 선택 후보 | 전략 KRW 수익률 | 벤치마크 | 초과수익 | 환율 기여 |
| -------- | --------- | --------------: | -------: | -------: | --------: |
| Momentum | `133690`  |          0.0383 |   0.0300 |   0.0083 |         0 |
| Oversold | `069500`  |          0.0302 |   0.0300 |   0.0002 |         0 |

민감도 결과에서 Momentum은 90·95 컷에서 1개 후보와 0.0083 초과수익을 유지했지만, 97.5 컷에서는 후보가 0개가 되어 -0.0300으로 계산됐다. 이는 상위 컷을 과도하게 올리면 추천 후보가 사라질 수 있음을 보여준다.

## 실제 기간 데이터 검증 — 2026-09-08

키움 REST 조회 전용 명령으로 승인된 한국 ETF 5개와 KOSPI200 지수의 일봉을 순차 수집했다. 기준 구간은 `2026-08-03` 신호 시점부터 `2026-09-08` 평가 종료 시점이며, 모든 종료일은 신호일 이후다.

수집 명령은 다음 패턴을 사용했다.

```text
kiwoomcli domestic etfs daily --code <ETF_CODE> --pages 0 --format json
kiwoomcli domestic sectors daily --market kospi200 --code 001 --pages 5 --format json
```

| 종목     | 시작 종가 | 종료 종가 | 가격수익률 | KOSPI200 대비 |
| -------- | --------: | --------: | ---------: | ------------: |
| `069500` |    99,105 |   113,420 |  +14.4443% |     +0.5719%p |
| `102110` |    99,360 |   113,670 |  +14.4022% |     +0.5299%p |
| `229200` |    12,470 |    14,080 |  +12.9110% |     -0.9613%p |
| `360750` |    26,700 |    25,577 |   -4.2060% |    -18.0783%p |
| `133690` |   180,335 |   175,727 |   -2.5552% |    -16.4275%p |
| KOSPI200 |  6,257.45 |  7,125.50 |  +13.8723% |          기준 |

### 실제 데이터 검증 결과

- **통과:** 5개 승인 종목 모두 기간 시작일·종료일의 실제 일봉이 존재한다.
- **통과:** 평가 종료일(`2026-09-08`)은 신호일(`2026-08-03`) 이후이므로 이 기간 계산에서 미래 시점 역전은 확인되지 않았다.
- **통과:** KOSPI200 대비 초과성과를 종목별로 계산할 수 있다.
- **미충족:** 키움 ETF 일봉 응답만으로는 해당 기간 분배금 이력을 확정할 수 없어 총수익률이 아닌 가격수익률 검증이다.
- **미충족:** 실제 전략별 펀더멘털·산업 Trigger 입력과 신호 시점의 전략 점수는 별도 수집이 필요하다.

따라서 실제 기간 가격 검증은 완료했지만, 분배금·전략 입력이 없는 상태에서 DG2를 최종 Go로 승격하지 않는다.

## 전략 증거 캡처 경로 (미검증)

`src/lib/etf/dg2-evidence.ts`와 `src/lib/etf/krx-dg2-adapter.ts`는 `StrategyInput`(`src/lib/etf/strategy.ts`)이 요구하는 값 전체에 대해 **입력 하나당** provenance를 요구하는 타입 계약과 KRX 어댑터를 제공한다. `npm run test:dg2-evidence`, `npm run test:dg2-adapter`로 검증한다.

- **입력별(per-input) provenance**: 하나의 아티팩트는 `Dg2StrategyInputEvidence[]`로 구성되며, 각 원소는 `field`/`value`와 자신만의 `source`(`sourceUri`, `sourceField`, `publishedAt`, `effectiveAsOf`, `fetchedAt`, `transformVersion`, `reviewer`, `sourceSha256`)를 갖는다. 서로 다른 입력이 서로 다른 원문에서 왔다면 그 차이가 그대로 보존된다(하나의 공유 원문에서 여러 필드를 추출한 경우에는 동일한 `sourceSha256`을 재사용할 수 있다).
- **`StrategyInput` 전체 필드 커버리지**: 점수 계산에 쓰이는 수치 필드뿐 아니라 `ticker`, `asOf`, `valuationCurrency`, `universeFilterVersion`, `qualityStatus`, `isEtf`, `isLeveragedOrInverse`, `portfolioRiskPassed`, `fundamentalTriggerPassed`, `thesisEvidence` 같은 비-점수 식별·자격 필드도 각각 자기 provenance를 가진 입력으로 요구한다(`DG2-data-source-gap-report.md:101-108` 매핑).
- **Momentum/Oversold 아티팩트 분리 + 결정론적 병합 규칙**: 한 아티팩트는 정확히 하나의 `strategy`('momentum' 또는 'oversold')에 속하며, 다른 전략 전용 필드를 포함할 수 없다. `normalizeDg2StrategyEvidenceBatch`는 승인된 한국 ETF 5개(`069500`, `102110`, `229200`, `360750`, `133690`) × Momentum/Oversold = 정확히 10개 아티팩트를 요구하고, 누락·중복·미승인 종목을 모두 거부한다. 이후 같은 종목의 Momentum 아티팩트와 Oversold 아티팩트를 **병합**해 `src/lib/etf/strategy.ts`의 `StrategyInput` 24개 필드를 모두 채운 객체를 만든다 — 두 아티팩트가 공유하는 13개 공통 필드(`ticker`, `asOf`, `valuationCurrency`, `universeFilterVersion`, `qualityStatus`, `dataConfidence`, `isEtf`, `isLeveragedOrInverse`, `liquidityScore`, `portfolioRiskPassed`, `fundamentalTriggerPassed`, `thesisEvidence`, `volumeLiquidity`)의 값이 서로 다르면 병합을 거부한다(pair-consistency 규칙). 병합 결과는 실제 `evaluateStrategies()`에 그대로 투입해 검증한다(테스트에서 직접 호출해 통과를 확인).
- **1M/3M/6M·drawdown lookback 구간**: `relativeStrength1M`/`relativeStrength3M`/`relativeStrength6M`/`drawdownDepth`/`drawdownDuration` 다섯 필드는 `observationStart`~`observationEnd` 관측 구간이 필수다. 구간이 역전되었거나 `observationEnd`가 신호일(`asOf`) 이후면 거부한다.
- **계산 trace(`formula`)**: 모든 입력은 값을 어떻게 얻었는지 설명하는 비공백 `formula` 문자열을 가져야 한다.
- **배치 고정값**: `normalizeDg2StrategyEvidenceBatch`는 열 개 아티팩트 전부가 `asOf='2026-08-03'`, `strategyVersion='strategy-v0.2'`(`DG2_PINNED_AS_OF`/`DG2_PINNED_STRATEGY_VERSION`)를 정확히 사용해야 하며, 다른 신호일이나 다른 전략 버전은 거부한다(`DG2-evidence-review-checklist.md:7,9`와 일치).
- **캡처된 원본과 정규화 메타데이터의 분리**: 각 입력의 `sourceSha256`은 그 입력의 계산값이나 메타데이터를 재인코딩해 얻지 않고, 별도로 공급된 캡처 원본 바이트(`sourceBytes`)를 직접 해시해서만 검증한다. 발행(`publishedAt`)은 신호일(`asOf`) 이전, 관측 시점(`effectiveAsOf`)은 신호일 이후일 수 없고, 수집(`fetchedAt`)은 발행 이후·현재 이전이어야 한다.
- **영속 산출물에서 원본 바이트의 구조적 배제**: 모든 중첩 단계(아티팩트 → 입력 배열 → source)에서 필드를 하나씩 명시적으로 선택해 만든다(object spread 없음). `Dg2PersistableStrategyEvidence`/`Dg2PersistableStrategyInputEvidence`/`Dg2PersistableSourceRecord` 타입 자체에 원본 바이트 필드가 없으며, 다른 이름으로 주입된 raw byte 페이로드도 화이트리스트 밖이라 걸러진다(적대적 테스트로 검증).
- **출처 URI 위생**: `sourceUri`는 자격 증명(userinfo)·쿼리 문자열·fragment를 포함할 수 없고 `https`만 허용하며, KRX 어댑터는 추가로 승인된 KRX 호스트 접두사만 허용한다.

이 경로는 아직 다섯 승인 ETF의 실제 캡처 원본 바이트를 채워 넣지 않았다 — 위 검증은 fixture로만 확인했다. 즉 이 모듈이 존재한다고 해서 `DG2-evidence-input.template.json`의 `strategyInputVerified` 값이 바뀌지 않으며, 여전히 다섯 종목 모두 `false`다. 이 계약을 이용해 실제 원문을 채워 넣고 재계산·리뷰까지 마친 뒤에만 §"실제 Go 판정 전 조건"의 절차에 따라 해당 값을 올릴 수 있다.

## 실행 가능한 판정기

- 구현: `src/lib/etf/gate-validation.ts`
- 검증: `npm run test:gate-validation`
- 원칙: 실제 가격·순서·유니버스 오류는 `No-Go`, 분배금·전략 입력 미완료는 `Conditional Go`로 명시한다.

## 실제 Go 판정 전 조건

1. `signalAsOf` 시점 Kiwoom `tradeValue` 기준 상위 30개 적격 한국 ETF로 정확히 30종 표본을 확정한다(다섯 pilot ETF는 이력일 뿐 필수 구성원이 아니다).
2. 위 실제 기간 데이터에 분배금 원천·기준일을 연결한다.
3. 신호 시점의 Momentum/Oversold 입력과 `strategy_version`을 연결한다.
4. API 원천 시점과 `as_of` 누수를 다시 점검한다.
5. 실제 결과와 산업·기간별 분해를 검토한다.
6. 변별력·민감도·과적합 결과를 Owner/Approver가 최종 승인한다.

Conditional Go 승인으로 Task 008의 판정 절차는 통과했지만, 실제 승인 기간 데이터 확인 전에는 Task 009 Scanner·Top 3 화면 확장을 시작하지 않는다. 미국 ETF는 DG1의 별도 No-Go가 해소될 때까지 포함하지 않는다.

## Current-access evidence closure — 2026-09-10

Anonymous public-source collection and local contract validation have been exhausted. The remaining distribution and strategy-input requirements are not satisfied; `docs/plan/gates/DG2-data-source-gap-report.md` records the closed current-access paths and their precise reopen conditions. This closure is operational only: DG2 remains `Conditional Go`, `dividendVerified` and `strategyInputVerified` remain `false`, and neither DG3 nor Forward Validation may start.
