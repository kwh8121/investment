# 아키텍처 — 역사적 스냅샷 (v1.7 기준선 수립 전)

> **상태:** 이 문서는 이전 P0-01~10 제품 방향에서의 코드/fixture 경계를 기록한 역사적 참조다. 현행 v1.7 기술 경계의 정본은 `docs/architecture-v1.7.md`이며, 구현 승인 전까지 기존 모듈의 완료·운영 준비 상태를 v1.7 충족 증거로 사용하지 않는다.
>
> 아래 한·미 ETF, 환율·분배금·총수익, Research/Forward Validation, G0~G4 및 Task 005~014 관련 설명은 현행 요구사항이 아니다.

이 저장소는 한국어 Next.js App Router 기반의 ETF 투자 가이드 MVP입니다. 현재 제품 대시보드와 Task 005~014의 데이터 계약·수집·전략·Scanner·리서치·가이드·위험·Forward Validation 도메인 모듈 및 결정론적 테스트가 구현되어 있습니다.

`docs/plan/gates/DG1-data-rights.md`의 Conditional Go는 한국 시장에만 적용됩니다. 현재 구현은 계약과 fixture 수준이며, 승인된 실데이터의 지속 수집·외부 연동·운영 스케줄링은 아직 연결되지 않았습니다. 구현 완료와 DG2~DG4 운영 승인은 분리하며, 실행 상태는 각 Gate 입력 JSON과 `src/lib/etf/gate-validation.ts`에서 계산합니다.

## 전체 구조

### 현재 기준선

```text
브라우저 요청 → App Router 페이지 → 레이아웃·섹션 컴포넌트 조립 → HTML/CSS 응답
```

### 구현된 계약 흐름과 미연결 운영 경계

```text
승인된 데이터 소스 또는 CSV 대체 경로
  → 원본 as-of 스냅샷·작업 로그
  → 검증·정규화
  → ETF·산업·규칙 도메인 모델
  → Server Component 또는 내부 읽기 API
  → Data & Scanner / Radar & Research / ETF Analysis / Guide & Paper
```

한국 시장의 Task 004 계약은 PostgreSQL 호환 관계형 저장소와 버전 관리 SQL 마이그레이션을 사용한다. 호스팅 제공자, ORM, 작업 큐와 스케줄러는 이 계약을 구현할 때 선택하며, 브라우저나 공개 Route Handler가 외부 데이터 소스에 직접 접근하지 않는다.

## 진입점

- `package.json` — `npm run dev`, `npm run build`, `npm run start`가 Next.js 프로세스를 시작합니다.
- `src/app/layout.tsx` — 모든 App Router 경로의 루트 레이아웃입니다. 폰트, 테마 Provider, 토스트를 조립합니다.
- `src/app/page.tsx` — `/`의 진입점이며 ETF 제품 대시보드를 렌더링합니다.
- `src/app/login/page.tsx`, `src/app/signup/page.tsx` — 로그인과 회원가입 UI의 진입점입니다. 인증 API나 세션 처리는 연결되어 있지 않습니다.

## 코드 맵

### `src/app/`

Next.js 파일 시스템 라우팅 경계입니다. 현재 `/`, `/login`, `/signup`만 존재하고 Route Handler는 없습니다. `page.tsx`와 `layout.tsx`는 프레임워크 계약에 따라 렌더링을 담당합니다.

**불변 조건:** 페이지는 기본적으로 Server Component로 유지하고, 브라우저 상태가 필요한 부분만 클라이언트 컴포넌트로 분리합니다.

### `src/components/`

프레젠테이션 계층입니다. `product-dashboard.tsx`는 Data Status, Scanner, Weekly Guide와 Paper Portfolio를 조립하고, `layout/`은 페이지 셸, `navigation/`은 메뉴, `ui/`는 shadcn/ui 프리미티브, `providers/`는 클라이언트 Provider 경계입니다.

**불변 조건:** `components/ui/`에는 ETF 판단 규칙이나 데이터 접근을 넣지 않습니다. UI는 도메인 결과를 표시하는 역할에 한정합니다.

