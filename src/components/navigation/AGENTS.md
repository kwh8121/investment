<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# navigation

## Purpose
사이트 네비게이션 컴포넌트. 데스크탑 가로 메뉴(`MainNav`)와 모바일 시트 메뉴(`MobileNav`) 두 가지 형태 제공. 현재 활성 경로는 `usePathname`으로 강조.

## Key Files

| File | Description |
|------|-------------|
| `main-nav.tsx` | 데스크탑용 가로 네비. `'use client'`, `usePathname`으로 현재 라우트 강조. `navItems` 배열로 메뉴 구성 (현재 '홈' 1개) |
| `mobile-nav.tsx` | 모바일 시트 내부의 세로 네비. `onClose` prop으로 시트 닫기 콜백 수신. `navItems`는 '홈', '로그인' 2개 |

## For AI Agents

### Working In This Directory
- 메뉴 항목 추가 시 두 파일의 `navItems` 배열을 **모두** 갱신해야 함 (현재 분리됨 - 향후 공통 상수로 추출 권장)
- `usePathname` 사용 때문에 두 파일 모두 클라이언트 컴포넌트
- 활성 강조 스타일 패턴: 데스크탑은 `text-foreground` vs `text-foreground/60`, 모바일은 `bg-accent text-accent-foreground` vs 기본

### Testing Requirements
- 라우트 이동 시 활성 강조 표시 확인
- 모바일에서 메뉴 클릭 후 시트가 자동 닫히는지 확인

### Common Patterns
- 호버: `hover:text-primary` (desktop), `hover:bg-accent` (mobile)
- 클래스 조건부 결합은 `cn()` 사용

## Dependencies

### Internal
- `@/lib/utils` (cn)
- `@/components/ui/separator` (mobile-nav만)

### External
- `next/link`, `next/navigation` (`usePathname`)

<!-- MANUAL: -->
