<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# login

## Purpose
`/login` 라우트. 화면 가운데에 `LoginForm`을 배치하는 간단한 풀스크린 페이지. 메타데이터(title="로그인")를 지정.

## Key Files

| File | Description |
|------|-------------|
| `page.tsx` | Server Component 페이지. `bg-background flex min-h-screen items-center justify-center` 컨테이너 안에 `<LoginForm />` 마운트. `metadata` export로 타이틀/설명 지정 |

## For AI Agents

### Working In This Directory
- 페이지 자체는 Server Component로 유지 - 클라이언트 로직은 `@/components/login-form`에서 처리
- 인증 백엔드 통합 시 Server Action 또는 API 라우트로 처리하고 `LoginForm` 클라이언트에서 호출
- 미들웨어로 보호 라우트를 추가할 경우 루트의 `middleware.ts` 신설 필요 (현재 없음)

### Testing Requirements
- `npm run dev` 후 `http://localhost:3000/login` 접속하여 폼 동작 확인
- 폼 검증 메시지(빈 입력, 잘못된 이메일, 짧은 비밀번호) 확인

### Common Patterns
- 페이지는 마크업과 메타데이터만, 실질 로직은 컴포넌트 파일로 위임

## Dependencies

### Internal
- `@/components/login-form` - 폼 본체

### External
- `next` - `Metadata` 타입

<!-- MANUAL: -->