### `src/lib/`

공통 유틸리티와 ETF 도메인 계층입니다. `src/lib/etf/`는 원본 정규화, 수집, 전략 점수, 백테스트, Scanner, 리서치·가이드, 위험, Gate와 Forward Validation 계약을 구현합니다. `src/lib/utils.ts`는 클래스 이름 결합을 제공하고 `src/lib/env.ts`는 런타임 환경을 검증합니다.

**경계:** 수집 자격 증명은 서버 전용 런타임에서만 읽고 `NEXT_PUBLIC_` 접두사를 사용하지 않는다. `KRX_API_KEY`와 키움 자격 증명·토큰·계정 식별자는 브라우저 번들, 원본 스냅샷, 정규화 데이터와 작업 로그에 기록하지 않는다.

### `docs/`

제품 계획과 개발 문서를 보관합니다. ETF MVP의 제품 범위와 G0~G4는 `docs/PRD.md`, 실행 순서와 DG0~DG5 완료 증거는 `docs/ROADMAP.md`, 기술 경계와 승인된 구현 선택은 본 `docs/architecture.md`가 각각 권위 문서입니다. Gate 판정 기록은 `docs/plan/gates/`에 보관합니다.

### `package.json`

빌드, 정적 검사, Task별 Node 테스트와 `status:check` 명령을 정의합니다. SQL 마이그레이션은 `migrations/`에 있지만 호스팅 DB, ORM, 작업 큐와 운영 스케줄러는 아직 연결되지 않았습니다.

## 데이터 흐름

### 현재 흐름

`GET /` 요청은 `src/app/page.tsx`에서 제품 셸과 `ProductDashboard`를 조립해 Data Status, Scanner, Weekly Guide와 Paper Portfolio를 표시합니다. 현재 화면 데이터는 구현·검증용 읽기 모델이며 승인된 실데이터 운영 파이프라인과 직접 연결된 상태는 아닙니다. 로그인과 회원가입 폼도 아직 인증 API나 세션 저장소에 연결되지 않았습니다.

### ETF MVP 계약 흐름

1. 한국 시장의 승인된 키움·KRX 소스 또는 CSV 대체 입력만 서버 수집 경계로 들어온다. 공개 표시, 제3자 공유, 재배포 또는 상업적 이용은 범위 밖이다.
2. 수집기는 민감한 인증 정보를 제거한 뒤 원본 as-of 스냅샷과 작업 로그를 먼저 기록한다.
3. 검증·정규화 단계는 출처, 기준일, 결측, 중복, 형식 오류와 품질 플래그를 상태값으로 보존한다. 결측을 0으로 바꾸지 않는다.
4. 검증된 한국 ETF 마스터와 일별 가격·NAV·거래량만 Task 005의 단일 ETF 흐름에 연결한다. 미국 ETF, 환율과 분배금은 DG1 재검토 전 저장·계산·표시하지 않는다.
5. G0 데이터, G1 산업·펀더멘털, G2 시장 신호, G3 ETF 적합성, G4 포트폴리오 위험을 순서대로 적용합니다. 모든 Gate와 사람 검토를 통과하지 않은 후보는 가상 편입할 수 없습니다.
6. Server Component 또는 내부 읽기 API가 안정된 화면 모델만 제공하여 `Data & Scanner / Radar & Research / ETF Analysis / Guide & Paper`의 네 제품 영역을 렌더링합니다.
7. 가이드 발행 시 입력, 규칙·유니버스 버전, 기준일, 승인 시각을 함께 고정합니다. 발행된 가이드와 가이드 스냅샷은 변경하지 않습니다.

## Task 004 승인 데이터 계약 (한국 시장 한정)

### 저장소와 마이그레이션

