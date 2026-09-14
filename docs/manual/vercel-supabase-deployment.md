# stock-market Vercel + Supabase 배포 절차

> 이 문서는 비공개 운영 알파의 배포·복구 절차 정본이다. 제품 요구사항은 PRD, 진행 중 작업 상태는 Linear, Gate 판정과 증거는 `docs/plan/gates/`에 둔다.

## 경계

- GitHub는 코드, PR, `quality.yml` 품질 검사, 릴리스 이력의 정본이다.
- Vercel은 GitHub 연동 Next.js 애플리케이션의 Preview와 Production 배포를 담당한다. Docker, GHCR, self-hosted runner, Compose 및 systemd는 이 경로에 사용하지 않는다.
- Supabase는 Postgres, Auth, private Storage의 정본 서비스다. 원본 응답은 private Storage 버킷에만 저장하며 공개 URL을 만들지 않는다.
- `main`은 Vercel Production Branch다. 다른 브랜치와 PR은 Preview만 생성한다. Vercel Deployment Protection으로 Preview와 Production 접근을 승인된 사용자로 제한한다.

## 일회성 설정

1. Vercel에서 GitHub `kwh8121/investment` 저장소를 Import하고 Framework Preset을 Next.js로 둔다.
2. Vercel Project의 Production Branch를 `main`으로 설정하고, Preview/Production Deployment Protection을 활성화한다.
3. Supabase에서 전용 프로젝트를 만들고, Postgres·Auth·private Storage bucket을 준비한다. 서비스 역할 키는 서버 환경에만 둔다.
4. Vercel Environment Variables에 Preview와 Production을 분리해 설정한다. 브라우저에 노출 가능한 값만 `NEXT_PUBLIC_` 접두사를 사용한다. `SUPABASE_SERVICE_ROLE_KEY`, 외부 API 키, `CRON_SECRET`은 Production server-only 값이며 Git, 로그, 클라이언트 번들에 넣지 않는다.
5. DB 스키마 변경이 생기면 `supabase/migrations/`의 migration으로 관리하고, remote 적용 전에 `supabase db push --dry-run`을 확인한다. 비밀을 포함한 직접 SQL은 commit하지 않는다.

## 일상 릴리스

1. feature branch에서 작업하고 `npm run check-all`과 `npm run build`의 결과를 PR에 남긴다.
2. Vercel Preview URL에서 로그인 경계와 화면 동작을 검증한다.
3. GitHub PR을 `main`에 병합한다. Vercel이 Production deployment를 생성한다.
4. Vercel Deployment 로그와 private 인증 경계를 확인하고, Linear에는 PR·commit SHA·Vercel deployment URL·검증 요약만 링크한다.

## 복구

1. Vercel Deployments에서 검증된 직전 Production deployment를 Promote 또는 Rollback한다.
2. 데이터 문제는 먼저 해당 Supabase migration, 원본 manifest, Gate/Linear 링크를 확인한다. 데이터 복구는 백업 보존 후 별도 사람 승인으로 시행한다.
3. 복구 사실은 GitHub/Vercel 기록을 정본으로 하고 Linear에는 링크와 결과만 남긴다. 복구는 DG 통과나 데이터 품질 승인을 뜻하지 않는다.

## 수집 스케줄 도입 조건

PRD의 최초 수집 시도 시각은 평일 19:00 KST다. DG1에서 수집기와 날짜 상태 계약이 구현·검증되기 전에는 scheduler를 배포하지 않는다.

DG1 이후에는 Vercel Cron이 보호된 server-only route를 `0 10 * * 1-5`(UTC, KST 19:00)로 호출한다. route는 `CRON_SECRET` 검증, 중복 실행 방지, 날짜별 checkpoint, 원본의 private Storage 보존을 수행해야 한다. Vercel 함수 실행 한도를 넘는 작업은 Supabase Cron이 Edge Function을 호출하거나 별도 worker를 설계·승인한 뒤에만 도입한다.

## 배포 전 점검

- [ ] Vercel Production Branch는 `main`이며 Preview/Production 보호가 켜져 있다.
- [ ] Vercel의 Preview·Production 환경변수는 분리됐고 server-only 비밀은 `NEXT_PUBLIC_`가 아니다.
- [ ] Supabase Storage bucket은 private이며 RLS와 Auth 정책을 검토했다.
- [ ] PR 품질 검사와 Vercel Preview 검증 결과를 확인했다.
- [ ] 수집 Cron은 DG1 검증 전에는 등록하지 않았다.
