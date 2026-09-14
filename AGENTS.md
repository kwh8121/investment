<!-- Updated: 2026-09-14 | v1.7 implementation workflow baseline -->

# ETF Price Signal MVP

## Purpose and Current Baseline

이 저장소는 국내 상장 ETF의 가격·거래량·거래대금·NAV를 수집하여 가격 모멘텀 및 낙폭·반등 후보를 주간 관찰 카드로 기록하고, 선정 당시 입력과 이후 가격 변화를 재현 가능하게 보존하는 개인 비상업·비공개 MVP다.

스펙은 `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`로 확정됐다. 기존 P0-01~10, 한·미 동시 범위, 환율·분배금·총수익·자동 전향평가 기준의 코드·문서·완료 표기는 v1.7 충족 증거가 아니다. 구현은 `docs/ROADMAP-v1.7.md`와 `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`의 Task 1(DG0)부터 시작하며, DG0 정합화 전에는 기존 결과를 재사용하거나 후속 Gate를 주장하지 않는다.

## Authoritative Development Inputs

| 우선순위 | 문서 | 역할 |
|----------|------|------|
| 1 | `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md` | 제품 범위, 정책값, P0-01~07, DG0~DG4, §12.2 테스트 14개, §15 수용 기준의 정본 |
| 2 | `docs/constitution.md` | PRD 위반 시 프로젝트를 무효로 하는 전역 제약과 사람 전용 결정 |
| 3 | `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md` | 경량 Spec Kit + 전담 Superpowers 개발 방법론 |
| 4 | `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md` | DG별 계획을 작성·실행하기 위한 현재 프로그램 실행 순서 |
| 5 | `docs/ROADMAP-v1.7.md` | 현재 작업·의존성·상태와 증거 링크의 정본 |
| 6 | `docs/architecture-v1.7.md` | 현행 기술 경계와 기존 구현 감사의 해석 기준 |

PRD와 헌법이 충돌하면 PRD 원문이 우선한다. 계획·기존 코드·기존 Gate 기록이 PRD와 충돌하면 PRD를 조용히 변경하지 말고 DG0 차이표와 관련 Gate 증거에 기록한다.

## Product Boundaries

- 자동화 범위는 **국내 ETF**의 종가 기반 수집·지표·Scanner·주간 후보·과거 재현이다. 국내 상장 해외자산 ETF는 포함할 수 있으나 기초지수 직접 비교는 별도 사람 승인 대상이다.
- 미국 ETF, 신규 외부 데이터 제공자, 주문·자동매매, 총수익/세후수익, 역사적 환율 환산, 뉴스·LLM 투자 판단, 가상 포지션 및 전향 사후평가 자동화, 공개 원본 다운로드·재배포를 추가하지 않는다.
- 가격수익률은 총수익·체결 성과·수익 보장·신호 선별력 입증으로 표현하지 않는다. 카드 상태는 매수·매도 지시가 아니다.
- 정책값은 초기값이다. 정책값 변경은 새 `rule_version` 및 사람 승인을 요구하며, 기존 발행·평가 결과를 덮어쓰지 않는다.

## Mandatory Data and Domain Constraints

