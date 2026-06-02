<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# lib

## Purpose
프레임워크/도메인에 종속되지 않는 공통 유틸리티 모음. 순수 함수, 환경 변수 검증, 도우미를 둠. shadcn/ui CLI도 `components.json`에서 `utils: @/lib/utils`로 이 경로를 참조.

## Key Files

| File | Description |
|------|-------------|
| `utils.ts` | `cn(...inputs)` 헬퍼 - `clsx`로 조건부 클래스 결합 후 `tailwind-merge`로 Tailwind 충돌 클래스 해소. shadcn/ui 컴포넌트들이 import |
| `env.ts` | Zod 스키마로 `process.env` 검증 후 타입 안전한 `env` 객체 export (`NODE_ENV`, `VERCEL_URL`, `NEXT_PUBLIC_APP_URL`). `Env` 타입도 함께 export |

## For AI Agents

### Working In This Directory
- 새 환경 변수는 `env.ts`의 `envSchema`에 zod 필드를 추가하고 `parse` 인자에 매핑 - 직접 `process.env.X` 접근 지양
- `NEXT_PUBLIC_*` prefix가 있어야 클라이언트에 노출됨 (Next.js 규약)
- 순수 함수만 두기 - 컴포넌트, JSX, 부수 효과는 다른 디렉터리로
- 새 유틸 함수는 작은 단일 책임 단위로 분리

### Testing Requirements
- `npm run typecheck`로 타입 검증
- env 변경 시 빌드(`npm run build`)로 검증 (Zod 파싱은 모듈 로드 시 실행됨)

### Common Patterns
- `cn` 패턴: shadcn 컴포넌트 전반에서 사용 (`<div className={cn("base", condition && "extra", className)}>`)
- env 패턴: 모듈 최상위에서 `parse` 실행 → 잘못된 env면 빌드/런타임 즉시 실패 (fail-fast)

## Dependencies

### External
- `clsx` - 조건부 클래스 문자열
- `tailwind-merge` - Tailwind 충돌 해소
- `zod` - 스키마 검증

<!-- MANUAL: -->
