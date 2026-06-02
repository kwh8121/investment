<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# stock-market (claude-nextjs-starters)

## Purpose
Next.js 15.5.3 기반 모던 웹 애플리케이션 스타터킷. App Router + Turbopack, React 19, TypeScript 5, TailwindCSS v4, shadcn/ui (new-york style)로 구축된 프로덕션 준비 템플릿. 한국어 UI를 기본으로 하며 로그인/회원가입, 다크 모드, 반응형 레이아웃 등의 기본 기능이 포함됨.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | npm 스크립트(dev/build/lint/typecheck/check-all)와 의존성 정의. Husky + lint-staged 설정 포함 |
| `tsconfig.json` | TypeScript strict 모드, `@/*` → `./src/*` path alias |
| `next.config.ts` | 보안 헤더(X-Frame-Options 등), `lucide-react` optimizePackageImports, webp/avif 이미지 포맷 |
| `components.json` | shadcn/ui 설정 (new-york style, neutral baseColor, lucide icons) |
| `eslint.config.mjs` | ESLint v9 flat config (`next/core-web-vitals`, `next/typescript`, prettier 통합) |
| `postcss.config.mjs` | `@tailwindcss/postcss` 플러그인 |
| `.prettierrc` / `.prettierignore` | Prettier 포맷터 설정 (prettier-plugin-tailwindcss 포함) |
| `CLAUDE.md` | Claude Code 개발 지침, 기술 스택, 가이드 문서 링크 |
| `README.md` | create-next-app 기본 README |
| `.mcp.json` | 프로젝트 단위 MCP 서버 설정 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | 애플리케이션 소스 코드 (App Router 페이지, 컴포넌트, 라이브러리). 자세한 내용은 `src/AGENTS.md` 참조 |
| `docs/` | 개발 가이드 문서. 자세한 내용은 `docs/AGENTS.md` 참조 |
| `public/` | 정적 자산(SVG 아이콘, favicon). 자세한 내용은 `public/AGENTS.md` 참조 |
| `.claude/` | Claude Code 에이전트/커맨드/훅 정의 (도구 설정, 직접 편집 지양) |
| `.husky/` | Git 훅 (pre-commit 등) |
| `.vscode/` | VS Code 워크스페이스 권장 설정 |
| `.omc/` | oh-my-claudecode 런타임 상태 |
| `.serena/` | Serena MCP 캐시/메모리 |

## For AI Agents

### Working In This Directory
- TypeScript strict 모드를 유지하고 path alias `@/*` 사용
- 새 shadcn/ui 컴포넌트는 `npx shadcn@latest add <name>`로 추가 (수동 작성 금지)
- 의존성을 추가하면 즉시 `npm install` 실행
- Korean is the primary UI language — 사용자 표시 텍스트는 한글로 작성
- Server Components가 기본값, 클라이언트 인터랙션이 필요한 컴포넌트만 `'use client'` 지시문 추가

### Testing Requirements
완료 전에 반드시 다음을 모두 통과해야 함:
```bash
npm run check-all   # typecheck + lint + format:check
npm run build       # 프로덕션 빌드 성공 확인
```
별도 단위 테스트 프레임워크는 설정되어 있지 않음.

### Common Patterns
- App Router(`src/app/`) 페이지 단위 라우팅
- 컴포넌트는 `src/components/{layout,navigation,providers,sections,ui}` 도메인별 분리
- 스타일: TailwindCSS 유틸리티 클래스 + `cn()` 헬퍼(`src/lib/utils.ts`)로 조건부 결합
- 다크 모드: `next-themes` `ThemeProvider`로 class 기반 토글
- 폼: shadcn/ui Form + React Hook Form + Zod 조합 권장 (가이드 문서 참조)

## Dependencies

### External (런타임)
- `next@15.5.3`, `react@19.1.0`, `react-dom@19.1.0` — App Router + Turbopack
- `tailwindcss@^4`, `tw-animate-css`, `@tailwindcss/postcss` — 스타일링
- `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` — shadcn/ui 기반
- `react-hook-form`, `@hookform/resolvers`, `zod@^4` — 폼/검증
- `next-themes` — 테마 전환
- `lucide-react` — 아이콘
- `sonner` — Toast 알림
- `usehooks-ts` — 반응형 미디어 쿼리 등 유틸 훅

### External (개발)
- `typescript@^5`, `eslint@^9`, `eslint-config-next`, `prettier@^3` (+ `prettier-plugin-tailwindcss`)
- `husky`, `lint-staged` — Git 훅 기반 자동 포맷/린트
- `shadcn@^3.3.1` CLI

<!-- MANUAL: 프로젝트 차원에서 보존할 사용자 메모를 이 줄 아래에 추가하세요 -->