- 저장소는 PostgreSQL 호환 관계형 데이터베이스를 사용한다. 호스팅 제공자는 계약의 일부가 아니며 구현 시점에 선택한다.
- 스키마 변경은 `migrations/<순번>_<설명>.sql` 형식의 새 SQL 파일로만 적용한다. 적용된 마이그레이션을 수정·삭제하지 않고, 정정은 새 마이그레이션으로 표현한다.
- 수집 실행은 외부 API 호출, 원본 스냅샷 기록, 정규화와 품질 판정을 하나의 추적 가능한 `ingestion_run`으로 연결한다. 재시도는 새 실행으로 남기되 같은 원본 스냅샷을 중복 생성하지 않는다.

### 최소 엔터티와 공통 필드

| 엔터티          | 용도                              | 필수 필드                                                                                        | 고유성·변경 규칙                                                                  |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `ingestion_run` | 수집·재시도 추적                  | `id`, `source`, `started_at`, `finished_at`, `status`, `attempt`, `failure_reason`               | 실행마다 새 행; 성공·실패 모두 보존                                               |
| `raw_snapshot`  | 민감 정보가 제거된 원본 응답 보존 | `id`, `ingestion_run_id`, `source`, `endpoint`, `as_of`, `fetched_at`, `payload_hash`, `payload` | `(source, endpoint, as_of, payload_hash)` 중복 금지; 본문은 불변                  |
| `etf_master`    | 한국 ETF 식별과 분류              | `instrument_id`, `ticker`, `name`, `market`, `source`, `as_of`, `snapshot_id`                    | `instrument_id`는 KRX 표준 식별자, `ticker`는 국내 단축 코드; 변경은 새 기준일 행 |
| `daily_quote`   | 종가·거래량·NAV 정규화            | `instrument_id`, `source`, `as_of`, `close`, `volume`, `nav`, `snapshot_id`, `quality_status`    | `(instrument_id, source, as_of)`당 하나; 정정은 새 스냅샷 참조와 이력으로 표현    |
| `quality_event` | 결측·불일치·이상치 근거           | `id`, `daily_quote_id`, `rule_id`, `severity`, `observed_at`, `reason`                           | 해결 전 삭제하지 않으며 처리 상태를 별도로 기록                                   |

모든 엔터티는 `source`, `as_of`, 수집 시각, 생성 시각과 품질 상태를 유지한다. 원본에서 파생된 정규화 값은 반드시 `snapshot_id`로 역추적할 수 있어야 한다.

### 수집·재실행 규칙

- 수집 요청은 `source`, `endpoint`, `as_of`와 비민감 요청 파라미터의 해시로 식별한다. 같은 식별자가 성공한 경우 재실행은 기존 스냅샷을 재사용하고, 실패한 경우에만 새 `ingestion_run`을 남긴다.
- 기준일이 같은 서로 다른 소스 값은 덮어쓰지 않는다. 소스별 `daily_quote`를 유지하고 KRX 대조 결과는 `quality_event`로 남긴다.
- `close`, `volume`, `nav`가 없거나 의미가 확인되지 않으면 `NULL`과 원인을 기록한다. 0 또는 추정값으로 대체하지 않는다.
- 수정주가, 분할·병합·분배락 처리 기준은 아직 확정되지 않았다. 해당 이벤트가 감지되면 `quality_event`를 생성하고, 추천·성과 계산 입력에서 제외한다.

### 실행·Secret 경계

- 수집과 마이그레이션은 서버 전용 작업에서만 실행한다. 브라우저, Server Component props, 내부 읽기 DTO, 로그와 오류 응답에 Secret을 포함하지 않는다.
- API 키·토큰·쿠키·계정 식별자는 원본 응답 저장 전에 제거한다. Secret 존재 여부도 일반 사용자 화면에 표시하지 않는다.
- CSV 대체 입력은 동일한 `source`, `as_of`, `payload_hash`, 품질 검증과 추적 규칙을 거쳐야 한다.
- 미국 ETF, 환율과 분배금용 엔터티·수집기는 이번 계약에 포함하지 않는다. 해당 범위는 DG1 재검토 기록이 있어야 추가할 수 있다.

## 계획된 정보 경계

다음은 PRD P0 요구사항을 지원하기 위해 검토할 정보 경계입니다. 이는 테이블, 저장 기술, 필드 구현을 확정한 설계가 아닙니다.