- 국내 가격·거래량·거래대금의 정본은 KRX다. 키움은 현재 마스터/실시간 안전 확인, 대표 5종 소스 대조, 거래일 달력 대조 등 PRD가 허용한 보조 역할만 수행한다.
- 필드 상태는 `SPEC_CONFIRMED → COLLECTED → SEMANTICS_VALIDATED → CALC_APPROVED` 순서만 허용한다. 계산 승인 전 필드는 점수·필터·평가에서 제외한다.
- `ka40003.acc_trde_prica`, `ka40002` 상품구조 판정, `ka40004.trace_idex_cd`, `MKTCAP`, 분배 관련 보조 필드, 의미 미승인 `stk_cls`/`drng`의 사용 제한을 PRD §2.2 및 헌법 Article II대로 지킨다.
- 날짜, 필드, 종목 가용성, 계산, 가격 확보, 품질 플래그는 별도 타입·별도 저장 열로 유지한다. 결측을 0으로 바꾸지 않으며 실제 거래량/거래대금 0은 공란과 구분한다.
- `NON_TRADING`은 가격·지표 시계열의 결측 행이 아니다. 빈 배열만으로 비거래일을 확정하지 않는다.
- 과거 신호는 기준일 이하의 관측 데이터만 읽는다. 현재 마스터·현재 명칭/지수·미래 가격/미래 상태는 차단하고, 이후 가격은 평가 모듈만 읽는다.
- 모든 계산 산출물에는 헌법 Article V.2의 식별자·출처·관측일·상태·버전·hash·run ID를 포함한다. 원본은 민감정보를 제거한 뒤 SHA-256·수집 시각·변환 버전과 함께 불변 보존한다.
- 동일 input manifest·달력 버전·규칙 버전은 유니버스·지표·순위·최종 후보를 100% 재현해야 한다. 퍼센타일, 반올림, 그룹 해시, tie-break는 PRD 부록 A를 그대로 따른다.

## Required Development Flow

세션 첫 응답과 모든 하위 작업 브리프에는 다음을 명시한다: **“스펙은 PRD v1.7 Final로 확정됐으며, 재설계·재서술하지 않는다.”**

1. **Plan:** `superpowers:writing-plans`로 PRD §14 순서에 맞춘 DG별 독립 계획을 만든다. 각 계획의 Global Constraints는 `docs/constitution.md` Article I~IX를 링크한다. Spec Kit의 `specify`, `clarify`, `plan`, `research`, `quickstart`, `implement` 및 Superpowers `brainstorming`은 사용하지 않는다.
2. **DG0:** 기존 문서·코드·테스트·Gate 증거를 v1.7에 매핑하고, 보존/변경/폐기 목록 및 정본 문서 정합화를 완료한다. 사람에게 DG0 체크리스트와 §15 분석을 제출한다.
3. **DG1:** §12.1 보유 자료 검사 후 P0-01의 날짜 5상태, anchor 완전 수신, 식별자 충돌, 대표 5종 대조, 필드 승인 기록을 구현·검증한다.
4. **DG2:** 원시 구간 백필, checkpoint, 거래일 달력, 252 거래일 warm-up, 유니버스 diff를 구현·검증한다.
5. **P0-02~06:** 유니버스·지표·분배 의심 → Scanner A/B → 공통 선정 엔진 순서로 구현한다. UI보다 공통 선정 엔진과 과거 재현의 동일 코드 사용을 먼저 증명한다.
6. **DG2.5:** 미래 정보 차단, 만기/검열/분모, 부록 A/B 결정성 및 100% 재현을 검증한다. 실패 시 `superpowers:systematic-debugging`을 사용한다. 버그는 같은 `rule_version`으로 재실행하고, 계약/정책 문제는 `/speckit.converge`로 새 버전 태스크를 만든 뒤 사람 승인을 받는다.
7. **DG3:** 불변 관찰 카드와 주간 발행을 구현한다. A 최대 2개/B 최대 1개, 교체·실패 처리, 수작업 전향 추적 경계를 검증한다.
8. **DG4:** 인증·제한·재시도·복구·지연·품질 차단·원본 보호를 운영 알파 증거로 검증한다.

각 DG는 다음 Superpowers 순서를 따른다: `using-git-worktrees` → `subagent-driven-development` → `test-driven-development` → `requesting-code-review` → `finishing-a-development-branch`. 병렬 작업은 동일 DG에서 소유 파일이 겹치지 않는 감사/테스트 작업으로 한정하며, 상태·저장소·선정 엔진 경계는 한 명의 통합 담당자가 소유한다.

## Gate and Human Decision Rules

