# Architecture

이 저장소는 한국어 Next.js App Router 스타터입니다. 현재는 정적 소개 화면과 미완성 로그인·회원가입 UI를 제공하며, 한국 수출입 데이터를 기반으로 투자 인사이트를 제공하는 제품의 데이터·도메인·운영 계층은 아직 구현되어 있지 않습니다.

## Bird's Eye View

현재 애플리케이션은 브라우저 요청을 Next.js 페이지로 렌더링하고, 공통 레이아웃과 shadcn/ui 기반 컴포넌트를 조합해 응답합니다. 영속 데이터, 외부 API 호출, Route Handler, 인증 백엔드, 배치 작업은 없습니다.

```text
Browser request → App Router page → layout/section component composition → HTML/CSS response
```

목표 제품에서는 아래처럼 두 흐름을 분리해야 합니다.

```text
관세청 원천 XML → 수집 작업 → 검증·정규화 DB → 집계/지표 → Server Component·API 응답 → 대시보드
사용자 요청 ────────────────────────────────────────────────────────────────────────────────┘
```

## Entry Points

- `package.json:5` — `npm run dev`, `npm run build`, `npm run start`가 Next.js 프로세스를 시작합니다.
- `src/app/layout.tsx:23` — 모든 App Router 경로의 루트 레이아웃이며 폰트, 테마 Provider, 토스트를 조립합니다.
- `src/app/page.tsx:7` — `/`의 논리적 진입점입니다. 현재는 정적 랜딩 페이지입니다.
- `src/app/login/page.tsx:10`, `src/app/signup/page.tsx:3` — 인증 화면의 논리적 진입점입니다. 실제 인증 API는 연결되어 있지 않습니다.

## Code Map

### `src/app/`

**API Boundary:** Next.js 파일 시스템 라우팅 경계입니다. `page.tsx`와 `layout.tsx`의 형태는 프레임워크 계약에 의해 정해집니다.

현재 `/`, `/login`, `/signup`만 존재하며, `src/app/page.tsx:7`은 정적 섹션을 조립합니다. `src/app/layout.tsx:17`의 메타데이터와 `:29`의 `lang="ko"`가 전역 문서 계약입니다.

**Architecture Invariant:** 페이지는 기본적으로 Server Component로 유지하고, 브라우저 상태가 필요한 부분만 클라이언트 컴포넌트로 분리합니다. 데이터 조회를 서버에서 유지해 비밀값과 데이터 접근 권한이 브라우저 번들에 섞이지 않게 합니다.

### `src/components/`

내부 전용 프레젠테이션 계층입니다. `layout/`은 페이지 셸, `sections/`는 랜딩 섹션, `navigation/`은 메뉴, `ui/`는 shadcn/ui 프리미티브, `providers/`는 외부 Provider의 클라이언트 경계입니다.

`src/components/layout/header.tsx:14`와 `src/components/navigation/main-nav.tsx:16`은 브라우저 상태를 사용하므로 클라이언트 컴포넌트입니다. 반면 `src/components/sections/hero.tsx:4`는 정적 Server Component입니다.

**Architecture Invariant:** `components/ui/`는 도메인 규칙이나 데이터 접근을 포함하지 않습니다. 이 계층은 재사용 가능한 표시 규칙만 제공해야 대시보드·차트·테이블이 동일한 도메인 모델을 독립적으로 소비할 수 있습니다.

### `src/lib/`

내부 전용 공통 유틸리티 계층입니다. `src/lib/utils.ts`는 스타일 클래스 결합을, `src/lib/env.ts:3`은 Zod로 환경 변수를 검증합니다.

**API Boundary:** `src/lib/env.ts:11`은 배포 환경과 애플리케이션 사이의 구성 경계입니다. 현재 공개 앱 URL만 모델링하며, 수집 API 키·데이터베이스 URL·작업 인증 토큰은 아직 이 경계에 정의되지 않았습니다.

**Architecture Invariant:** 서버 비밀값은 `NEXT_PUBLIC_` 접두사를 사용하지 않고 `env`를 통해서만 읽습니다. 이 규칙이 깨지면 수집 API 키 또는 데이터베이스 자격 증명이 클라이언트에 노출될 수 있습니다.

### `docs/`

개발 가이드와 외부 API 메모를 보관합니다. `docs/gw-api.md`는 관세청 Newtrade XML 엔드포인트를 기록하지만, 실제 수집 코드는 없습니다. 인증키는 문서나 Git에 보관하지 않고 배포 환경의 비밀 변수로 관리해야 합니다.

### `package.json`