| 경계             | 책임                                                     | 핵심 기록                                           |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------- |
| 데이터 소스·입력 | 개인 내부 사용 경계, 출처, 갱신 주기, CSV 대체 경로 관리 | 소스 메타데이터, 원본 as-of 스냅샷                  |
| 작업 추적        | 수집·등록 성공, 실패, 재실행 근거 보존                   | 작업 상태, 사유, 실행 시각                          |
| ETF·시장 데이터  | 마스터, 가격, 환율, 분배금과 품질 상태를 재현            | 정규화 값, 조정 상태, 품질 플래그                   |
| 전략·리서치      | 전략별 점수, Core 6, Emerging Radar와 G0~G4 판단을 재현  | 근거, 반대 근거, 규칙·유니버스 버전                 |
| 가이드·검증      | 발행 판단, 가상 포지션과 사후 평가를 시점 기준으로 재현  | 불변 가이드 스냅샷, 가상 포지션, 백테스트·평가 결과 |

## API 경계

- **App Router UI:** `src/app/**/page.tsx`가 브라우저 요청과 렌더링을 연결합니다. 현재는 정적 UI 경계입니다.
- **환경 구성:** `src/lib/env.ts`가 배포 환경과 서버 코드 사이의 구성 경계입니다. 서버 전용 값과 공개 URL을 분리해야 합니다.
- **입력 경계 (승인):** 한국 ETF의 키움·KRX·CSV 입력은 Task 004 계약의 기준일·출처·상태 규칙으로 정규화 계층에 전달한다. 미국 시장 입력은 DG1 재검토 전 거부한다.
- **읽기 경계 (계획):** Server Component를 우선 사용하고, 여러 화면이나 클라이언트 상호작용에 안정된 DTO가 필요할 때만 내부 읽기 API를 둡니다. 저장 형식이나 내부 규칙 객체를 직접 노출하지 않습니다.

## 아키텍처 불변 조건

- 구현 완료와 운영 승인을 혼동하지 않습니다. Task 005~014 도메인 계약과 fixture 테스트는 구현됐지만, 승인된 실데이터 수집과 DG2~DG4 Gate는 별도 실행 입력으로 검증합니다.
- Core 6은 초기 심층 검증군이며 고정 투자대상이 아닙니다. Emerging Radar는 승격 조건과 사람 검토 전에는 추천 후보로 사용하지 않습니다.
- 목표 범위는 사전 필터를 통과한 한국·미국 ETF이나, 현재 구현 승인 범위는 한국 ETF뿐이다. 미국 시장은 `docs/plan/gates/DG1-data-rights.md` 재검토 전 입력·저장·계산·표시하지 않는다.
- 레버리지·인버스 ETF는 기본 추천에서 제외합니다. ETF·ETN 구분과 상품 구조를 G3에서 검증합니다.
- G0 데이터 품질을 통과하지 못한 입력은 점수 계산과 가이드 발행을 차단합니다. G1~G4도 순서대로 산업·펀더멘털, 시장 신호, ETF 적합성, 포트폴리오 위험을 검증합니다.
- Momentum Acceleration과 Oversold Recovery는 별도 스코어카드와 버전으로 계산하며 전략 간 점수를 직접 비교하지 않습니다.
- 동일 입력과 동일 규칙·유니버스 버전은 동일 결과를 재현해야 합니다.
- 모든 판단은 as-of 기준으로 재현합니다. 판단 시점 이후에 알려진 정보나 수정된 지표를 과거 판단에 섞지 않습니다.
- 가이드 발행 시 출처, 기준일, 규칙·유니버스 버전, 승인 시각과 필수 위험 필드를 함께 고정합니다. 발행 후 스냅샷은 변경하지 않습니다.
- MVP는 개인 비상업·비공개 내부 사용으로만 자동화와 내부 화면을 구성합니다. 공개 표시, 제3자 공유, 재배포 또는 상업적 이용은 API 존재 여부와 별도로 확인해야 하며, 별도 권한 근거와 PRD 변경 전에는 구현하지 않습니다.

