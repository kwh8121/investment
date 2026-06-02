<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-02 | Updated: 2026-06-02 -->

# public

## Purpose
정적 자산을 서빙하는 디렉터리. Next.js는 이 폴더의 파일들을 루트(`/`) 경로로 직접 노출함 (`/next.svg` 등). 빌드 처리 없이 그대로 전달되므로 favicon, 로고, 사전 최적화된 이미지 등에 사용.

## Key Files

| File | Description |
|------|-------------|
| `next.svg` | Next.js 로고 (create-next-app 기본 자산) |
| `vercel.svg` | Vercel 로고 (기본 자산) |
| `file.svg` | 파일 아이콘 |
| `globe.svg` | 글로브 아이콘 |
| `window.svg` | 윈도우 아이콘 |

> 참고: `favicon.ico`는 App Router 규약에 따라 `src/app/favicon.ico`에 위치.

## For AI Agents

### Working In This Directory
- 여기에 놓인 파일은 URL 경로에 직접 매핑됨 (`public/foo.png` → `/foo.png`)
- 컴포넌트에서 사용 시 `<img src="/next.svg" />` 또는 `next/image`의 `src="/next.svg"` 형태로 절대 경로 사용
- 사전 처리(최적화/번들링)가 필요하면 `src/` 하위로 두고 import하는 방식 권장
- 민감한 파일은 절대 두지 말 것 (인덱스 노출됨)

### Common Patterns
- create-next-app이 생성한 데모 SVG가 잔존 중 — 프로젝트에서 사용되지 않으면 제거 가능

## Dependencies
없음 (정적 자산 디렉터리)

<!-- MANUAL: -->
