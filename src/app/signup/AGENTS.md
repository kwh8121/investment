<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# signup

## Purpose
`/signup` 라우트. 화면 가운데에 `SignupForm`을 배치하는 풀스크린 회원가입 페이지. 현재 메타데이터는 미설정(추가 권장).

## Key Files

| File | Description |
|------|-------------|
| `page.tsx` | Server Component 페이지. `bg-background flex min-h-screen items-center justify-center p-4` 컨테이너 안에 `<SignupForm />` 마운트 |

## For AI Agents

### Working In This Directory
- `login/page.tsx`와 같은 패턴으로 `metadata` export를 추가하는 것을 권장 (`title: '회원가입'`)
- 회원가입 로직(검증, Server Action)은 `@/components/signup-form`에서 처리 - 현재 정적 마크업 상태
- 약관/개인정보 동의 추가 필드가 늘어나면 폼만 수정, 라우트 파일은 유지

### Testing Requirements
- `npm run dev` 후 `/signup` 접속하여 마크업 확인
- 다크 모드 토글 시 카드 컬러 확인

### Common Patterns
- `login/`과 동일한 풀스크린 센터 정렬 패턴

## Dependencies

### Internal
- `@/components/signup-form` - 폼 본체

<!-- MANUAL: -->
