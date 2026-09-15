# ETF Price Signal MVP v1.7 실행 원장

> **현행 제품 스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`<br>
> **전역 제약:** `docs/constitution.md`<br>
> **개발 방법론:** `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md`<br>
> **프로그램 계획:** `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`<br>
> **상태 (2026-09-15):** DG0 통과 — 사람의 범위 한정 Go 판정<br>
> **다음 작업:** DG1/P0-01 독립 구현 계획 (`docs/plan/gates/DG1-v17-materials-inspection.md`)

## 목적

이 문서는 PRD v1.7의 **DG 수준** 실행 순서, 승인된 프로그램 기준선, 의존성, 증거 링크의 유일한 정본이다. 진행 중 개별 작업의 담당·블로커·검토 요청·실시간 상태 전이는 Linear에서 관리한다. 제품 요구사항을 재서술하지 않고 PRD를 참조하며, Gate의 실제 판정은 `docs/plan/gates/` 문서에서만 기록한다. 전체 운영 하네스는 `docs/guides/one-fact-one-home.md`를 따른다.

## 현재 기준선

| 항목                    | 상태                 | 증거 / 다음 조치                                                                        |
| ----------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| v1.7 제품 스펙          | 확정                 | `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`                                           |
| 헌법                    | 초안, 사람 비준 대기 | `docs/constitution.md`; PRD와 충돌 시 PRD 우선                                          |
| 개발 방법론             | 채택                 | 경량 Spec Kit + 전담 Superpowers; `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md` |
| DG0                     | 통과                 | `docs/plan/gates/DG0-v17-contract-unification.md`; 2026-09-15 사람의 범위 한정 Go 판정  |
| DG1~DG4                 | 미착수               | DG0 및 각 선행 Gate의 사람 판정이 필요                                                  |
| 기존 P0-01~10 구현/증거 | 역사적 참조          | v1.7 충족 증거로 사용 금지; DG0 매핑 후에만 재채택 가능                                 |

## 순차 작업과 중단 조건

| 순서 | 작업                 | 선행 조건      | 증거 산출물                                                                             | 중단 조건                               |
| ---- | -------------------- | -------------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| 1    | DG0 계약 통일        | 없음           | v1.7 차이 매트릭스, 정본 문서 정합화, §11 체크리스트·§15 추적 표, analyze/converge 보고 | 사람 DG0 판정 전 DG1 착수 금지          |
| 2    | §12.1 보유 자료 검사 | DG0            | `docs/plan/gates/DG1-v17-materials-inspection.md` — 식별자·지수·공란 날짜 검사 결과     | 미확인 필드는 계산 미사용               |
| 3    | P0-01 및 DG1         | §12.1          | 날짜 5상태, anchor, 대표 5종, 필드 승인, 회귀 #1~5/#14                                  | 사람 DG1 판정 전 백필 금지              |
| 4    | DG2                  | DG1            | raw 구간, checkpoint, 달력, 252 warm-up, diff                                           | 사람 DG2 판정 전 Scanner/재현 착수 금지 |
| 5    | P0-02~04             | DG2            | 유니버스·지표·분배 의심 상태, 회귀 #6-A/#6-B 최초 RED→GREEN                             | 미승인 필드/비교 가능성은 계산 미사용   |
| 6    | P0-05                | P0-02~04       | Scanner A/B, 그룹 정책, 회귀 #8/#13                                                     | A/B 점수 혼합 금지                      |
| 7    | P0-06 공통 선정 엔진 | P0-05          | 부록 B 단일 구현, 회귀 #9/#10                                                           | UI/재현 별도 선정 구현 금지             |
| 8    | DG2.5                | 공통 선정 엔진 | #6-A/#6-B GREEN 유지 재검증, 과거 재현 Gate 미래 차단, 만기/검열/분모, 100% 재현        | 실패 시 자동 튜닝 금지                  |
| 9    | P0-06 화면 및 DG3    | DG2.5          | 불변 카드, 주간 발행, 수작업 경계                                                       | 사람 DG3 판정 전 발행 활성화 금지       |
| 10   | DG4                  | DG3            | 인증·복구·지연·품질 차단·원본 보호                                                      | 사람 DG4 판정 전 운영 알파 선언 금지    |

## 공통 검증 규칙

- 각 DG와 P0 단계는 먼저 PRD §12.2의 해당 테스트를 RED로 배치하고, 구현 후 GREEN 출력과 `npm run check-all`, `npm run build` 결과를 남긴다. #6-A 현재 master 차단과 #6-B 미래 가격·상태 차단은 P0-02 완료 조건에서 최초 RED→GREEN으로 증명하고 DG2.5에서 재검증한다.
- 각 DG 종료 시 Gate 문서의 §11 체크리스트와 §15 추적 표로 통과 조건과 수용 기준 15개를 대조하고, `/speckit-analyze`·`/speckit-converge` 보고를 `docs/plan/gates/speckit/<dg>/`에 연결한다. 이 결과들은 사람의 Gate 판정을 대체하지 않는다.
- DG2.5 실패는 `superpowers:systematic-debugging`으로 원인을 분류한다. 버그는 같은 `rule_version`으로 재실행하고, 계약/정책 문제는 `/speckit-converge`와 사람 승인 후 새 버전으로 재실행한다.
- 정책 변경, 필드 `CALC_APPROVED`, 지수 비교 가능성, 수동 날짜 상태, `DRAFT → PUBLISHED`, 식별자 수동 병합, Gate 판정, 헌법 개정은 사람 전용이다.

## 역사적 문서의 위치

`docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`, 기존 `docs/plan/gates/DG0-scope-baseline.md` 및 `DG1-data-rights.md`는 이전 제품 방향의 역사적 기록이다. 삭제·재작성하지 않으며, 현행 v1.7 판단에는 이 문서와 새 v1.7 Gate 증거만 사용한다.
