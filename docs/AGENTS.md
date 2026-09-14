<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# docs

## Purpose
ETF Price Signal MVP의 정본·Gate·개발 가이드 문서 모음. 현행 제품 스펙은 `ETF_Price_Signal_MVP_PRD_v1_7_Final.md`이며, 문서의 역할은 루트 `AGENTS.md`의 One Fact, One Home 정책을 따른다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `guides/` | 도메인별 상세 가이드 (Next.js, 스타일링, 폼, 컴포넌트 패턴 등). see `guides/AGENTS.md` |

## For AI Agents

### Working In This Directory
- 제품 요구사항은 `ETF_Price_Signal_MVP_PRD_v1_7_Final.md`, DG 수준 프로그램 기준선은 `ROADMAP-v1.7.md`, 진행 중 개별 작업 상태는 Linear, 기술 경계는 `architecture-v1.7.md`, Gate 판정은 `plan/gates/`에서만 갱신한다. 전체 도구·문서 하네스는 `guides/one-fact-one-home.md`를 따른다.
- 이전 `PRD.md`, `ROADMAP.md`, `architecture.md` 및 기존 Gate 기록은 역사적 스냅샷이다. 내용을 현재 기준으로 조용히 고치지 말고 현행 정본을 참조한다.
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
