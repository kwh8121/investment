# Task 006 — ETF 마스터·일별 수집 파이프라인 증거

## 구현 범위

- `src/lib/etf/collection.ts`에 한국 ETF 마스터 정규화와 `universe_filter_version` 기반 사전 필터를 구현했다.
- ETN, 레버리지·인버스, 최소 상장기간 미달, 최소 평균 거래대금 미달 종목을 제외하고 사유를 남긴다.
- 일별 종가·거래량·거래대금·KRW 기준 환율·분배금 입력을 정규화한다.
- 전일 대비 ±30% 이상 가격 변화와 3영업일 연속 결측을 품질 플래그로 기록한다.
- 실패 알림에 해당하는 `COLLECTION_FAILED` 플래그와 시도별 재시도 로그를 보존한다.
- 필터 전후 수, 성공·실패 수, 플래그별 수를 품질 대시보드 읽기 모델로 제공한다.

## 검증 명령

```text
npm run test:task-006
npm run typecheck
npm run lint
npm run build
```

실제 Kiwoom/KRX 호출은 Task 005와 동일하게 source fetch 함수 경계에서 주입하며, 자격 증명 없이 결정론적 fixture로 수집·재시도·품질 규칙을 검증한다.
