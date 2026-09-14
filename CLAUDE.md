# ETF Price Signal MVP 개발 지침

현행 스펙은 `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`다. 이전 P0-01~10, 한·미 동시 범위, 환율·분배금·총수익·자동 전향평가 문서는 역사적 참조이므로 현재 구현·Gate 기준으로 사용하지 않는다.

## 🛠️ 핵심 기술 스택

- **Framework**: Next.js 16.3.4 (App Router + Turbopack)
- **Runtime**: React 19.2.8 + TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Forms**: React Hook Form + Zod + Server Actions
- **UI Components**: Radix UI + Lucide Icons
- **Development**: ESLint + Prettier + Husky + lint-staged

## 📚 개발 가이드

- **📋 프로젝트 요구사항**: `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`
- **⚖️ 헌법 및 사람 전용 결정**: `docs/constitution.md`
- **🗺️ 현행 실행 원장**: `docs/ROADMAP-v1.7.md`
- **🧭 프로그램 실행 계획**: `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`
- **🏗️ 현행 기술 경계**: `docs/architecture-v1.7.md`
- **🔒 Gate 증거 및 판정**: `docs/plan/gates/`
- **🔗 개발·리뷰·배포 하네스 / 정보 정본 정책**: `docs/guides/one-fact-one-home.md`
- **📁 프로젝트 구조**: `docs/guides/project-structure.md`
- **🎨 스타일링 가이드**: `docs/guides/styling-guide.md`
- **🧩 컴포넌트 패턴**: `docs/guides/component-patterns.md`
- **⚡ Next.js 가이드**: `docs/guides/nextjs-15.md` (프레임워크 일반 패턴 참고용)
- **📝 폼 처리 완전 가이드**: `docs/guides/forms-react-hook-form.md`

## ⚡ 자주 사용하는 명령어

```bash
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 모든 검사 통합 실행 (권장)

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```

## 새 세션의 작업 기준

새 세션은 구현이나 Gate 상태를 추정하지 말고 다음 정본을 먼저 확인한다.

1. `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`, `docs/constitution.md`, `docs/ROADMAP-v1.7.md`, `docs/architecture-v1.7.md`와 관련 `docs/plan/gates/` 기록을 읽는다.
2. `docs/ROADMAP-v1.7.md`의 현재 DG와 선행 Gate 사람 판정 여부를 확인한다. DG0~DG4는 순차 Gate이며, 사람 판정 전에는 다음 DG 의존 구현을 시작하거나 통과로 표기하지 않는다.
3. 코드 변경 전에는 `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`의 해당 DG 순서와 `docs/guides/one-fact-one-home.md`의 정본 배치를 따른다. 진행 중 개별 작업·담당·검토·상태 전이는 Linear에, Gate 판정은 `docs/plan/gates/`에 기록한다.
4. PRD §12.2의 해당 회귀 테스트를 먼저 RED로 만들고, 최소 구현 뒤 대상 테스트 GREEN → `npm run check-all` → `npm run build` 순서로 증거를 확보한다. 빌드가 실행 환경 제약으로 실패하면 원인과 검증 공백을 기록하며 GREEN으로 표현하지 않는다.

## 개발·배포 경계

- 도메인 구현은 `src/lib/etf/`에 둔다. UI는 App Router Server Component 기본의 읽기 모델이며, 투자 판단·외부 데이터 접근·선정 규칙을 UI에 두지 않는다.
- 수집·계산·발행·재현 경계와 사람 전용 승인(`CALC_APPROVED`, 정책 변경, `DRAFT → PUBLISHED`, Gate 판정 등)은 PRD와 헌법을 따른다. 기존 코드·테스트·이전 Gate 기록은 DG0 매핑 전 v1.7 충족 증거가 아니다.
- 배포는 GitHub 품질 검사와 Git 연동 Vercel Preview/Production을 사용하고, Supabase는 Postgres·Auth·private Storage 경계다. 실제 설정·롤백·비밀·Cron 도입 조건은 `docs/manual/vercel-supabase-deployment.md`가 정본이다. DG1 수집·날짜 상태 검증 전에는 Cron을 등록하지 않는다.

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```

💡 **상세 규칙은 위 개발 가이드 문서들을 참조하세요**

## 아키텍처 개요

`docs/architecture-v1.7.md`에 현행 코드베이스 경계가 정리되어 있습니다. 비자명한 변경 전에 먼저 읽고, 경계·불변 조건·구현 상태 해석이 바뀌면 함께 갱신하세요. `docs/architecture.md`는 이전 방향의 역사적 스냅샷입니다.

## 문서 정책

이 프로젝트는 "One Fact, One Home" 문서 정책을 따릅니다. 사실 유형별 정본(canonical) 문서 위치는 `AGENTS.md`의 "문서 정책: One Fact, One Home" 절을 참조하세요.