- DG0~DG4는 순차 Gate다. 선행 Gate의 증거와 사람 판정 전에는 후속 Gate 의존 구현을 시작하거나 통과를 주장하지 않는다.
- 각 DG 종료 시 `/speckit.checklist`로 PRD §11 통과 조건을 대조하고 `/speckit.analyze`로 §15의 15개 수용 기준을 대조한다. 결과는 Gate 증거이며 사람 판정을 대체하지 않는다.
- 사람이 승인해야 하는 일: `CALC_APPROVED`와 지수 비교 가능성 승격, 정책값 변경, 수동 날짜 상태 변경, `DRAFT → PUBLISHED`, 식별자 다대일 충돌 병합, 가상 손실 단계 재개, DG 통과 판정, 헌법 개정.
- DG2.5 실패를 수익률로 보정하기 위해 점수·필터·임계값을 자동 튜닝하지 않는다.

## Test and Quality Requirements

- 코드보다 먼저 PRD §12.2의 해당 필수 회귀 테스트를 failing 상태(RED)로 추가하고, 구현 후 GREEN 출력으로 증명한다. #6 미래정보 차단 테스트는 모든 DG에서 GREEN이며 skip/xfail 금지다.
- 각 구현 단계는 대상 Node 테스트 → `npm run check-all` → `npm run build` 순으로 검증한다. `npm run check-all`은 상태 검사, DG 증거/어댑터 테스트, TypeScript typecheck, ESLint, Prettier 검사를 포함한다.
- 변경한 코드에는 테스트, 변경한 Gate에는 원문 실행 결과·input manifest·체크리스트/분석 링크를 남긴다. 실패 시 원인을 해결하거나 검증 공백을 명시하며 GREEN으로 주장하지 않는다.
- TypeScript strict와 `@/*` 별칭을 유지한다. App Router는 Server Component를 기본으로 하며 클라이언트 상호작용에만 `'use client'`를 쓴다. UI는 도메인 규칙/외부 데이터 접근이 아닌 읽기 모델 표시에 한정한다.

## Repository Map

| 경로 | 책임 |
|------|------|
| `src/lib/etf/` | 수집·정규화·저장소·지표·Scanner·선정·재현·평가 도메인 계층 |
| `test/` | Node 내장 테스트 러너 기반의 도메인/Gate/회귀 테스트 |
| `scripts/` | 서버 전용 수집·증거 획득 보조 스크립트 |
| `migrations/` | 불변 SQL migration; 적용된 파일을 수정·삭제하지 않음 |
| `src/app/`, `src/components/` | App Router 및 v1.7 읽기 모델 UI; 판단 규칙을 두지 않음 |
| `docs/plan/gates/` | DG 실제 체크리스트·실행 증거·사람 판정 기록 |
| `docs/superpowers/plans/` | Superpowers 실행 계획 작업 공간; 코드 변경 전 DG별 계획 생성 |

## Current Tooling

- Runtime: `next@16.3.4`, `react@19.2.8`, `typescript@^5`, Tailwind CSS v4, shadcn/ui, Zod v4.
- Quality: ESLint v9, Prettier v3, Node 내장 테스트 러너, Playwright(필요한 smoke/e2e 검증에만 사용).
- 새 의존성은 명시적으로 필요성이 입증된 경우에만 추가한다. 외부 SDK/API의 최신 사용법은 공식 문서를 확인한 뒤 구현한다.

<!-- MANUAL: 프로젝트 차원에서 보존할 사용자 메모를 이 줄 아래에 추가하세요 -->

## 문서 정책: One Fact, One Home

이 프로젝트는 [`docs/guides/one-fact-one-home.md`](docs/guides/one-fact-one-home.md)의 원칙을 따른다. 모든 사실은 단 하나의 정본(canonical home)에만 두고, 다른 문서·도구·메모리에는 정본 링크와 필요한 최소 요약만 둔다. 정본의 본문을 복제하거나, 캐시·세션 로그·계획 초안으로 정본을 대체하지 않는다.

### 사실 유형별 정본 위치

