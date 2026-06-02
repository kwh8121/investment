<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# src

## Purpose
애플리케이션 소스 코드의 루트. Next.js App Router 페이지(`app/`), 재사용 가능한 React 컴포넌트(`components/`), 공통 유틸리티/환경 변수 검증(`lib/`)으로 구성. `tsconfig.json`의 `@/*` path alias가 이 디렉터리를 가리킴(`@/components/...`, `@/lib/...`).

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router 라우트, 레이아웃, 페이지, 글로벌 스타일 (see `app/AGENTS.md`) |
| `components/` | 재사용 가능한 React 컴포넌트 - 도메인별 분리 (see `components/AGENTS.md`) |
| `lib/` | 공통 유틸리티 함수 및 환경 변수 검증 (see `lib/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 파일은 `@/*` import alias를 사용 (예: `import { cn } from '@/lib/utils'`)
- 라우트는 `app/`, 재사용 컴포넌트는 `components/`, 순수 함수는 `lib/`로 명확히 분리
- 페이지 전용 컴포넌트도 한 곳에서만 쓰인다면 `components/`에 두지 말고 라우트와 같이 두는 것을 우선 고려

### Testing Requirements
- 변경 후 루트에서 `npm run check-all` 실행
- UI 변경 시 `npm run dev`로 브라우저 확인

### Common Patterns
- Server Component 기본, 인터랙션 필요 시 파일 최상단에 `'use client'`
- `cn(...)` 헬퍼로 Tailwind 클래스 결합
- 환경 변수 접근은 `lib/env.ts`의 `env` 객체 경유 (직접 `process.env` 접근 지양)

## Dependencies

### Internal
- `tsconfig.json` paths: `@/*` → `./src/*`

### External
- Next.js App Router 규약 (`layout.tsx`, `page.tsx`, route segments)

<!-- MANUAL: -->
