# DG0 v1.7 계약 통일 — 증거 준비 기록

> **Gate:** DG0 계약 통일<br>
> **기준 스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`<br>
> **상태 (2026-09-14):** 증거 준비 중 — 판정 없음<br>
> **Owner:** 미지정<br>
> **Approver:** 미지정

## 확인된 정합성 상태

| 영역           | 직접 관찰한 증거                                                                        | v1.7 해석                              | 필요한 조치                                  |
| -------------- | --------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| 현행 제품 스펙 | `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`는 v1.7 Final이며 P0-01~07, DG0~DG4를 정의 | 현행 정본                              | 변경 없음                                    |
| 이전 PRD       | `docs/PRD.md`는 v1.2, P0-01~10, 한·미 ETF, 환율·분배금·총수익을 정의                    | 역사적 참조                            | v1.7 정본을 가리키는 상태 표기 완료          |
| 이전 실행 원장 | `docs/ROADMAP.md`는 DG0~DG5, Task 001~014 및 기존 완료 상태를 선언                      | v1.7 Gate 증거로 재사용 불가           | 현행 `docs/ROADMAP-v1.7.md` 생성 완료        |
| 이전 기술 경계 | `docs/architecture.md`는 기존 Task 005~014, G0~G4, Research/Forward Validation을 기술   | v1.7 기술 정본이 아님                  | `docs/architecture-v1.7.md` 기준선 생성 완료 |
| 기존 Gate 기록 | `DG0-scope-baseline.md`, `DG1-data-rights.md`는 이전 범위/판정 기반                     | 역사적 판정                            | 보존, v1.7 판정에 사용 금지                  |
| 코드·테스트    | `src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**`가 기존 Task 기반으로 존재    | 호환성 감사 전에는 v1.7 완료 증거 아님 | PRD §12.2/§15 매핑 및 RED 테스트 계획 필요   |

## 기존 자산 v1.7 차이 매트릭스 (2026-09-14)

이 표는 코드 존재 사실을 v1.7 통과 증거로 승격하지 않는다. `재사용 가능`은 DG1 이후 해당 PRD 회귀 테스트가 RED→GREEN으로 재증명될 때만 의미를 갖는다.

| 자산 범위                                                                                                                                           | 직접 관찰한 사실                                                               | v1.7 계약과의 관계                                                                                                        | 분류         | 다음 허용 조치                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `src/lib/etf/normalize.ts`, `repository.ts`, `pipeline.ts`, `test/etf-pipeline.test.ts`                                                             | secret redaction, 안정 hash, 원본 snapshot과 in-memory pipeline을 구현한다     | §9.1·§9.4의 hash/redaction 방향은 일부 부합하나, 필수 15개 식별자·불변 버전·필드 승인·날짜 상태가 없다                    | 수정 필요    | DG1에서 raw/날짜/필드 계약 테스트를 RED로 추가한 뒤 필요한 부분만 이관                   |
| `src/lib/etf/krx-etf-daily-market-data.ts`, `krx-dg2-adapter.ts`, `scripts/capture-krx-etf-daily.ts` 및 관련 테스트                                 | KRX `etf_bydd_trd` 행과 raw evidence를 다룬다                                  | KRX를 국내 가격·거래량·거래대금 정본으로 둔 §2.1과 후보 범위가 맞지만, §3의 5상태·anchor·필드 승인 증거를 증명하지 않는다 | 수정 필요    | DG1에서 대표 5종 대조 및 날짜 상태 계약으로 재검증                                       |
| `src/lib/etf/kiwoom-etf-historical-daily.ts`, `kiwoom-dg2-distribution-adapter.ts`, `scripts/capture-kiwoom-etf-historical-daily.ts` 및 관련 테스트 | 키움 일별 추이·분배 관련 응답과 capture checkpoint를 다룬다                    | v1.7에서 키움은 anchor·현재 마스터·대표 5종 대조의 보조 역할만 허용하며, 분배 관련 필드는 계산에 사용하지 않는다          | 수정 필요    | KRX 정본을 대체하는 경로와 자동 계산 사용을 제거/격리하고, 보조 대조 근거만 DG1에 재채택 |
| `src/lib/etf/collection.ts`, `test/etf-collection.test.ts`                                                                                          | `fxRate: 1`, `dividend`, 현재 master 기반 listing-age·거래대금 필터를 포함한다 | 역사 유니버스에 현재 master를 쓰지 말아야 하며, 환율·분배금 계산은 범위 밖이다                                            | 범위 밖/교체 | DG2 이후 관측 KRX 유니버스와 252 거래일 계약으로 대체; 현재 API를 과거 계산에 연결 금지  |
| `src/lib/etf/scanner.ts`, `strategy.ts`, `backtest.ts`, `forward-validation.ts`, `risk.ts` 및 관련 테스트                                           | 기존 점수·추천·포트폴리오·미래 성과/FX/분배 수익 계산을 구현한다               | §4.4, §12.2 #6 및 §13은 미래 가격 분리, FX·분배금·자동 전향평가·매매/포트폴리오 기능 배제를 요구한다                      | 범위 밖/격리 | v1.7 Scanner/선정 엔진이 DG2 이후 별도 계약으로 생길 때까지 실행·완료 증거에서 제외      |
| `src/lib/etf/dg2-evidence.ts`, `dg3-evidence.ts`, `gate-validation.ts`, 이전 `docs/plan/gates/DG0-4*`                                               | 이전 Gate/출처/평가 evidence envelope가 존재한다                               | 일부 provenance 검사 방향은 §9와 유사하나, 이전 P0·DG 계약과 Gate 판정은 v1.7에 재사용할 수 없다                          | 역사적 참조  | 보존만 하며, 새 v1.7 Gate 문서와 §12.2 회귀 테스트로 다시 증명                           |
| `migrations/001_task005_korean_etf_pipeline.sql`, `002_task007_strategy_scorecards.sql`                                                             | 이전 task 모델과 scorecard/candidate gate 테이블을 생성한다                    | v1.7의 상태 축 분리, 필드 승인, raw manifest, date/calendar/rule version 계약을 충족한다고 입증되지 않았다                | 수정 필요    | 적용 이력은 불변 보존; 새 migration은 DG1 계획·RED 테스트 후에만 추가                    |
| `test/project-status.test.ts`, `test/deployment-config.test.ts`, `test/font-loading.test.ts`                                                        | v1.7 정본 경로·배포 경계·UI font 설정을 확인한다                               | 제품 도메인 검증은 아니지만 현행 기준선과 private deployment 경계에 부합한다                                              | 재사용 가능  | 유지; DG1 §12.2 도메인 회귀 테스트를 대체하지 않음                                       |

### 인벤토리 커버리지

다음 표는 `rg --files src/lib/etf test migrations scripts | sort` 결과의 모든 경로를 위 매트릭스 행에 연결한다. 테스트 파일은 검증하는 자산 범위와 같은 분류를 따른다. 이 표는 행 단위의 구현 적합성 판정이 아니라, 어느 레거시 파일도 v1.7 증거 밖에 남지 않도록 하는 감사 색인이다.

| 매트릭스 행                      | 포함 경로                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| raw/pipeline                     | `src/lib/etf/types.ts`, `normalize.ts`, `repository.ts`, `pipeline.ts`, `test/etf-pipeline.test.ts`                                                                                                                                                                                                                    |
| KRX 가격 정본 후보               | `src/lib/etf/krx-etf-daily-market-data.ts`, `krx-dg2-adapter.ts`, `test/krx-etf-daily-market-data.test.ts`, `test/krx-dg2-adapter.test.ts`, `scripts/capture-krx-etf-daily.ts`                                                                                                                                         |
| 키움 보조·capture 후보           | `src/lib/etf/kiwoom-etf-historical-daily.ts`, `kiwoom-etf-historical-daily-run.ts`, `kiwoom-dg2-distribution-adapter.ts`, `test/kiwoom-etf-historical-daily.test.ts`, `test/kiwoom-etf-historical-daily-run.test.ts`, `test/kiwoom-dg2-distribution-adapter.test.ts`, `scripts/capture-kiwoom-etf-historical-daily.ts` |
| 현재 master/환율·분배 계약       | `src/lib/etf/collection.ts`, `test/etf-collection.test.ts`                                                                                                                                                                                                                                                             |
| 기존 Scanner·추천·평가·위험 계약 | `src/lib/etf/scanner.ts`, `strategy.ts`, `backtest.ts`, `forward-validation.ts`, `risk.ts`, `test/etf-scanner.test.ts`, `test/etf-strategy.test.ts`, `test/etf-backtest.test.ts`, `test/forward-validation.test.ts`, `test/etf-risk.test.ts`, `test/task-014-qa.test.ts`                                               |
| 이전 Gate·evidence 계약          | `src/lib/etf/dg2-evidence.ts`, `dg3-evidence.ts`, `gate-validation.ts`, `krx-dg3-adapter.ts`, `test/dg2-evidence.test.ts`, `test/dg3-evidence.test.ts`, `test/gate-validation.test.ts`, `test/krx-dg3-adapter.test.ts`                                                                                                 |
| 이전 DB 계약                     | `migrations/001_task005_korean_etf_pipeline.sql`, `migrations/002_task007_strategy_scorecards.sql`                                                                                                                                                                                                                     |
| 범용 보조 또는 비도메인 검사     | `src/lib/etf/bounded-concurrency.ts`, `test/bounded-concurrency.test.ts`, `test/project-status.test.ts`, `test/deployment-config.test.ts`, `test/font-loading.test.ts`, `test/research-guide.test.ts`, `test/research-inbox.test.ts`                                                                                   |

## PRD §12.2 및 §15 추적 상태

| 항목                                             | DG0 시점 증거 상태                                                                               | 다음 증거 위치                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| §12.2 #1~5, #14 (날짜·anchor·식별자·0/공란·재개) | 기존 테스트는 일부 유사 동작만 다루며 v1.7 계약 RED/GREEN 증거 없음                              | DG1 전용 계획·테스트                           |
| §12.2 #6 (미래정보 차단)                         | 기존 DG2 evidence에 과거 일자 검사가 있으나 현재 master와 미래 가격 접근 차단의 필수 회귀가 아님 | DG2.5 전용 계획·테스트; 모든 DG에서 GREEN 유지 |
| §12.2 #7~13 (그룹·Scanner·선정·평가·결정성)      | 이전 Scanner/평가 테스트는 범위·계약이 다르므로 v1.7 증거 없음                                   | DG2 이후 각 전용 계획·테스트                   |
| §15 수용 기준 15개                               | 현행 PRD가 정본이며 각 기준을 GREEN으로 연결한 v1.7 코드/Gate 증거 없음                          | DG1~DG4 Gate별 analyze 기록                    |

### PRD §15 개별 수용 기준 상태

PRD §15의 본문은 제품 사실의 유일한 정본으로 유지한다. 아래는 본문을 복제하지 않는 번호별 추적 색인이다.

| §15 기준 | DG0 상태 | 후속 증거 Gate                         |
| -------- | -------- | -------------------------------------- |
| 1        | 미검증   | DG2.5                                  |
| 2        | 미검증   | DG0 계약 통일 → DG1 소스 대조          |
| 3        | 미검증   | DG2.5; 필수 회귀 #6은 모든 DG에서 유지 |
| 4        | 미검증   | DG1                                    |
| 5        | 미검증   | P0-01 및 DG1                           |
| 6        | 미검증   | P0-02~05                               |
| 7        | 미검증   | DG1 필드 승인 → P0-02~04 계산 guard    |
| 8        | 미검증   | P0-06 공통 선정 엔진 및 DG3            |
| 9        | 미검증   | P0-06 공통 선정 엔진                   |
| 10       | 미검증   | DG2.5 재현 및 DG3 읽기 모델            |
| 11       | 미검증   | P0-02~04 및 DG2.5                      |
| 12       | 미검증   | DG2.5                                  |
| 13       | 미검증   | DG2.5                                  |
| 14       | 미검증   | DG3                                    |
| 15       | 미검증   | DG2.5 및 DG3 표현 경계                 |

## 실행 증거 (2026-09-14)

### 기준선 참고 (부모 commit `c234c36`)

- `npm run check-all`: **PASS**. status/deployment/font/DG evidence/adapters/typecheck/lint/prettier가 모두 통과했다. 이 결과는 레거시 도메인 동작이 v1.7을 충족한다는 뜻이 아니다.
- `npm run build`: 로컬 기본 작업 트리에서는 Turbopack CSS helper의 로컬 포트 바인딩이 `Operation not permitted (os error 1)`로 거부되어 검증 불가였다. 동일 기준선의 GitHub Actions Quality run은 Turbopack build 성공을 기록했으나, 이 DG의 로컬 실행 결과를 GREEN으로 대체하지 않는다.

### 현재 DG0 문서 변경 (commit `86dbae1` 이후 작업 트리)

- 문서 형식 검증: `npx prettier --write docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md` 후 `npm run format:check` **PASS**; `git diff --check` **PASS**.
- 전체 `npm run check-all`: **PASS**. status/deployment/font/DG evidence/adapters/typecheck/lint/prettier가 모두 통과했다. 문서 감사와 레거시 테스트 통과는 v1.7 도메인 기능이 GREEN이라는 뜻이 아니다.
- `npm run build`: **검증 불가 (환경 오류)**. Turbopack이 `src/app/globals.css [app-client] (css)` 처리 중 helper 프로세스의 로컬 포트 바인딩을 시도했고, 실행 샌드박스가 `Operation not permitted (os error 1)`로 거부했다. 이는 현재 변경에 의한 애플리케이션 실패로 판정하지 않으며, build GREEN 주장도 하지 않는다.
- `/speckit.checklist`, `/speckit.analyze`: 현재 저장소 도구로 제공되지 않아 실행 산출물이 없다. 이 공백은 사람 DG0 판정 자료에서 명시적으로 검토한다.

## DG0 통과 전 남은 증거

- PRD §2·§3·§4·§9·§11·§12.2·§15의 요구사항을 기존 코드·테스트·migration·script에 행 단위로 매핑한다.
- 기존 자산을 **재사용 가능**, **수정 필요**, **범위 밖/격리**로 분류하고 근거를 기록한다.
- 국내 가격·거래대금 KRX 정본, selection source, 기존 충돌 계약의 폐기/수정 여부를 코드와 문서에서 확인한다.
- PRD §12.2의 14개 필수 회귀 테스트 중 v1.7 증거가 없는 항목을 RED로 선배치하는 DG1 계획을 작성한다.
- `/speckit.checklist`와 `/speckit.analyze` 결과, `npm run check-all`, `npm run build` 실행 결과를 이 기록에 연결한다.

## 판정 경계

이 문서는 증거 준비 기록일 뿐 DG0 `Go` 판정이 아니다. DG0 통과/반려는 Approver가 수행하며, 그 전에는 DG1 이상의 Gate 의존 구현을 시작하거나 기존 완료 표기를 승계하지 않는다.