| 사실 유형 | 정본 위치 | 다른 위치에는 |
|-----------|-----------|---------------|
| 제품 사실 / 요구사항 / 인수 조건(AC) / 제품 제약 | 현재 승인된 PRD (현재: `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`) | PRD 경로와 짧은 적용 범위만 둠 |
| 확정된 구현 계획 | `docs/plan/` | `docs/superpowers/plans/`의 작업 초안·실행 계획에는 정본 링크만 둠 |
| 실행 일정 / 작업(Task) / 의존관계 / 진행 상황 / 현재 담당 | `docs/ROADMAP-v1.7.md` | 계획·Gate 문서에는 관련 Task/Gate 링크만 둠 |
| Gate 실제 판정 / 판정 일자 / 판정 증거 | `docs/plan/gates/*.md` | ROADMAP에는 상태와 Gate 문서 링크만 둠 |
| 기술적 경계 / 구현 완료 vs 계획 항목 / 승인된 기술 결정 | `docs/architecture-v1.7.md` | PRD·ROADMAP·계획에는 결정 요약과 링크만 둠 |
| 코드 변경 / 브랜치 / 커밋 / PR | Git 기록 | 문서에는 SHA·PR·경로 링크와 짧은 결과만 둠 |
| 외부·업스트림 조사 및 참고 자료 | `docs/references/` | 계획·작업 로그에는 참조 링크만 둠 |
| 세션의 실제 작업 이력 | `docs/jobs/YYYY-MM-DD-*.md` (도입 시) | 장기 메모리에는 요약·재개 포인터만 둠 |
| 장기 프로젝트 학습 / 검색용 컨텍스트 | OpenViking | 정본 문서 경로를 가리키는 캐시로만 취급 |
| 개인 선호 / 응답 스타일 | 사용자 프로필 메모리 | 프로젝트 정책이나 제품 사실을 복제하지 않음 |

### 운영 규칙

- 계획 초안·검증 요청·진행 중 상태는 정본 문서로 승격되기 전까지 해당 작업 산출물에만 둔다. 승인된 구현 계획만 `docs/plan/`에 불변 스냅샷으로 남긴다.
- `docs/superpowers/plans/`는 Superpowers가 생성한 실행 계획의 작업 공간이다. 승인된 계획을 중복 복사하지 말고, 정본 계획의 링크·상태·차이만 기록한다.
- `docs/ROADMAP-v1.7.md`는 일정·작업·의존성·현재 상태의 정본이며 Gate의 판정 근거나 제품 요구사항 본문을 복제하지 않는다. `docs/ROADMAP.md`는 이전 제품 방향의 역사적 스냅샷이다.
- Gate 기록(`docs/plan/gates/*.md`), 승인된 계획(`docs/plan/`), 날짜가 찍힌 리포트와 원본 소스 플랜은 역사적 스냅샷이다. 중복 제거만을 이유로 재작성하지 않는다. 정정은 새 문서·새 버전·원문 링크로 남긴다.
- PRD 버전이 바뀌면 새 승인 PRD를 제품 사실의 정본으로 지정하고, 현행 ROADMAP·architecture에는 새 경로와 영향만 갱신한다. 이전 PRD·ROADMAP·architecture는 역사적 참조로 보존한다.
- 코드·테스트·Gate 증거가 충돌하면 관련 정본 문서를 조용히 덮어쓰지 않는다. 충돌 위치와 영향을 ROADMAP 또는 Gate 증거에 기록하고, PRD/헌법이 요구한 사람 전용 결정은 사람에게 제출한다.
- 디렉터리 범위의 `AGENTS.md`는 해당 경로의 작업 규칙만 담는다. 제품·계획·Gate·기술 결정의 정본을 대체하지 않는다.
- OpenViking, Mem0, `.sisyphus/notepads/**`, 작업 메모 및 도구 상태는 검색·리마인더용 캐시다. 정본을 확인하지 않은 채 제품 사실·승인 상태·Gate 결과로 인용하지 않는다.
- 문서를 추가하거나 갱신하기 전에는 위 표에서 정본 위치를 확인한다. 이미 정본에 있는 내용을 다른 문서에 전체 복제하지 않는다.
- 경로는 저장소 루트 기준 상대 경로로 표기한다 (예: `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`, `docs/plan/gates/DG0-v17-contract-unification.md`).
