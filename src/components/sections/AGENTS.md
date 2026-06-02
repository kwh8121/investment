<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# sections

## Purpose
홈 페이지(`app/page.tsx`)를 구성하는 마케팅 섹션 단위 컴포넌트. 모두 Server Component이며 정적 콘텐츠 렌더링.

## Key Files

| File | Description |
|------|-------------|
| `hero.tsx` | 히어로 영역 - Badge, 큰 타이틀, 설명문, 4개 스택 카드(Next.js 15 / TypeScript / TailwindCSS / ShadcnUI) |
| `features.tsx` | 9개 기능 카드 그리드 - lucide 아이콘(`Zap`, `Shield`, `Palette` 등) + 타이틀 + 설명. 반응형 1/2/3열 |
| `cta.tsx` | 콜투액션 영역 - "지금 바로 시작하세요" 제목, 무료 시작/문서 보기 버튼, 설치 명령어 코드 스니펫 |

## For AI Agents

### Working In This Directory
- 모두 정적 콘텐츠이므로 Server Component 유지 (클라이언트 훅 사용 금지)
- 새 섹션 추가 시 동일한 패턴: `<section className="py-20">` + `<Container>` + 내부 콘텐츠
- 콘텐츠는 모두 한국어 - 다국어화 시 별도 i18n 셋업 필요
- 기능 카드는 컴포넌트 상단 `features` 배열을 수정 (인라인 JSX 반복 대신 map)

### Testing Requirements
- 반응형 그리드: 모바일/태블릿/데스크탑에서 카드 레이아웃 확인
- 다크 모드에서 `bg-muted/50`, `bg-background` 대비 확인

### Common Patterns
- 모든 섹션이 `<Container>`로 가로폭 일관성 유지
- 제목: `text-3xl font-bold`, 설명: `text-muted-foreground text-lg`
- 카드는 `bg-background border-0 shadow-none` (features) - flat 디자인

## Dependencies

### Internal
- `@/components/layout/container`
- `@/components/ui/{button,card,badge}`

### External
- `lucide-react` - 기능 카드 아이콘

<!-- MANUAL: -->
