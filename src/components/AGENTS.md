<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# components

## Purpose
재사용 가능한 React 컴포넌트 모음. 도메인별로 디렉터리를 나누어 정리: `ui/`(shadcn primitives), `layout/`(페이지 골격), `navigation/`(메뉴), `providers/`(컨텍스트 래퍼), `sections/`(홈 페이지 섹션). 루트 직속 파일은 페이지 단위 폼/위젯.

## Key Files

| File | Description |
|------|-------------|
| `login-form.tsx` | 클라이언트 로그인 폼 - useState 기반 자체 검증(이메일 형식, 비밀번호 8자+), 비밀번호 표시 토글, '로그인 상태 유지' 체크박스. 현재 제출 핸들러는 `console.log` placeholder |
| `signup-form.tsx` | 회원가입 폼 - 정적 마크업 (이름/이메일/비밀번호/확인/약관 동의). 검증/제출 로직 미구현 |
| `theme-toggle.tsx` | `next-themes`의 `useTheme` 훅을 사용한 라이트/다크/시스템 전환 드롭다운 (해/달 아이콘 회전 애니메이션) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | shadcn/ui new-york 스타일 프리미티브 (Button, Card, Dialog, Form 등). see `ui/AGENTS.md` |
| `layout/` | Header, Footer, Container 레이아웃 셸. see `layout/AGENTS.md` |
| `navigation/` | MainNav(데스크탑), MobileNav(모바일 시트). see `navigation/AGENTS.md` |
| `providers/` | ThemeProvider 등 클라이언트 컨텍스트 래퍼. see `providers/AGENTS.md` |
| `sections/` | 홈 페이지의 Hero/Features/CTA 섹션. see `sections/AGENTS.md` |

## For AI Agents

### Working In This Directory
- shadcn/ui 프리미티브가 필요하면 수동 작성하지 말고 `npx shadcn@latest add <name>`로 추가 → `ui/`에 생성됨
- 페이지 종속성이 큰 폼/위젯은 이 디렉터리 루트에 평탄하게 두는 패턴 (`login-form.tsx`, `signup-form.tsx`)
- 인터랙션 있으면 `'use client'`, 정적 표시는 Server Component
- 컴포넌트 명명은 PascalCase, 파일은 케밥-케이스(`login-form.tsx`)
- props 타입은 컴포넌트 위에 `interface XxxProps`로 선언

### Testing Requirements
- 브라우저에서 인터랙션 직접 확인 (다크/라이트, 모바일 뷰포트, 폼 검증 메시지 등)

### Common Patterns
- 클래스 결합은 `@/lib/utils`의 `cn(...)`
- 폼은 향후 React Hook Form + Zod 마이그레이션 권장 (가이드 `docs/guides/forms-react-hook-form.md` 참조 - 현재 `login-form.tsx`는 useState 기반)
- 한국어 라벨/플레이스홀더 사용

## Dependencies

### Internal
- `@/lib/utils` - `cn()`
- `@/components/ui/*` - 프리미티브

### External
- `lucide-react` - 아이콘
- `next-themes`, `usehooks-ts` (Header에서 `useMediaQuery` 사용 등)

<!-- MANUAL: -->
