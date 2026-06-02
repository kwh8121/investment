<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# docs

## Purpose
프로젝트 개발 가이드 문서 모음. 한국어로 작성된 마크다운 문서들로 기술 스택, 코딩 규칙, 프로젝트 구조 등을 설명. 루트 `CLAUDE.md`에서 `@/docs/...` 형태로 직접 참조됨.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `guides/` | 도메인별 상세 가이드 (Next.js 15, 스타일링, 폼, 컴포넌트 패턴 등). see `guides/AGENTS.md` |

## For AI Agents

### Working In This Directory
- 새 가이드를 추가하면 루트 `CLAUDE.md`의 "개발 가이드" 섹션에 링크 추가 고려
- 모든 문서는 한국어로 작성
- 코드 예시는 실제 프로젝트의 컨벤션(TypeScript, App Router, shadcn/ui)에 맞춰 작성

### Common Patterns
- 파일명은 소문자-케밥(`forms-react-hook-form.md`)
- 각 가이드는 자체 완결적이며, 다른 가이드 참조 시 상대 경로 사용

## Dependencies

### Internal
- 루트 `CLAUDE.md`에서 참조됨

<!-- MANUAL: -->
