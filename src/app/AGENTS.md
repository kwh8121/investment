<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# app

## Purpose
Next.js 15 App Router 라우트 루트. 파일 시스템 기반 라우팅 규약을 따라 `page.tsx`가 각 경로의 페이지를, `layout.tsx`가 공통 레이아웃을, `globals.css`가 전역 스타일을 정의. 한국어(`lang="ko"`)를 기본 언어로 설정.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 루트 레이아웃 - 네트워크 독립 시스템 폰트 토큰, `ThemeProvider`(next-themes) 래핑, `<Toaster />`(sonner) 마운트, 메타데이터 설정 |
| `page.tsx` | 홈(`/`) 페이지 - `Header` + `HeroSection` + `FeaturesSection` + `CTASection` + `Footer` 구성 |
| `globals.css` | TailwindCSS v4 임포트, `tw-animate-css`, oklch 기반 라이트/다크 테마 CSS 변수 (shadcn/ui new-york), `@layer base` 기본 스타일 |
| `favicon.ico` | 브라우저 탭 아이콘 (App Router 규약에 따라 이 위치) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `login/` | `/login` 라우트 (see `login/AGENTS.md`) |
| `signup/` | `/signup` 라우트 (see `signup/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 라우트 추가 시 디렉터리를 만들고 `page.tsx` 작성 (예: `app/dashboard/page.tsx` → `/dashboard`)
- 라우트별 메타데이터는 페이지 파일에서 `export const metadata: Metadata = {...}` 형식
- 페이지 컴포넌트는 기본적으로 Server Component (인터랙티브 폼은 `'use client'` 클라이언트 컴포넌트로 분리하여 `components/`에 두는 패턴)
- 전역 CSS 변수 수정 시 `:root` (라이트)와 `.dark` (다크) 모두 일관되게 갱신
- `html lang` 속성은 한국어 사이트이므로 `"ko"` 유지

### Testing Requirements
- `npm run dev` 후 라우트 직접 방문하여 SSR/렌더링 확인
- 다크 모드 토글 동작 확인

### Common Patterns
- 페이지: `bg-background flex min-h-screen ... ` 형태의 풀스크린 컨테이너
- 메타데이터 한국어 작성
- 폰트는 `globals.css`의 네트워크 독립 시스템 sans/mono stack을 사용한다. 외부 폰트 다운로드를 빌드 필수 조건으로 만들지 않는다.

## Dependencies

### Internal
- `@/components/providers/theme-provider` - 다크 모드
- `@/components/ui/sonner` - Toast
- `@/components/layout/*`, `@/components/sections/*` - 홈 페이지 구성

### External
- `next-themes` - 테마 시스템

<!-- MANUAL: -->
