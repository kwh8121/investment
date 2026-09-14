# 5단계 운영 흐름 검증 기록 — 2026-09-14

> 이 문서는 세션 검증 결과의 정본이다. 제품/Gate/Linear/배포의 상태를 변경하거나 대체하지 않는다.

## 범위와 방법

`docs/guides/one-fact-one-home.md`의 Stage 1~5를 대상으로 정본 경로, 로컬 검사, Linear 읽기 전용 조회, GitHub CLI 상태 및 로컬 Vercel/Supabase 준비 상태를 점검했다. 외부 이슈 생성·상태 전이·배포·Gate 판정은 수행하지 않았다.

## 결과

| Stage                | 판정             | 근거                                                                                                                                                                                                                                                                                          | 미충족 또는 다음 조치                                                                                                                                                                                          |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 계획 초안         | 준비됨           | Linear workspace `koreatimes`, team `Koreatimes`, project `ETF Price Signal` 및 `plan-draft` 라벨을 읽기 전용으로 확인했다.                                                                                                                                                                   | 프로젝트에는 아직 이슈가 0개라 실제 Parent/Sub-issue 생성과 의존관계 연결은 검증하지 못했다.                                                                                                                   |
| 2. 계획 검토·승인    | 부분 검증        | `needs-review`, `plan-approved` 라벨이 존재하고 `docs/plan/` 정본 경로가 존재한다.                                                                                                                                                                                                            | 실제 Linear 이슈, verifier comment, attachment, `plan-draft → needs-review → plan-approved` 전이는 검증하지 못했다.                                                                                            |
| 3. 개발              | 부분 검증        | `.github/workflows/quality.yml`은 PR과 `main` push에서 build, Playwright, Gate, repository 검사를 수행하도록 구성돼 있다. `test:font-loading`, `test:deployment-config`, typecheck, lint, format 검사를 통과했다. 사용자 제공 최신 증거에서 `gh api user --jq .login`은 `kwh8121`을 반환했다. | 이 세션의 `gh auth status`는 저장 토큰 invalid 및 API 연결 실패를 보고했다. 현재 branch `deployment-private-production`은 Linear issue branch가 아니며 PR 생성/상태 연결을 검증하지 못했다.                    |
| 4. 구현·Gate 검증    | 차단 규칙 검증됨 | `npm run test:gate-validation`이 통과했다. 현행 Gate 기록은 DG0 Approver 미지정·증거 준비, DG2 Conditional Go, DG3 No-Go, DG4 No-Go를 명시한다.                                                                                                                                               | 사람 Gate 판정 없이 DG1 이상이나 운영 알파로 진행할 수 없다. 실제 `verify-request → verify-passed` 전이는 활성 Linear 이슈가 생긴 뒤 검증한다.                                                                 |
| 5. 배포·다음 DG 승인 | 미준비           | `docs/manual/vercel-supabase-deployment.md`가 Vercel Git 배포, Supabase private Storage, DG1 이전 Cron 보류를 정본으로 정의한다.                                                                                                                                                              | `.vercel/`, `supabase/` 디렉터리와 Vercel/Supabase CLI가 없어서 프로젝트 연결, Deployment Protection, 환경변수 분리, RLS/private bucket, Preview/Production 배포 및 rollback은 검증하지 못했다. DG4도 No-Go다. |

## 도구 확인

- Linear MCP: 인증·읽기 전용 조회 성공. 다섯 운영 라벨(`plan-draft`, `needs-review`, `plan-approved`, `verify-request`, `verify-passed`)과 ETF Price Signal 프로젝트를 확인했다.
- GitHub: remote는 `https://github.com/kwh8121/investment.git`이다. 사용자 제공 최신 증거에서 `gh api user --jq .login`은 `kwh8121`을 반환했다. 이 세션의 `gh auth status`는 저장 토큰 invalid 및 API 연결 실패를 보고했으므로, API 호출 성공 여부와 저장 자격증명 진단을 별도 상태로 취급한다.
- Vercel/Supabase: CLI와 프로젝트 로컬 연결 흔적을 찾지 못했다. 이는 계정 또는 Dashboard 설정의 부재를 단정하지 않지만, 현 세션에서는 검증 증거가 없다.

## 정합성 발견 사항

1. Stage 2~4의 실제 Linear 전이와 GitHub PR attachment는 테스트할 이슈가 없어 미실행이다. 운영 이슈를 생성한 뒤에만 별도 검증한다.

## 결론

문서·로컬 Gate·차단 규칙은 현재 DG0 증거 준비 상태와 일치한다. Live 운영 흐름은 Stage 1/2/3/5의 외부 연동 준비 및 Stage 4의 사람 Gate 판정이 없으므로 아직 end-to-end 통과 상태가 아니다.
