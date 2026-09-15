# ETF Price Signal MVP v1.7 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement each DG plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 상장 ETF의 가격 기반 신호를 수집·재현·주간 관찰 카드로 기록하는 개인 비공개 MVP를 v1.7 Final 계약과 DG0~DG4 Gate 순서대로 구현한다.

**Architecture:** 수집 원본과 정규화 결과를 불변 버전으로 보존하고, 날짜·필드·종목·계산·평가 상태를 분리한다. 과거 신호 계산은 기준일 이하로 권한을 좁힌 저장소 인터페이스만 사용하며, 이후 가격은 평가 모듈만 읽는다. Scanner와 주간 발행은 하나의 공통 선정 엔진을 공유하고 UI는 그 읽기 모델만 표시한다.

**Tech Stack:** Next.js App Router, React, TypeScript strict, Node 내장 테스트 러너, PostgreSQL 호환 저장소/SQL migration, Tailwind CSS, KRX·키움 서버 전용 수집 경계.

**Spec:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md` (재서술하거나 별도 `spec.md`를 만들지 않는다); `docs/constitution.md`; `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md`.

## Global Constraints

- 스펙은 PRD v1.7 Final로 확정되어 있다. 재설계·재서술·`clarify`는 하지 않으며, §13 미결 항목은 계산에 사용하지 않는다.
- 제품은 개인 비상업·비공개 내부 사용이다. 미국 ETF, 주문·자동매매, 총수익, 뉴스/LLM 판단, 전향 평가 자동화, 공개 원본 다운로드는 범위 밖이다.
- 정책값은 최적화되거나 검증된 값으로 표현하지 않는다. 정책을 바꾸면 새 `rule_version`을 만들고 기존 발행·평가 결과를 덮어쓰지 않는다.
- 필드 상태는 `SPEC_CONFIRMED → COLLECTED → SEMANTICS_VALIDATED → CALC_APPROVED`만 허용한다. 사람만 `CALC_APPROVED`와 비교 가능성을 승인할 수 있다.
- 상태 축을 단일 enum으로 합치지 않으며, 결측을 0으로 대체하지 않는다. `NON_TRADING`은 시계열 결측 행이 아니다.
- 과거 재현은 현재 마스터 및 미래 가격에 접근하지 않는다. 미래 가격은 평가 모듈만 읽으며, 이 금지는 테스트로 증명한다.
- 모든 계산 산출물은 PRD §9.1의 버전·해시·실행 식별 필드를 갖고, 원본 응답은 민감정보 제거 후 상태와 무관하게 보존한다.
- 동일 input manifest·calendar/rule version은 100% 같은 유니버스·지표·순위·후보를 만든다. 정렬과 퍼센타일 규칙은 PRD 부록 A를 그대로 구현한다.
- DG0~DG4의 통과 판정, 정책값 변경, 수동 날짜 변경, `DRAFT → PUBLISHED`, 식별자 수동 병합, 손실 단계 재개는 사람 전용 결정이다. 에이전트는 증거만 제출한다.
- 각 DG는 먼저 §12.2 필수 회귀 테스트를 RED로 추가하고, 구현 후 GREEN을 증명한다. DG 종료 때 Gate 문서의 §11 체크리스트·§15 추적 표와 `/speckit-analyze`·`/speckit-converge` 보고를 Gate 증거로 제출한다.

---

## Starting State and Decision

`docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`와 기존 `src/lib/etf/**`는 이전 P0-01~10 및 한·미 시장 계약을 기준으로 한다. v1.7은 국내 ETF·P0 7개·DG0~DG4 계약을 기준으로 하므로, 기존 구현/fixture/완료 표기는 **v1.7 충족 증거가 아니다**. 현행 정본은 각각 `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`, `docs/ROADMAP-v1.7.md`, `docs/architecture-v1.7.md`이며, DG0에서 코드 계약의 차이를 명시적으로 분류한 뒤 적합한 부분만 새 테스트로 재채택한다.

| 작업 단위      | 선행 조건      | 사람이 판정할 Gate | 완료 산출물                                |
| -------------- | -------------- | ------------------ | ------------------------------------------ |
| DG0 계약 통일  | 없음           | DG0                | v1.7 기준 정본/코드 차이표, 폐기·이관 목록 |
| 보유 자료 검사 | DG0            | 없음               | §12.1 결과와 검증 불가 목록                |
| P0-01 + DG1    | 보유 자료 검사 | DG1                | 날짜·anchor·식별자·필드 승인 증거          |
| DG2 백필       | DG1            | DG2                | 불변 raw, 달력, 252 warm-up, diff 로그     |
| P0-02~04       | DG2            | 없음               | 유니버스·지표·분배 의심 계약               |
| P0-05          | P0-02~04       | 없음               | Scanner A/B와 그룹 정책                    |
| 공통 선정 엔진 | P0-05          | 없음               | 부록 B 단일 구현과 발행 입력               |
| DG2.5 재현     | 공통 선정 엔진 | DG2.5              | 100% 재현·평가 분모 증거                   |
| UI + DG3       | DG2.5          | DG3                | 불변 카드·주간 발행·수동 경계              |
| DG4 운영 알파  | DG3            | DG4                | 운영 복구·원본 보호·내부 QA 증거           |

## Acceptance Criteria

- [ ] PRD §15의 15개 수용 기준 각각이 코드 테스트와 DG 증거 문서에 추적된다.
- [ ] §12.2의 14개 회귀 테스트는 DG1 이후 모든 병합에서 GREEN이며, 미래정보 차단 테스트는 skip/xfail이 아니다.
- [ ] DG0~DG4는 PRD §11 순서대로만 증거가 제출되며, 사람의 명시 판정 전에는 다음 Gate 의존 작업을 시작하지 않는다.
- [ ] 각 Gate 결과는 `docs/plan/gates/`에, 진행 상태·의존성·증거 링크는 `docs/ROADMAP.md`에, 기술 경계는 `docs/architecture.md`에 한 번만 기록된다.
- [ ] `npm run check-all` 및 `npm run build`가 각 구현 DG의 종료 시 통과한다.

## File Structure and Ownership

| 경로                                                       | 책임                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`              | 유일한 제품/정책 스펙; 수정 금지                               |
| `docs/constitution.md`                                     | 위반 시 무효인 제약과 사람 전용 결정                           |
| `docs/ROADMAP-v1.7.md`                                     | 실행 상태·작업·의존성·증거의 현행 정본                         |
| `docs/architecture-v1.7.md`                                | 현행 기술 경계와 기존 구현/운영 경계의 해석 기준               |
| `docs/plan/gates/DG{n}-*.md`                               | 사람이 판정할 Gate의 실제 체크리스트·증거                      |
| `docs/superpowers/plans/*-dg*.md`                          | DG별 독립 구현 계획; 코드 변경 전 작성                         |
| `src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**` | v1.7 계약을 구현·검증하는 코드; DG별 계획에서 변경 표면을 확정 |

## Implementation Tasks

### Task 1: DG0 — v1.7 기준선 및 기존 자산 감사

**Files:**

- Modify: `docs/ROADMAP-v1.7.md`, `docs/architecture-v1.7.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`의 현행/역사 상태 표기
- Create: `docs/plan/gates/DG0-v17-contract-unification.md`, `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md`
- Inspect: `src/lib/etf/**`, `test/**`, `migrations/**`, 기존 Gate 증거

**Produces:** PRD v1.7 §2·§3·§4·§9·§11 기준의 요구사항→코드/테스트/증거 매트릭스, 보존/변경/폐기 목록, v1.7 전용 ROADMAP 상태.

- [ ] 기존 문서의 P0-01~10, 미국 ETF, 환율·분배금·총수익·자동 전향평가 항목을 찾아 v1.7의 비목표/제한 계약과 비교한다.
- [ ] 기존 `src/lib/etf/**`와 `test/**`를 §12.2 테스트 14개 및 §15 기준에 매핑하고, v1.7 계약을 실제로 증명하는 테스트와 폐기/격리할 테스트를 분리한다.
- [ ] `docs/ROADMAP-v1.7.md`를 v1.7의 DG0~DG4 순서와 현재 증거 상태로 유지한다. 이전 `docs/ROADMAP.md`는 역사 문서로 보존하며 완료 표기를 승계하지 않는다.
- [ ] `docs/architecture-v1.7.md`를 국내 KRX 정본, 키움의 제한된 역할, 미래 접근 분리, 상태 분리, 불변 버전 계약으로 유지한다. 이전 `docs/architecture.md`는 역사 문서로 보존한다.
- [ ] DG0 §11 체크리스트와 §15 수용기준 추적 표를 작성하고 `/speckit-analyze` 보고를 연결해 사람에게 판정 자료로 제출한다.
- [ ] `npm run check-all`과 `npm run build`를 실행하고 결과를 Gate 증거에 기록한다.
- [ ] Commit: `docs: align canonical execution artifacts with ETF signal PRD v1.7`.

### Task 2: §12.1 보유 자료 검사와 DG1 계획 확정

**Files:**

- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg1.md`
- Modify: `docs/plan/gates/DG1-*.md`, `docs/ROADMAP-v1.7.md`
- Inspect: 승인된 원본/기존 redacted 증거, KRX/키움 어댑터와 fixtures

**Produces:** 식별자·지수 배열·공란 날짜의 검증 결과, 부족한 입력의 `NOT_CALCULABLE`/계산 미사용 경계, DG1의 테스트 우선순위.

- [ ] 보유 원본만으로 전체 식별자 형식·변환 충돌·대표 5종 코드 연결을 검증하고, 실패는 자동 병합하지 않고 보존한다.
- [ ] 지수 배열 결측이 있는 표본은 해싱/그룹화하지 않는지 검사한다.
- [ ] 선행 문서의 공란 날짜는 원본·anchor 수신 완전성·상태 근거가 모두 있을 때만 상태 후보로 기록한다.
- [ ] 필드 승인 기록의 아홉 필수 항목을 점검한다. 누락 필드는 `CALC_APPROVED`로 올리지 않고 계산 입력에서 제외한다.
- [ ] 결과와 미확인 항목을 DG1 계획 및 Gate 체크리스트에 기록한다. 사람 전용 승인 요청 외에는 보완 호출을 정책 변경으로 해석하지 않는다.

### Task 3: P0-01 — 수집·날짜 상태·anchor·체크포인트 (DG1)

**Files:**

- Modify/Create: DG1 계획에서 확정할 `src/lib/etf/` 수집·상태·저장소 경계, `test/` 회귀 테스트, migration 및 수집 스크립트
- Modify: `docs/plan/gates/DG1-*.md`, `docs/architecture-v1.7.md`, `docs/ROADMAP-v1.7.md`

**Interfaces:** 수집 결과는 raw hash·수집 시각·변환 버전·날짜 상태를 보존한다. `TRADING`만 달력 축에 추가하고, 상태 판정은 `FETCH_FAIL`, `PARTIAL`, `TRADING`, `PUBLISH_PENDING`, `NON_TRADING`을 별도 열/타입으로 유지한다.

- [ ] §12.2 #1~#5와 #14의 failing test를 먼저 추가하고 RED를 기록한다.
- [ ] PRD §3.2~§3.5 우선순위와 48시간 대기, 완전 수신 anchor, 중복·기준일 불일치 검사를 최소 구현한다.
- [ ] raw 응답의 SHA-256·redaction·불변 저장과 완료 날짜 재적재 없는 재개를 구현한다.
- [ ] 대표 5종 KRX/키움 대조, 식별자 충돌 검사, 필드 단위/부호/결측 증거를 연결한다.
- [ ] 테스트를 GREEN으로 만들고 `check-all`·build 결과 및 §11 체크리스트·§15 추적 표와 `/speckit-analyze`·`/speckit-converge` 보고를 DG1 증거로 제출한다.

### Task 4: DG2 — 원시 구간 백필·달력·warm-up·diff

**Files:**

- Modify/Create: 백필 수집기, checkpoint 저장소, 거래일 달력, universe diff 테스트/증거
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg2.md`, `docs/plan/gates/DG2-*.md`

- [ ] 승인된 DG1 입력 범위에 한해 기준일별 KRX 원시 구간을 수집하고, 각 실행의 manifest와 `data_version`을 고정한다.
- [ ] 승인된 `TRADING` 날짜만으로 달력 버전을 만들고 252거래일 warm-up 충족 여부를 명시한다.
- [ ] 연속 거래일의 관측 유니버스 diff와 신규·소멸 로그를 생성한다. 현재 마스터로 과거 유니버스를 보정하지 않는다.
- [ ] 중단/재개, 중복 raw 방지, 불완전 날짜의 계산 차단을 테스트한다.
- [ ] DG2 체크리스트·수용기준 분석 결과를 사람에게 제출한다.

### Task 5: P0-02~04 — 유니버스·지표·분배 의심 계약

**Files:**

- Modify/Create: `src/lib/etf/`의 유니버스, 가격 지표, 품질/분배 의심 모듈과 각 Node test
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-domain-inputs.md`

- [ ] 기준일 KRX `TRADING` 응답에서 `OBSERVED_UNIVERSE`를 만들고, 원본 키·내부 식별자·소스 원본 코드를 분리한다.
- [ ] 252일 입력·필드 승인·필터별 제외 사유·`WATCH_ONLY_UNCLASSIFIED`를 보존한다.
- [ ] 지표 입력 부족은 비중 재배분 없이 `NOT_CALCULABLE`/사유를 반환하고, 수정·미수정 가격을 혼합하지 않는다.
- [ ] §5.2~§5.4의 비교 가능성 미승인 시 `NOT_COMPARABLE`, 지수 결측 시 그룹 미생성, 분배/기업행사 의심 시 자동 보정 금지를 구현한다.
- [ ] §12.2 #7과 #12 및 입력 결측 경계 테스트를 GREEN으로 만든다.

### Task 6: P0-05 — Scanner A/B와 그룹 정책

**Files:**

- Modify/Create: Scanner/퍼센타일/정렬 모듈과 `test/etf-scanner*.test.ts`, `test/etf-strategy*.test.ts`
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-scanners.md`

- [ ] PRD 부록 A의 기간·산식·점수·결측 처리·평균 순위 퍼센타일을 그대로 테스트부터 구현한다.
- [ ] n=1=50, 동점 평균 순위, `ROUND_HALF_UP` 2자리 및 음의 0 정규화의 결정성을 검증한다.
- [ ] A/B 점수를 직접 비교하지 않고 각 Scanner의 입력·구성·모집단·버전을 결과에 저장한다.
- [ ] 점수 내림차순→당일 거래대금 내림차순→`ISU_CD` 오름차순 정렬을 고정한다.
- [ ] §12.2 #8과 동일 manifest 재현 테스트를 GREEN으로 만든다.

### Task 7: P0-06 공통 선정 엔진 — 부록 B 상태 전이

**Files:**

- Modify/Create: 공통 선정 엔진, 발행 입력 DTO, 상태 전이/중복 테스트
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-selection-engine.md`

- [ ] UI와 과거 재현이 동일 함수/모듈을 호출하도록 인터페이스를 확정하고, 재현 전용 선정 구현을 만들지 않는다.
- [ ] A 최대 2/B 최대 1의 독립 슬롯, A 우선 후 B 중복 제거, 빈 슬롯 비양도를 구현한다.
- [ ] 기존 후보의 Gate 실패 즉시 제거, 빈 슬롯 충원, 동일 도전자 2회 우위 교체, 주간 1건 교체 제한을 테스트한다.
- [ ] §12.2 #9~#10과 카드 상태가 매수/매도 지시가 아님을 검증한다.

### Task 8: DG2.5 — 과거 재현·평가·결정성

**Files:**

- Modify/Create: as-of 제한 저장소, 재현 실행기, 평가 모듈, manifest/분모 테스트
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg25.md`, `docs/plan/gates/DG2.5-*.md`

- [ ] §12.2 #6을 RED로 배치한다. 과거 신호 경로에서 현재 마스터 또는 기준일 이후 가격을 요청하면 실패해야 하며, 이 테스트는 skip/xfail 금지다.
- [ ] 평가 모듈만 1·2·4·8주 이후 가격을 읽도록 분리하고 `NOT_MATURED`, `CENSORED_MISSING`, `CENSORED_DELISTED_OR_UNAVAILABLE`을 보존한다.
- [ ] 실제 데이터에서 만기·검열·분배/기업행사 의심·모든 분모·비중첩 블록 수를 산출한다.
- [ ] 같은 manifest·calendar/rule version을 두 번 실행해 유니버스·지표·순위·후보가 byte-for-byte 동등함을 검증한다.
- [ ] 실패 원인이 버그면 `systematic-debugging` 후 같은 `rule_version`으로 재실행한다. 계약/정책 문제면 `/speckit-converge`로 새 버전 태스크를 만들고 사람 승인을 기다린다. 수익률 기반 자동 튜닝은 금지다.

### Task 9: P0-06 UI·주간 발행 및 DG3

**Files:**

- Modify/Create: 읽기 모델, Server Component 화면, 발행/불변 카드 모듈, UI·발행 테스트
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg3.md`, `docs/plan/gates/DG3-*.md`

- [ ] 화면은 기준일·수집 시각·상태·규칙 버전·점수 구성·위험/해제 조건·그룹/분배 의심 상태만 표시하는 읽기 경계로 만든다.
- [ ] `DRAFT → PUBLISHED`는 사람 승인을 요구하고 동일 주차·규칙 버전 중복 발행을 차단한다.
- [ ] 원본 묶음 hash와 모든 §9.1 공통 필드를 카드/발행 입력에 연결하며, 발행 후 수정은 새 정정 버전으로만 허용한다.
- [ ] 전향 1·2·4·8주 추적과 가상 손실 단계는 스프레드시트 작업으로 명시적으로 분리하며 자동화하지 않는다.
- [ ] DG3 체크리스트·§15 분석 및 화면/도메인 테스트 결과를 제출한다.

### Task 10: DG4 — 운영 알파·복구·보호 검증

**Files:**

- Modify/Create: 인증/제한/재시도/복구/지연/원본 보호 운영 경계와 테스트
- Create: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg4.md`, `docs/plan/gates/DG4-*.md`, 수작업 스프레드시트 템플릿(필요 시)

- [ ] 서버 전용 시크릿 경계, redacted raw/log, 인증 만료, rate limit, timeout, 재시도와 checkpoint 복구를 검증한다.
- [ ] `PUBLISH_PENDING`/`PARTIAL`/필드 승인 부족/품질 의심이 발행을 차단하는 시나리오를 검증한다.
- [ ] 원본 불변성, 버전 추적, 재현성, private-only UI 접근 경계를 end-to-end로 점검한다.
- [ ] `npm run check-all`, `npm run build`, 필수 Node tests 및 필요한 Playwright smoke test를 실행한다.
- [ ] Gate 체크리스트와 분석 결과를 사람에게 제출하고, 승인 전에는 운영 안정화/발행 활성화로 표기하지 않는다.

## Required Regression-Test Placement

| DG             | §12.2 번호        | 최소 증명                        |
| -------------- | ----------------- | -------------------------------- |
| DG1            | 1, 2, 3, 4, 5, 14 | 날짜/anchor/식별자/0·공란/재개   |
| P0-02~04       | 7, 12             | 지수 결측과 평가·품질 상태       |
| P0-05          | 8, 13             | 퍼센타일과 동일 입력 재현        |
| 공통 선정 엔진 | 9, 10             | 즉시 제외와 A/B 중복 제거        |
| DG2.5          | 6, 11, 12, 13     | 미래 차단, 만기·검열·분모·결정성 |

## Verification and Gate Evidence

1. 각 DG 계획은 코드 변경 전에 해당 테스트의 failing assertion과 정확한 실행 명령을 포함한다.
2. 구현자는 RED 출력 → 최소 구현 → 대상 테스트 GREEN → `npm run check-all` → `npm run build` 순서의 원문 결과를 Gate 증거에 링크한다.
3. Gate 문서의 §11 체크리스트는 해당 DG 통과 조건을, §15 추적 표는 15개 기준 커버리지를 대조한다. `/speckit-analyze`(문서 정합성)와 `/speckit-converge`(코드 대조)는 보조 보고이며, 모두 사람의 Gate 판정을 대체하지 않는다.
4. DG2.5가 실패하면 자동 튜닝하지 않는다. 원인/수정/새 버전 여부를 기록하고 헌법 Article VII.3 절차를 따른다.
5. 완료 보고에는 변경 파일, §12.2/§15 매핑, 실행 명령 결과, 남은 인간 승인 항목만 적는다.

## Risks and Mitigations

| 위험                                            | 완화                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| 기존 P0-01~10 문서/코드를 v1.7 완료로 오인      | DG0 매핑 전 후속 구현·Gate 증거 재사용 금지                |
| 승인되지 않은 KRX/키움 필드를 계산에 투입       | 필드 승인 레코드와 타입/저장소 guard, 테스트               |
| 백필 데이터에 미래 정보 또는 현재 마스터가 섞임 | as-of 제한 인터페이스와 필수 회귀 #6                       |
| 비거래일·빈 배열·0을 같은 결측으로 처리         | 상태 축 분리 및 #1~#4 테스트                               |
| DG2.5 결과가 약해 정책값을 몰래 변경            | 버그/계약/정책 실패 분리, 새 `rule_version`과 사람 승인    |
| Gate 체크가 문서 작업으로만 끝남                | 각 Gate의 실행 로그·manifest·테스트·체크리스트를 함께 제출 |

## Execution Handoff

권장 실행은 **Task 1(DG0)만 별도 계획으로 먼저 완료·검토**한 뒤, 사람이 DG0을 판정하는 방식이다. 이후 DG1→DG4는 순차 의존이므로 한 DG의 Gate 증거가 없으면 다음 DG의 구현을 시작하지 않는다.

- DG별 구현: `superpowers:using-git-worktrees` → `superpowers:subagent-driven-development` → `superpowers:test-driven-development` → `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch`.
- 병렬화는 동일 DG 내부의 서로 겹치지 않는 테스트/문서 감사에만 사용한다. 상태/저장소/선정 엔진 경계는 단일 소유자가 통합한다.
- 역할 권장: `explore`(기존 계약 감사), `executor`(DG 구현), `test-engineer`(14개 회귀 테스트), `code-reviewer`(헌법 위반 검사), `verifier`(Gate 증거와 §15 추적). 외부 API·라이브러리의 최신 계약이 필요할 때만 `researcher`를 추가한다.

## Plan Self-Review

- PRD §14의 11단계와 DG0~DG4의 순서를 모두 매핑했다.
- PRD §12.2의 14개 필수 회귀 테스트를 DG별 RED/GREEN 배치로 추적했다.
- PRD §15의 15개 기준은 Acceptance Criteria와 Gate 분석 절차에 포함했다.
- 헌법 Article I~IX의 사람 전용 결정, 미래 정보 차단, 상태 분리, 불변성, 결정성, 자동 튜닝 금지를 Global Constraints로 반영했다.
- 이 문서는 실행 순서 계획이다. 제품 사실은 PRD, 실행 상태는 ROADMAP, 기술 결정은 architecture, Gate 판정은 gates 디렉터리에만 기록한다.
