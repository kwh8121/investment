# 2026-09-15 DG0 speckit-analyze 보조 보고

기준 커밋: `9861db4`

이 보고서는 설치된 `.claude/skills/speckit-analyze/SKILL.md`의 검사 항목을 따라 Codex 환경에서 작성한 DG0 보조 증거다. Gate 판정은 대체하지 않으며, DG0 정본 판정 기록은 `docs/plan/gates/DG0-v17-contract-unification.md`에만 둔다.

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
| --- | --- | --- | --- | --- | --- |
| A1 | Constitution Alignment | LOW | `docs/constitution.md`; `docs/plan/2026-09-15-dg0-alignment.md` | 2A'에 따라 §12.2 테스트 유지 규칙과 #6-A/#6-B 책임 분리가 헌법과 승인 계획에 반영됐다. | 추가 조치 없음. 작업 5에서 Gate 증거와 ROADMAP에 링크한다. |
| A2 | Coverage | LOW | `src/lib/etf/selection-source.ts`; `test/v17-selection-source-contract.test.ts`; `test/project-status.test.ts`; `test/legacy/legacy-gate-status.test.ts` | 작업 1~3 구현은 KRX 선정 원천 선언, legacy import 차단, status:check 분리, 헌법 개정 요구를 덮는다. | 추가 조치 없음. 작업 5에서 커밋 SHA와 검증 결과를 Gate 증거에 연결한다. |
| A3 | Remaining Work | MEDIUM | `docs/plan/2026-09-15-dg0-alignment.md` 작업 5 | DG0 판정 자료 갱신, Supabase 적용 여부 조회 결과 기록, PR/CI 링크 연결은 아직 실행 전이다. | 작업 5를 수행한다. 이것은 기존 계획에 있는 잔여 작업이며 새 converge 작업은 아니다. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
| --- | --- | --- | --- |
| DG0-1 KRX 정본 | Yes | 작업 1, 작업 5 | KRX 선언과 legacy 격리 증거는 작성됐고, Gate 문서 최종 연결은 작업 5에서 수행한다. |
| DG0-2 문서·코드 선정 원천 일치 | Yes | 작업 1, 작업 2, 작업 5 | `test:v17-contract`가 v1.7 경로의 legacy marker/import 및 CI 강제 실행을 차단한다. |
| DG0-3 기존 충돌 계약 폐기 | Yes | 작업 1, 작업 2, 작업 5 | 키움 선정 계약은 legacy로 격리했고, 레거시 상태 검사는 수동 `test:legacy`로 분리했다. |
| 헌법 VII.4 Gate 사람 판정 | Yes | 작업 0, 작업 2, 작업 5, 작업 6 | `status:check`는 사람 Go 기록 없이 ROADMAP의 `통과` 표기를 실패시킨다. |
| 헌법 VII.5 단계별 GREEN | Yes | 작업 3, 작업 5 | 헌법 0.2.0 문구가 #6-A/#6-B와 단계별 RED→GREEN 규칙을 반영한다. |

## Constitution Alignment Issues

없음. DG0 `Go`는 기록하지 않았고, 사람 판정 전 DG1 이상 Gate 의존 구현을 시작하지 않았다.

## Unmapped Tasks

없음. `tasks.md`는 정본 계획이 아니라 보조 도구용 파생 색인이다.

## Metrics

- 확인한 요구·수용 기준: 5
- 확인한 계획 결정: 5
- 확인한 헌법 조항: III.6, VII.4, VII.5, IX.6, IX.7
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

작업 5에서 Gate 문서와 ROADMAP에 작업 1~4의 커밋 SHA, 검증 결과, 이 보고서와 `tasks.md` 링크, Supabase 읽기 전용 조회 상태를 연결한다.
