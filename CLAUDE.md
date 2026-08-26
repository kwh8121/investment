# 🤖 Claude Code 개발 지침

**claude-nextjs-starters**는 Next.js 15.5.3 + React 19 기반 모던 웹 애플리케이션 스타터 템플릿입니다.

## 🛠️ 핵심 기술 스택

- **Framework**: Next.js 15.5.3 (App Router + Turbopack)
- **Runtime**: React 19.1.0 + TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Forms**: React Hook Form + Zod + Server Actions
- **UI Components**: Radix UI + Lucide Icons
- **Development**: ESLint + Prettier + Husky + lint-staged

## 📚 개발 가이드

- **🗺️ 개발 로드맵**: `docs/ROADMAP.md`
- **📋 프로젝트 요구사항**: `docs/PRD.md`
- **📁 프로젝트 구조**: `docs/guides/project-structure.md`
- **🎨 스타일링 가이드**: `docs/guides/styling-guide.md`
- **🧩 컴포넌트 패턴**: `docs/guides/component-patterns.md`
- **⚡ Next.js 15.5.3 전문 가이드**: `docs/guides/nextjs-15.md`
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

`docs/architecture.md`에 코드베이스 멘탈 모델이 정리되어 있습니다 — 진입점, Code Map, 데이터 흐름, API 경계, Architecture Invariant, 권장 읽기 순서. 비자명한 변경 전에 먼저 읽고, 경계·invariant·feature trace를 바꿨다면 같이 갱신하세요.

## 문서 정책

이 프로젝트는 "One Fact, One Home" 문서 정책을 따릅니다. 사실 유형별 정본(canonical) 문서 위치는 `AGENTS.md`의 "문서 정책: One Fact, One Home" 절을 참조하세요.