## 기능 추적

현재 대표 기능은 ETF 제품 대시보드와 도메인 계약 흐름입니다.

```text
GET /
  → src/app/page.tsx
  → src/components/product-dashboard.tsx
  → Data Status / Scanner / Weekly Guide / Paper Portfolio

승인 입력 또는 fixture
  → normalize / collection / pipeline
  → strategy / backtest / scanner
  → research / guide / risk
  → gate-validation / forward-validation
```

이 흐름의 코드와 결정론적 테스트는 구현됐습니다. 다만 승인된 실데이터 입력, 지속 수집과 운영 저장소는 DG2~DG4가 `Go`가 될 때까지 제품 운영으로 간주하지 않습니다.

## 테스트 전략

`test/`의 Node 테스트가 Task 005~014, Gate 상태와 Forward Validation 계약을 검증합니다. `npm run status:check`는 실행 입력과 권위 문서의 상태 드리프트를 차단하며, `npm run check-all`은 상태·타입·lint·포맷을 함께 검사합니다.

현재 테스트는 다음 계약을 검증합니다.

- 입력 검증 테스트: 승인된 데이터와 CSV 대체 입력이 기준일·출처·결측·중복 상태를 일관되게 보존하는지 확인합니다.
- 도메인 규칙 테스트: G0~G4 적용 순서, 전략별 점수 분리, Top 3 교체와 포트폴리오 위험 판정을 확인합니다.
- 재현성 테스트: 동일 입력과 규칙·유니버스 버전에서 동일 결과가 나오는지, 이후 정보가 섞이지 않는지 확인합니다.
- 가이드 발행 테스트: 필수 위험 필드 누락 시 발행이 차단되고, 발행 후 스냅샷이 불변인지 확인합니다.
- 화면 통합 테스트: 네 제품 영역에서 기준일, 데이터 상태, 전략 근거, ETF 분석과 가상 포지션 결과가 동일한 스냅샷을 참조하는지 확인합니다.

## 구현 준비도와 다음 순서

Task 005~014의 구현 단계와 가격 창 검증·DG2 증거 준비도 패키지는 완료됐습니다. 현재 익명 공개 경로로는 분배금과 5×2 전략 시점 입력을 완결할 수 없으므로, 추가 수집기 연동이나 반복 조회는 다음 순서에 포함하지 않습니다.

1. `docs/plan/gates/DG2-data-source-gap-report.md`의 재개 조건을 충족하는 공식 원문 또는 승인된 접근권한이 제공될 때만 `DG2-evidence-input.template.json`에 증거를 연결하고 검증기를 실행합니다.
2. DG2가 `Go`가 된 뒤에만 `DG3-evidence-input.template.json`에 3~5년 데이터, 하락장, 비용, 생존편향과 민감도 검토를 연결합니다.
3. `npm run status:check`로 ROADMAP과 Gate 문서가 계산 상태와 일치하는지 확인합니다.
4. DG2와 DG3가 `Go`가 된 뒤 DG4 운영 부담과 Owner/Approver 결정을 기록합니다.
5. DG4가 `Go`가 된 경우에만 Forward Validation 운영을 시작합니다.

## 권장 읽기 순서

1. `docs/PRD.md` — MVP 범위, 데이터 원칙, G0~G4, W1/W8 판정 기준.
2. `package.json` — 현재 실행·검사·의존성 기준선.
3. `src/app/layout.tsx` — 전역 렌더링과 Provider 경계.
4. `src/app/page.tsx` — 현재 홈 화면 조립 패턴.
5. `src/app/login/page.tsx`, `src/app/signup/page.tsx` — 현재 인증 UI의 미구현 경계.
6. `src/lib/env.ts` — 환경 설정과 서버 전용 값 경계를 확장할 위치.
7. `src/components/layout/header.tsx`, `src/components/navigation/main-nav.tsx` — 향후 내부 화면 정보 구조를 연결할 현재 위치.
