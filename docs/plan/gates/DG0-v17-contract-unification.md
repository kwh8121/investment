# DG0 v1.7 계약 통일 — 증거 준비 기록

> **Gate:** DG0 계약 통일<br>
> **기준 스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`<br>
> **상태 (2026-09-14):** 증거 준비 중 — 판정 없음<br>
> **Owner:** 미지정<br>
> **Approver:** 미지정

## 확인된 정합성 상태

| 영역           | 직접 관찰한 증거                                                                                                                                             | v1.7 해석                              | 필요한 조치                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------- |
| 현행 제품 스펙 | `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`는 v1.7 Final이며 P0-01~07, DG0~DG4를 정의                                                                      | 현행 정본                              | 변경 없음                                    |
| 이전 PRD       | `docs/PRD.md`는 v1.2, P0-01~10, 한·미 ETF, 환율·분배금·총수익을 정의                                                                                         | 역사적 참조                            | v1.7 정본을 가리키는 상태 표기 완료          |
| 이전 실행 원장 | `docs/ROADMAP.md`는 DG0~DG5, Task 001~014 및 기존 완료 상태를 선언                                                                                           | v1.7 Gate 증거로 재사용 불가           | 현행 `docs/ROADMAP-v1.7.md` 생성 완료        |
| 이전 기술 경계 | `docs/architecture.md`는 기존 Task 005~014, G0~G4, Research/Forward Validation을 기술                                                                        | v1.7 기술 정본이 아님                  | `docs/architecture-v1.7.md` 기준선 생성 완료 |
| 기존 Gate 기록 | `DG0-scope-baseline.md`, `DG1-data-rights.md`는 이전 범위/판정 기반                                                                                          | 역사적 판정                            | 보존, v1.7 판정에 사용 금지                  |
| 코드·테스트    | `src/lib/etf/**`, `src/lib/research/**`, `src/app/**`, `src/components/**`, `test/**`, `tests/e2e/**`, `migrations/**`, `scripts/**`와 이전 Gate 기록이 존재 | 호환성 감사 전에는 v1.7 완료 증거 아님 | PRD §12.2/§15 매핑 및 RED 테스트 계획 필요   |

## 기존 자산 v1.7 차이 매트릭스 (2026-09-14)

이 표는 코드 존재 사실을 v1.7 통과 증거로 승격하지 않는다. 분류 열의 계약값은 `REUSE_AFTER_DG1_TEST`(DG1 테스트 재증명 후 재사용), `MODIFY_OR_REPLACE`(수정 또는 교체), `OUT_OF_SCOPE_OR_HISTORICAL`(범위 밖 또는 역사적 참조) 세 가지다.

| 자산 범위                                                                                                                                           | 직접 관찰한 사실                                                                                                                                              | v1.7 계약과의 관계                                                                                                                                                   | 분류                         | 다음 허용 조치                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/etf/normalize.ts`, `repository.ts`, `pipeline.ts`, `test/etf-pipeline.test.ts`                                                             | secret redaction, 안정 hash, 원본 snapshot과 in-memory pipeline을 구현한다                                                                                    | §9.1의 공통 저장 필드 14개, §2.3 필드 승인, 날짜 상태 및 불변 버전 계약이 없다                                                                                       | `MODIFY_OR_REPLACE`          | DG1에서 raw/날짜/필드 계약 테스트를 RED로 추가한 뒤 필요한 부분만 이관                                                               |
| `src/lib/etf/krx-etf-daily-market-data.ts`, `krx-dg2-adapter.ts`, `scripts/capture-krx-etf-daily.ts` 및 관련 테스트                                 | KRX `etf_bydd_trd` 행과 raw evidence를 다루지만, `krx-dg2-adapter.ts`가 이전 evidence·strategy·DG3 타입을 import한다                                          | KRX를 국내 가격·거래량·거래대금 정본으로 둔 §2.1과 후보 범위가 맞지만, 이전 선정·증거 계약이 수집 계층으로 결합되어 있고 §3 5상태·anchor·필드 승인을 증명하지 않는다 | `MODIFY_OR_REPLACE`          | DG1에서 독립 KRX 수집 경계와 대표 5종 대조·날짜 상태 계약으로 재검증                                                                 |
| `src/lib/etf/kiwoom-etf-historical-daily.ts`, `kiwoom-dg2-distribution-adapter.ts`, `scripts/capture-kiwoom-etf-historical-daily.ts` 및 관련 테스트 | 키움 일별 추이·분배 관련 응답과 capture checkpoint를 다룬다                                                                                                   | 키움은 anchor·현재 마스터·대표 5종 대조 보조 역할만 허용하며, 분배 관련 필드는 계산에 사용하지 않는다                                                                | `MODIFY_OR_REPLACE`          | KRX 정본 대체·자동 계산 경로를 제거 또는 격리하고, 보조 대조 근거만 DG1에 재채택                                                     |
| `src/lib/etf/collection.ts`, `test/etf-collection.test.ts`, `gate-validation.ts`, `test/gate-validation.test.ts`                                    | `DG2_SAMPLE_SELECTOR_VERSION`과 `Dg2SampleSelection.source`가 `kiwoom`으로 고정되고, 키움 외 시세를 거부한다. 현재 master, `fxRate: 1`, `dividend`도 포함한다 | §11 및 §15-2의 KRX 선정 원천과 직접 충돌하며, 과거 유니버스의 현재 master 사용 및 환율·분배금 계산은 §1.2 비목표와 충돌한다                                          | `OUT_OF_SCOPE_OR_HISTORICAL` | **사람 결정 전 폐기 후보**. 키움 선정 Gate/테스트를 `check-all`에서 분리하고 KRX 계약으로 교체하는 별도 DG0 정합화 작업을 승인받는다 |
| `src/lib/etf/scanner.ts`, `strategy.ts`, `backtest.ts`, `forward-validation.ts`, `risk.ts` 및 관련 테스트                                           | 기존 점수·추천·포트폴리오·미래 성과/FX/분배 수익 계산을 구현한다                                                                                              | FX·분배금·자동 전향평가·매매/포트폴리오는 §1.2 비목표다. Scanner와 과거 재현 자체는 v1.7 범위이나 현 계약은 부록 A/B·미래 접근 차단과 일치하지 않는다                | `MODIFY_OR_REPLACE`          | 비목표 기능은 격리하고, v1.7 Scanner/공통 선정/재현은 DG2 이후 별도 계약으로 교체                                                    |
| `src/lib/etf/dg2-evidence.ts`, `dg3-evidence.ts`, `krx-dg3-adapter.ts`, 이전 Gate 문서·입력 템플릿·evidence bundle                                  | 이전 Gate/출처/평가 evidence envelope가 존재한다                                                                                                              | 일부 provenance 검사 방향은 §9와 유사하나, 이전 P0·DG 계약과 Gate 판정은 v1.7에 재사용할 수 없다                                                                     | `OUT_OF_SCOPE_OR_HISTORICAL` | 보존만 하며, 새 v1.7 Gate 문서와 §12.2 회귀 테스트로 다시 증명                                                                       |
| `migrations/001_task005_korean_etf_pipeline.sql`, `002_task007_strategy_scorecards.sql`                                                             | 이전 task 모델과 scorecard/candidate gate 테이블을 정의한다                                                                                                   | v1.7 상태 축·필드 승인·raw manifest·calendar/rule version 계약 충족을 입증하지 않았고, 실제 적용 여부도 이 감사 범위에서 확인하지 않았다                             | `MODIFY_OR_REPLACE`          | 기존 migration 파일은 변경하지 않으며, 적용 상태 확인과 새 migration은 DG1 계획·RED 테스트 후에만 수행                               |
| `src/app/page.tsx`, `src/components/product-dashboard.tsx`, `tests/e2e/dashboard.spec.ts`                                                           | Weekly guide·Paper portfolio·미국 ETF·환율/분배금 기여·하드코딩 Scanner 결과를 표시하고 해당 UI를 e2e로 고정한다                                              | PRD §1.2 비목표 및 UI 읽기 모델 경계와 충돌한다                                                                                                                      | `OUT_OF_SCOPE_OR_HISTORICAL` | 사람 승인 후 v1.7 읽기 모델로 교체하거나 역사 화면으로 격리; 현 UI를 v1.7 완료 증거에서 제외                                         |
| `src/app/layout.tsx`, `globals.css`, `login/page.tsx`, `signup/page.tsx`, `src/components/`의 공통 UI·인증·레이아웃 구성요소                        | 현 제품명·투자 가이드 설명·로그인/가입 및 범용 표시 구성요소를 제공한다                                                                                       | 도메인 선정 규칙은 없지만 현재 제품 표현을 전제하므로, v1.7 읽기 모델·비공개 접근 경계와 맞는지는 별도 확인이 필요하다                                               | `MODIFY_OR_REPLACE`          | DG3 UI 계획에서 필요한 범용 구성요소만 재검증해 채택하고, 제품 표현·접근 흐름은 v1.7 계약으로 교체                                   |
| `src/lib/research/guide.ts`, `inbox.ts`, `test/research-guide.test.ts`, `test/research-inbox.test.ts`                                               | 전략 타입을 import한 리서치 수집·가이드 발행을 구현한다                                                                                                       | 뉴스·리서치 판단은 PRD §1.2 비목표다                                                                                                                                 | `OUT_OF_SCOPE_OR_HISTORICAL` | v1.7 도메인 경로에서 격리하고 자동 선정·발행 증거로 사용 금지                                                                        |
| `src/lib/etf/bounded-concurrency.ts`, `test/bounded-concurrency.test.ts`, `test/deployment-config.test.ts`, `test/font-loading.test.ts`             | 범용 동시성, 배포 경계, 폰트 검사를 제공한다                                                                                                                  | v1.7 도메인 계약을 증명하지 않지만 범위 충돌은 직접 만들지 않는다                                                                                                    | `REUSE_AFTER_DG1_TEST`       | 도메인 구현과 분리해 유지; DG1 §12.2 테스트를 대체하지 않음                                                                          |
| `test/project-status.test.ts`                                                                                                                       | 이전 DG2~DG4 machine status와 현 ROADMAP 상태 문자열을 함께 검사한다                                                                                          | 레거시 Gate 결과에 의존하므로, 키움 선정 Gate를 폐기·격리하면 `status:check`가 깨질 수 있다                                                                          | `MODIFY_OR_REPLACE`          | DG0 결정 후 역사 스냅샷 검증과 v1.7 상태 검증을 분리                                                                                 |

### 인벤토리 커버리지

다음 표는 감사 범위의 구현·테스트·Gate 증거를 위 매트릭스 행에 연결한다. 테스트 파일은 검증하는 자산 범위와 같은 분류를 따른다. 이 표는 행 단위의 구현 적합성 판정이 아니라, 어느 레거시 자산도 v1.7 증거 밖에 남지 않도록 하는 감사 색인이다.

| 매트릭스 행                      | 포함 경로                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| raw/pipeline                     | `src/lib/etf/types.ts`, `normalize.ts`, `repository.ts`, `pipeline.ts`, `test/etf-pipeline.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| KRX 가격 정본 후보               | `src/lib/etf/krx-etf-daily-market-data.ts`, `krx-dg2-adapter.ts`, `test/krx-etf-daily-market-data.test.ts`, `test/krx-dg2-adapter.test.ts`, `scripts/capture-krx-etf-daily.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 키움 보조·capture 후보           | `src/lib/etf/kiwoom-etf-historical-daily.ts`, `kiwoom-etf-historical-daily-run.ts`, `kiwoom-dg2-distribution-adapter.ts`, `test/kiwoom-etf-historical-daily.test.ts`, `test/kiwoom-etf-historical-daily-run.test.ts`, `test/kiwoom-dg2-distribution-adapter.test.ts`, `scripts/capture-kiwoom-etf-historical-daily.ts`                                                                                                                                                                                                                                                                                                        |
| 현재 master/환율·분배 계약       | `src/lib/etf/collection.ts`, `test/etf-collection.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 기존 Scanner·추천·평가·위험 계약 | `src/lib/etf/scanner.ts`, `strategy.ts`, `backtest.ts`, `forward-validation.ts`, `risk.ts`, `test/etf-scanner.test.ts`, `test/etf-strategy.test.ts`, `test/etf-backtest.test.ts`, `test/forward-validation.test.ts`, `test/etf-risk.test.ts`, `test/task-014-qa.test.ts`                                                                                                                                                                                                                                                                                                                                                      |
| 이전 Gate·evidence 계약          | `src/lib/etf/dg2-evidence.ts`, `dg3-evidence.ts`, `krx-dg3-adapter.ts`, `test/dg2-evidence.test.ts`, `test/dg3-evidence.test.ts`, `test/krx-dg3-adapter.test.ts`, `docs/plan/gates/DG0-scope-baseline.md`, `DG1-data-rights.md`, `DG2-data-source-gap-report.md`, `DG2-evidence-bundle-procedure.md`, `DG2-evidence-bundle.manifest.template.json`, `DG2-evidence-input.template.json`, `DG2-evidence-review-checklist.md`, `DG2-strategy-validation.md`, `DG3-evidence-input.template.json`, `DG3-strategy-risk.md`, `DG4-evidence-input.json`, `DG4-product-alpha.md`, `evidence-acquisition-plan.md`, `evidence-bundle/**` |
| 이전 DB 계약                     | `migrations/001_task005_korean_etf_pipeline.sql`, `migrations/002_task007_strategy_scorecards.sql`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 레거시 상태·비목표 UI·리서치     | `src/lib/etf/gate-validation.ts`, `test/gate-validation.test.ts`, `test/project-status.test.ts`, `src/app/page.tsx`, `src/components/product-dashboard.tsx`, `tests/e2e/dashboard.spec.ts`, `src/lib/research/guide.ts`, `src/lib/research/inbox.ts`, `test/research-guide.test.ts`, `test/research-inbox.test.ts`                                                                                                                                                                                                                                                                                                            |
| 앱 shell·공통 UI·인증            | `src/app/favicon.ico`, `globals.css`, `layout.tsx`, `login/page.tsx`, `signup/page.tsx`, `src/components/layout/**`, `navigation/**`, `providers/**`, `sections/**`, `ui/**`, `login-form.tsx`, `signup-form.tsx`, `theme-toggle.tsx`                                                                                                                                                                                                                                                                                                                                                                                         |
| 범용 보조                        | `src/lib/etf/bounded-concurrency.ts`, `test/bounded-concurrency.test.ts`, `test/deployment-config.test.ts`, `test/font-loading.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## PRD §12.2 및 §15 추적 상태

| 항목                                             | DG0 시점 증거 상태                                                                               | 다음 증거 위치                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| §12.2 #1~5, #14 (날짜·anchor·식별자·0/공란·재개) | 기존 테스트는 일부 유사 동작만 다루며 v1.7 계약 RED/GREEN 증거 없음                              | DG1에서 14개 전체 테스트의 RED 배치·GREEN 유지 방식을 사람 결정 후 확정                                       |
| §12.2 #6 (미래정보 차단)                         | 기존 DG2 evidence에 과거 일자 검사가 있으나 현재 master와 미래 가격 접근 차단의 필수 회귀가 아님 | P0-02 이전에 GREEN이어야 한다는 PRD 요구와, DG1 이후 14개 모두 GREEN이라는 헌법 VII.5의 배치 충돌을 사람 결정 |
| §12.2 #7~13 (그룹·Scanner·선정·평가·결정성)      | 이전 Scanner/평가 테스트는 범위·계약이 다르므로 v1.7 증거 없음                                   | DG1에서 14개 전체 테스트의 RED 배치·GREEN 유지 방식을 사람 결정 후 확정                                       |
| §15 수용 기준 15개                               | 현행 PRD가 정본이며 각 기준을 GREEN으로 연결한 v1.7 코드/Gate 증거 없음                          | DG1~DG4 Gate별 analyze 기록                                                                                   |

### PRD §15 개별 수용 기준 상태

PRD §15의 본문은 제품 사실의 유일한 정본으로 유지한다. 아래는 본문을 복제하지 않는 번호별 추적 색인이다.

| §15 기준 | 추적 키워드                | DG0 상태                          | 후속 증거 Gate                         |
| -------- | -------------------------- | --------------------------------- | -------------------------------------- |
| 1        | 입력 manifest 재현         | 미검증                            | DG2.5                                  |
| 2        | KRX 선정 원천              | **미충족**: 키움 선정 Gate가 활성 | DG0 계약 통일 → DG1 소스 대조          |
| 3        | 현재 master·미래 가격 차단 | 미검증                            | DG2.5; 필수 회귀 #6은 모든 DG에서 유지 |
| 4        | 식별자 충돌 보존           | 미검증                            | DG1                                    |
| 5        | 게시·비거래·부분·호출 상태 | 미검증                            | P0-01 및 DG1                           |
| 6        | 지수 그룹 비확정           | 미검증                            | P0-02~05                               |
| 7        | 미승인 필드 계산 차단      | 미검증                            | DG1 필드 승인 → P0-02~05 및 DG2.5      |
| 8        | A2/B1 빈 슬롯              | 미검증                            | P0-06 공통 선정 엔진 및 DG3            |
| 9        | Gate 실패 즉시 제거        | 미검증                            | P0-06 공통 선정 엔진, DG2.5, DG3       |
| 10       | 가격수익률 표현 경계       | 미검증                            | DG2.5 재현 및 DG3 읽기 모델            |
| 11       | 분배락 자동 보정 금지      | 미검증                            | P0-02~04 및 DG2.5                      |
| 12       | 만기·검열·분모 분리        | 미검증                            | DG2.5                                  |
| 13       | 평가 기간·발행·블록        | 미검증                            | DG2.5                                  |
| 14       | 가상 손실 수작업           | 미검증                            | DG3                                    |
| 15       | 수익 보장 주장 금지        | 미검증                            | DG2.5 및 DG3 표현 경계                 |

## 실행 증거 (2026-09-14)

### 기준선 참고 (부모 commit `c234c36`)

- `npm run check-all`: **PASS**. status/deployment/font/DG evidence/adapters/typecheck/lint/prettier가 모두 통과했다. 이 결과는 레거시 도메인 동작이 v1.7을 충족한다는 뜻이 아니다.
- `npm run build`: 로컬 기본 작업 트리에서는 Turbopack CSS helper의 로컬 포트 바인딩이 `Operation not permitted (os error 1)`로 거부되어 검증 불가였다. 동일 기준선의 GitHub Actions Quality run은 Turbopack build 성공을 기록했으나, 이 DG의 로컬 실행 결과를 GREEN으로 대체하지 않는다.

### PR head `0119cf1` 기준 검증과 이후 보완

- 문서 형식 검증: `npx prettier --write docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md` 후 `npm run format:check` **PASS**; `git diff --check` **PASS**.
- 전체 `npm run check-all`: **PASS**. status/deployment/font/DG evidence/adapters/typecheck/lint/prettier가 모두 통과했다. 문서 감사와 레거시 테스트 통과는 v1.7 도메인 기능이 GREEN이라는 뜻이 아니다.
- `check-all` 밖의 레거시 테스트: `etf-pipeline`, `etf-collection`, `etf-strategy`, `etf-backtest`, `etf-scanner`, `etf-risk`, `forward-validation`, `gate-validation`, `research-inbox`, `research-guide`, `task-014-qa`를 하나의 Node 테스트 실행으로 확인해 **11/11 PASS**. 이 결과도 레거시 계약의 실행 사실일 뿐 v1.7 충족 증거는 아니다.
- `npm run build`: **검증 불가 (환경 오류)**. Turbopack이 `src/app/globals.css [app-client] (css)` 처리 중 helper 프로세스의 로컬 포트 바인딩을 시도했고, 실행 샌드박스가 `Operation not permitted (os error 1)`로 거부했다. 이는 현재 변경에 의한 애플리케이션 실패로 판정하지 않으며, build GREEN 주장도 하지 않는다.
- 다른 환경 증거: PR #2의 [GitHub Actions Quality run 34823530574](https://github.com/kwh8121/investment/actions/runs/34823530574)는 commit `0119cf1`에서 `Build application` 성공을 기록한다. 이 결과는 로컬 환경 오류를 GREEN으로 대체하지 않고, CI 빌드 증거로만 사용한다.
- `/speckit.checklist`, `/speckit.analyze`: 현재 저장소 도구로 제공되지 않아 실행 산출물이 없다. 이 공백은 사람 DG0 판정 자료에서 명시적으로 검토한다.

## DG0 §11 체크리스트와 사람 결정 요청

| DG0 통과 조건                        | 현재 증거                                                                                                                       | 상태       | 사람 결정 또는 다음 조치                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 국내 가격·거래량·거래대금 정본이 KRX | PRD·현행 architecture는 KRX 정본을 선언한다. 기존 `krx-dg2-adapter.ts`는 이전 전략/evidence 계약에 결합돼 직접 재사용할 수 없다 | 부분 확인  | DG1에서 독립 KRX 수집 계약을 RED→GREEN으로 증명할지 승인                                                   |
| 문서·코드의 선정 원천이 KRX로 일치   | `collection.ts` 및 `gate-validation.ts`는 키움 거래대금 선정 원천을 강제하며 CI `test:gate-validation`이 이를 실행한다          | **미충족** | 키움 선정 계약·Gate·테스트를 역사적으로 격리하고 KRX 선정 계약으로 교체하는 DG0 정합화 작업 승인 여부 결정 |
| 기존 충돌 계약 폐기                  | 키움 선정, 현재 master 기반 역사 필터, 환율·분배금·리서치/포트폴리오/자동 평가·기존 UI가 충돌 후보로 식별됐다                   | 미결       | 아래 폐기·격리 후보의 보존/격리/교체 방침을 승인; 적용 migration의 실제 상태도 별도로 확인                 |

### 폐기·격리 후보

- 키움 선정 계약: `DG2_SAMPLE_SELECTOR_VERSION`, `Dg2SampleSelection.source: 'kiwoom'`, `evaluateDg2`의 키움 원천 검사, 그리고 이를 강제하는 `test/gate-validation.test.ts`·`test/project-status.test.ts`의 현행 `check-all` 연결.
- 현재 master 기반 역사 유니버스·환율·분배금 계약: `src/lib/etf/collection.ts`와 관련 테스트.
- 비목표 기능: `src/components/product-dashboard.tsx` 및 `tests/e2e/dashboard.spec.ts`의 기존 대시보드, `src/lib/research/**`, 기존 포트폴리오·자동 전향평가·위험 모듈과 테스트.
- 과거 Gate 입력·template·evidence bundle: 역사 스냅샷으로 보존하되 v1.7 Gate 증거와 분리.

### 명시적으로 필요한 사람 결정

1. 키움 선정 원천 계약과 이를 통과 조건으로 삼는 레거시 테스트를 v1.7 구현 경로와 `check-all`에서 격리하고, KRX 선정 계약으로 교체하는 작업을 승인한다.
2. 헌법 VII.5의 “DG1 이후 §12.2 14개 모두 GREEN”과 PRD/프로그램 계획의 단계별 RED 배치가 충돌하는지 해석을 확정한다. 특히 미래정보 차단 #6은 P0-02 이전에 GREEN이어야 한다.
3. `specify` CLI는 로컬에 있으나 `.specify`가 초기화되지 않았다. `/speckit.checklist`·`/speckit.analyze`를 위해 초기화할지와 산출물 위치를 정한다.
4. 기존 migration 파일의 실제 적용 여부는 이 감사에서 확인하지 않았다. 적용 상태 확인의 책임·환경을 정하고, 적용된 migration은 수정·삭제하지 않는다.

## DG0 통과 전 남은 증거

- 사람 결정 1~4와 키움 선정 원천 교체/격리 방침을 기록한다.
- 승인된 DG0 방침에 따라 레거시 상태 검증과 v1.7 상태 검증을 분리하고, §12.2 14개 테스트의 RED→GREEN 배치 방식을 DG1 계획에 기록한다.
- 사람 결정 후 `/speckit.checklist`·`/speckit.analyze`를 초기화·실행하고 결과를 연결한다.

## 판정 경계

이 문서는 증거 준비 기록일 뿐 DG0 `Go` 판정이 아니다. DG0 통과/반려는 Approver가 수행하며, 그 전에는 DG1 이상의 Gate 의존 구현을 시작하거나 기존 완료 표기를 승계하지 않는다.
