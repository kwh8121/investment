# Task 005 — 단일 한국 ETF 종단 파이프라인 증거

## 범위

- 승인 범위인 한국 ETF만 처리한다.
- 외부 API와 자격 증명 없이 결정론적 fixture를 사용한다.
- Raw snapshot은 민감 키를 제거한 뒤 해시·저장하고, 정규화·품질 판정·계산·읽기 모델까지 연결한다.

## 구현 위치

- `src/lib/etf/types.ts` — Task 004 엔터티와 파이프라인 DTO
- `src/lib/etf/normalize.ts` — 입력 검증, secret 제거, 품질 판정
- `src/lib/etf/repository.ts` — 멱등 Raw snapshot 저장과 ingestion run 추적
- `src/lib/etf/pipeline.ts` — 단일 ETF 종단 실행
- `migrations/001_task005_korean_etf_pipeline.sql` — PostgreSQL 계약의 초기 스키마

## 검증 결과

실행 명령:

```text
npm run test:task-005
npm run typecheck
npm run lint
npm run build
```

Task 005 테스트는 다음을 검증한다.

1. Raw → 정규화 → 품질 → 계산 → 읽기 모델의 단계 추적
2. Raw snapshot 저장 전 인증 정보 제거
3. 결측값을 0으로 바꾸지 않고 추천 차단
4. 실패한 실행 보존, 복구 실행에서 Raw snapshot 재사용
5. 동일 입력 재실행 시 동일 읽기 모델 생성

`npm run format:check`는 기존 `_workspace/`, `opencode.json` 파일의 사전 존재 포맷 경고가 있어 저장소 전체 기준으로는 별도 정리가 필요하다.
