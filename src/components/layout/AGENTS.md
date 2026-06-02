<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# layout

## Purpose
페이지의 시각적 골격(헤더/푸터/컨테이너)을 담당하는 컴포넌트. 라우트 페이지가 조립할 때 사용하는 상위 레이아웃 셸.

## Key Files

| File | Description |
|------|-------------|
| `container.tsx` | 반응형 가로폭 컨테이너 (`sm`/`md`/`lg`/`xl`/`full` 사이즈, `mx-auto`, 반응형 padding). 기본 `size="lg"` (max-w-7xl) |
| `header.tsx` | 클라이언트 컴포넌트. sticky top 헤더 - 로고 + 데스크탑 `MainNav` + 로그인 버튼 + `ThemeToggle` + 모바일 햄버거(`Sheet`+`MobileNav`). `usehooks-ts`의 `useMediaQuery('(max-width: 768px)')`로 분기 |
| `footer.tsx` | 정적 푸터. `border-t`와 저작권 텍스트만 표시. Server Component |

## For AI Agents

### Working In This Directory
- `Container`는 가로폭 일관성의 기본 단위 - 새 섹션 만들 때 직접 `max-w-*` 작성 대신 `<Container>`로 감싸기
- `Header`는 `useMediaQuery`로 모바일/데스크탑 분기 - SSR 시 첫 렌더링은 false 가능성 있음, hydration 후 정확 (필요 시 `useIsMounted` 패턴 추가 검토)
- 푸터의 연도(`© 2024`)는 하드코딩 - 동적으로 바꾸려면 `new Date().getFullYear()` 활용

### Testing Requirements
- 모바일 뷰포트(<768px)와 데스크탑 모두에서 헤더 레이아웃 확인
- 햄버거 시트 열기/닫기 동작 확인

### Common Patterns
- 헤더의 backdrop blur: `bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur`
- `Container` 안에 `flex h-16 items-center justify-between` 패턴

## Dependencies

### Internal
- `@/components/navigation/main-nav`, `@/components/navigation/mobile-nav`
- `@/components/theme-toggle`
- `@/components/ui/{button,sheet,separator}`
- `@/lib/utils` (cn)

### External
- `next/link`
- `lucide-react` (Menu 아이콘)
- `usehooks-ts` (useMediaQuery)

<!-- MANUAL: -->