빌드·정적 검사 명령과 런타임 의존성을 정의합니다. 현재 데이터베이스 ORM, 마이그레이션, 작업 큐/스케줄러, 차트 라이브러리, 테스트 러너는 의존성에 없습니다.

## Data Flow

### Current flow

브라우저의 `GET /` 요청은 `src/app/page.tsx:7`로 들어와 `Header`, `HeroSection`, `FeaturesSection`, `CTASection`, `Footer`를 조립하고 HTML/CSS를 반환합니다. 로그인 화면은 `src/app/login/page.tsx:10`에서 `LoginForm`을 렌더링하지만, `src/components/login-form.tsx:50`은 검증 후 `console.log`만 호출합니다. 외부 입력은 데이터 모델로 변환되거나 저장되지 않습니다.

### Required product flow

1. 스케줄러가 보호된 수집 엔드포인트 또는 별도 worker를 호출합니다.
2. 수집 어댑터가 관세청 XML을 원본 스냅샷으로 보존하고 XML 스키마를 파싱합니다.
3. 검증 계층이 기간, 수출입 구분, HS 코드, 통화·금액 단위를 정규화한 `TradeObservation` 도메인 모델로 변환합니다.
4. 저장 계층이 원본 응답 식별자와 기준월을 고유 키로 사용해 중복 수집을 멱등적으로 upsert합니다.
5. 집계 작업이 월별 증감률, 이동평균, 품목·국가별 비중 같은 파생 지표를 별도 테이블 또는 materialized view에 기록합니다.
6. Server Component와 공개 읽기 API가 검증된 집계만 조회해 대시보드·추이 차트·인사이트를 렌더링합니다.

원천 XML과 수집 실행 기록은 ground state이며, 정규화 관측치·집계·인사이트는 재생성 가능한 derived state입니다. 현재는 캐시·색인·증분 계산 계층이 없습니다. 목표 구조에서는 기준월 또는 데이터 버전으로 파생 지표를 무효화해야 하며, 그렇지 않으면 수정 수집 후 추이가 오래된 값으로 남습니다.

## API Boundaries

- **App Router UI:** `src/app/**/page.tsx`가 브라우저 요청과 렌더링 사이를 연결합니다. UI props는 내부 계약이므로 안정적인 외부 API로 취급하지 않습니다.
- **환경 구성:** `src/lib/env.ts:3`이 배포 환경과 서버 코드 사이의 계약입니다. 서버 전용 값과 공개 URL을 엄격히 구분해야 합니다.
- **관세청 Newtrade:** `docs/gw-api.md:2`에 기록된 외부 XML 공급자 경계입니다. 공급자 형식·제한·데이터 정정은 외부 사유로 바뀌므로 어댑터 하나에 격리해야 합니다.
- **권장 수집 경계:** 새 `app/api/internal/ingest/route.ts` 또는 별도 worker가 스케줄러와 수집 도메인을 분리해야 합니다. 호출자는 작업 토큰으로 인증하고, 일반 사용자 세션으로 이 경계를 열지 않습니다.
- **권장 읽기 경계:** 새 `app/api/trends/route.ts`는 프론트엔드가 필요로 하는 안정된 DTO만 반환합니다. 데이터베이스 행과 ORM 타입을 직접 노출하지 않습니다.

## Invariants

- **Architecture Invariant:** 페이지는 기본적으로 Server Component로 유지하고, 브라우저 상태가 필요한 부분만 클라이언트 컴포넌트로 분리합니다. 비밀값과 데이터 접근 권한을 서버에 남기기 위해서입니다.
- **Architecture Invariant:** `components/ui/`는 도메인 규칙이나 데이터 접근을 포함하지 않습니다. 표시 계층을 유지해야 지표 계산 변경이 UI 프리미티브를 흔들지 않습니다.
- **Architecture Invariant:** 서버 비밀값은 `NEXT_PUBLIC_` 접두사를 사용하지 않고 `env`를 통해서만 읽습니다. 비밀값이 브라우저 번들에 노출되는 것을 방지합니다.
- **Architecture Invariant:** 동일한 원천 데이터와 기준월을 다시 수집해도 저장 결과는 하나여야 합니다. 재시도 가능한 정기 작업에서 중복 관측치가 추이와 투자 판단을 왜곡하지 않게 합니다.
- **Architecture Invariant:** 원천 응답, 정규화 관측치, 파생 지표의 데이터 버전을 연결합니다. 공급자 정정이나 파서 수정 후 파생 지표를 재계산할 수 있게 합니다.

## Feature Trace

현재 대표 기능은 정적 홈 화면 렌더링입니다.

