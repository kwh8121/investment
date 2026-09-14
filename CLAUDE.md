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
