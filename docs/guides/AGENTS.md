<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# guides

## Purpose
도메인별 상세 개발 가이드 문서. 루트 `CLAUDE.md`가 각 가이드를 `@/docs/guides/...` 경로로 참조하여 Claude Code 세션에서 컨텍스트로 활용.

## Key Files

| File | Description |
|------|-------------|
| `project-structure.md` | 디렉터리 구조와 파일 배치 규칙 (~9KB) |
| `styling-guide.md` | TailwindCSS v4 + shadcn/ui 스타일링 컨벤션 (~11KB) |
| `component-patterns.md` | React 컴포넌트 작성 패턴/관례 (~16KB) |
| `nextjs-15.md` | Next.js 15 App Router 전용 가이드 - RSC, 라우팅, 메타데이터 등 (~11KB) |
| `forms-react-hook-form.md` | React Hook Form + Zod + Server Actions 종합 가이드 (~40KB, 가장 상세함) |
| `one-fact-one-home.md` | stock-market 계획·리뷰·개발·Gate·배포 하네스 및 정보 정본 배치 정책 |

## For AI Agents

### Working In This Directory
- 가이드 추가 시 루트 `CLAUDE.md`의 "개발 가이드" 섹션에 `@/docs/guides/<file>.md` 링크 등록
- 새 가이드 파일명은 `<주제>-<세부주제>.md` 케밥-케이스
- 코드 예시는 실제 프로젝트의 의존성/버전과 일치시킬 것 (Next 16.3.4, React 19.2.8, Tailwind v4 등)
- `one-fact-one-home.md`는 운영 하네스의 정본이다. 제품·Gate·개별 작업 사실을 복제하지 말고 각 정본 문서 또는 Linear 링크로 연결한다.
- 한국어로 작성 (제목/설명/주석 포함)

### Common Patterns
- 각 문서는 자체 완결적 - 다른 가이드를 참조할 때는 상대 경로 사용
- 코드 블록은 언어 태그(```tsx, ```bash 등) 명시

## Dependencies

### Internal
- 루트 `CLAUDE.md`가 직접 참조

<!-- MANUAL: -->