```text
GET /
  → src/app/page.tsx:7             Home()
  → src/components/layout/header.tsx:14  Header()
  → src/components/sections/hero.tsx:4   HeroSection()
  → src/components/sections/features.tsx FeaturesSection()
  → src/components/sections/cta.tsx      CTASection()
  → src/components/layout/footer.tsx     Footer()
  → HTML 응답
```

이 흐름은 현재의 일반적인 렌더링 패턴을 잘 보여 주지만, 투자 데이터 입력·검증·저장·계산·조회는 전혀 거치지 않습니다.

## Testing Strategy

현재 별도 테스트 프레임워크나 테스트 파일은 없습니다. `package.json:13`의 TypeScript 검사, `:9`의 ESLint, `:11`의 Prettier, `:7`의 프로덕션 빌드가 정적 품질 경계를 보호합니다.

목표 제품에서는 다음 경계를 테스트해야 합니다.

- XML 파서 단위 테스트: 원천 공급자 형식과 정규화 도메인 모델의 경계를 보호합니다.
- 저장소 통합 테스트: 멱등 upsert와 기준월 정정 처리를 보호합니다.
- 수집 Route Handler 통합 테스트: 스케줄러 인증과 실패 재시도를 보호합니다.
- 추이 API 계약 테스트: 프론트엔드와 읽기 DTO의 호환성을 보호합니다.
- 대시보드 E2E 테스트: 수집된 데이터가 사용자에게 올바른 기간·단위·상태로 보이는 전체 흐름을 보호합니다.

## Refactoring Risk

- `src/components/ui/`는 shadcn/ui 생성 코드이므로 도메인 로직을 추가하지 않아야 합니다.
- `src/components/login-form.tsx:50`의 `console.log` 기반 제출은 인증 구현이 아닙니다. 실제 사용자 계정 기능으로 오인하면 안 됩니다.
- `src/components/navigation/main-nav.tsx:12`과 모바일 메뉴는 별도의 메뉴 배열을 가질 수 있으므로 신규 대시보드 경로를 추가할 때 동기화 누락 위험이 있습니다.
- `src/lib/env.ts:3`은 현재 서비스 비밀값을 모델링하지 않으므로 수집 기능을 넣기 전에 확장해야 합니다.
- `docs/gw-api.md`에 평문 인증키를 저장하는 방식은 금지해야 합니다. 이미 노출된 키는 공급자 콘솔에서 회전해야 합니다.

## Readiness Assessment and Target Architecture

UI 기반은 적합하지만, 현재 구조만으로는 신뢰 가능한 투자 인사이트 서비스를 운영할 수 없습니다. Next.js를 BFF와 SEO 친화적 대시보드로 사용하고, 데이터 파이프라인을 다음 네 계층으로 추가하는 구성이 적합합니다.

1. **Ingestion:** 관세청 XML 어댑터, 작업 인증, 지수 백오프 재시도, 실행 이력.
2. **Data platform:** PostgreSQL, 마이그레이션, 원본 스냅샷·정규화 관측치·파생 지표의 분리, 기준월 단위 멱등 키.
3. **Domain and analytics:** `trade-observation`, `trend-metric`, `insight`를 UI와 독립된 서버 도메인으로 두고, 집계·해석 규칙을 버전 관리.
4. **Delivery:** Server Component 기반 대시보드, 읽기 전용 trend API, 데이터 최신 시점·결측·정정 상태를 명시하는 UX.

권장 시작 순서는 UI 대시보드가 아니라 비밀 관리와 원천 수집 계약, 데이터 스키마, 멱등 수집, 집계 검증입니다. 수집 주기는 공급자 갱신 시점과 데이터 지연을 확인한 뒤 정하되, 일정 기반 실행은 외부 스케줄러 또는 관리형 작업 플랫폼에서 트리거하고 작업 본문은 재시도 가능하게 설계합니다.

## Recommended Next Reading Order

1. `package.json` — 현재 실행·검사·의존성 기준선.
2. `src/app/layout.tsx` — 전역 렌더링과 Provider 경계.
3. `src/app/page.tsx` — 현재 페이지 조립 패턴.
4. `src/lib/env.ts` — 환경 설정과 비밀값 경계를 확장할 위치.
5. `docs/gw-api.md` — 외부 관세청 API의 시작점; 인증키는 환경 변수로 이동해야 함.
6. `src/components/layout/header.tsx` — 클라이언트 상호작용 경계의 현재 패턴.
7. `src/components/navigation/main-nav.tsx` — 대시보드 정보 구조를 연결할 현재 메뉴 위치.
8. 새 `src/server/trade/`와 `src/app/api/internal/ingest/route.ts` — 구현 시 도입할 도메인·수집 경계.
