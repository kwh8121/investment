<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# ui

## Purpose
shadcn/ui (new-york style) 프리미티브 컴포넌트 모음. CLI(`npx shadcn@latest add <name>`)로 추가되며 프로젝트 코드로 복사되어 직접 수정 가능. Radix UI primitives + Tailwind + `class-variance-authority` 기반.

## Key Files

| File | Description |
|------|-------------|
| `alert.tsx` | 알림 박스 (default/destructive variant) |
| `avatar.tsx` | 프로필 이미지 + fallback (Radix Avatar) |
| `badge.tsx` | 인라인 라벨 (default/secondary/destructive/outline) |
| `button.tsx` | 버튼 (default/destructive/outline/secondary/ghost/link variants, sm/default/lg/icon sizes). `Slot`으로 `asChild` 지원 |
| `card.tsx` | 카드 셸 (Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter) |
| `checkbox.tsx` | 체크박스 (Radix Checkbox) |
| `dialog.tsx` | 모달 다이얼로그 (Radix Dialog) |
| `dropdown-menu.tsx` | 드롭다운 메뉴 (Radix DropdownMenu) - 테마 토글에서 사용 |
| `form.tsx` | React Hook Form 통합 래퍼 (Form/FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage) |
| `input.tsx` | 텍스트 입력 |
| `label.tsx` | 폼 라벨 (Radix Label) |
| `navigation-menu.tsx` | 가로 네비게이션 메뉴 (Radix NavigationMenu) |
| `progress.tsx` | 진행률 바 (Radix Progress) |
| `select.tsx` | 셀렉트 박스 (Radix Select) |
| `separator.tsx` | 시각적 구분선 (Radix Separator) - 모바일 메뉴에서 사용 |
| `sheet.tsx` | 사이드 시트/드로어 (Radix Dialog 기반) - 모바일 메뉴에서 사용 |
| `skeleton.tsx` | 로딩 스켈레톤 |
| `sonner.tsx` | Sonner Toaster 래퍼 (next-themes의 테마와 동기화) |

## For AI Agents

### Working In This Directory
- **수동으로 새 컴포넌트를 작성하지 말 것** - 반드시 `npx shadcn@latest add <name>` 사용
- 기존 컴포넌트는 자유롭게 수정 가능 (프로젝트 코드로 복사됨) - 다만 shadcn 업데이트 시 충돌 가능성 인지
- 새 variant 추가 시 `class-variance-authority`의 `cva({ variants: {...} })` 확장
- `components.json`의 alias(`@/components/ui`, `@/lib/utils`)를 변경하면 CLI 동작 영향

### Testing Requirements
- shadcn CLI 추가 후 `npm run check-all`로 타입/린트 통과 확인
- 새 컴포넌트의 라이트/다크 모드 모두 확인

### Common Patterns
- 모든 컴포넌트가 `cn()`으로 className 결합 (`@/lib/utils`)
- `forwardRef` + Radix `Slot`/`asChild` 패턴
- variant API는 `cva`로 정의 → props로 받아 className에 적용
- 다크 모드는 `globals.css`의 CSS 변수로 자동 대응

## Dependencies

### Internal
- `@/lib/utils` - `cn()` 헬퍼

### External
- `@radix-ui/react-*` - 접근성/동작 primitives
- `class-variance-authority` - variant 시스템
- `tailwind-merge` - 클래스 충돌 해소 (via cn)
- `lucide-react` - 일부 컴포넌트의 기본 아이콘(체크, X 등)
- `sonner`, `next-themes` (sonner.tsx)

<!-- MANUAL: -->
