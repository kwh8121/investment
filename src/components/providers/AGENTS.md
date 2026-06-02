<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# providers

## Purpose
클라이언트 컨텍스트 프로바이더 래퍼 모음. 외부 라이브러리의 Provider를 `'use client'` 경계로 감싸 Server Component에서도 사용할 수 있게 함. 현재는 테마 프로바이더 1개.

## Key Files

| File | Description |
|------|-------------|
| `theme-provider.tsx` | `next-themes`의 `ThemeProvider`를 그대로 re-export하는 클라이언트 래퍼. props 타입은 `React.ComponentProps<typeof NextThemesProvider>`로 추론. `app/layout.tsx`에서 사용 |

## For AI Agents

### Working In This Directory
- 새 Provider 추가 시 동일한 패턴(`'use client'` + 래퍼 컴포넌트)으로 작성
- Provider는 가능한 한 얇게 유지 - 비즈니스 로직은 별도 파일로 분리
- `app/layout.tsx`에서 마운트 순서가 중요할 수 있으므로 의존성 있는 Provider는 안쪽에 중첩

### Testing Requirements
- 다크 모드 토글 시 SSR/CSR hydration 경고가 없는지 확인 (`html`에 `suppressHydrationWarning` 적용됨)

### Common Patterns
- props pass-through: `<NextThemesProvider {...props}>{children}</NextThemesProvider>`

## Dependencies

### External
- `next-themes` - 테마 상태 관리

<!-- MANUAL: -->
