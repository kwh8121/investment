# Task 007 — 전략별 지표·스코어카드 증거

## 구현 범위

- `src/lib/etf/strategy.ts`에 `strategy-v0.2`를 고정했다.
- Momentum은 1·3·6개월 상대강도, 가속, 산업 펀더멘털, 거래량·유동성, 데이터 신뢰도와 최대 20점 과열 감점을 계산한다.
- Oversold는 낙폭 심도·기간, 하락 둔화·반전, 펀더멘털 회복, 거래량·유동성, 데이터 신뢰도와 최대 25점 구조적 훼손 감점을 계산한다.
- 모든 전략 입력은 원화 환산(`valuationCurrency=KRW`) 기준이며, 다른 통화 입력은 거부한다.
- 두 전략은 별도로 계산하며 점수를 서로 직접 비교하지 않는다.
- 전략별 유니버스의 상위 5퍼센타일을 G2로 적용하고, G0→G4 결과와 제외 사유를 보존한다.
- `universeFilterVersion`과 `strategyVersion`을 모든 평가 결과에 기록한다.

## 검증 명령

```text
npm run test:task-007
npm run test:task-005
npm run test:task-006
npm run typecheck
npm run lint
npm run build
```

고정 fixture에서 동일 입력의 결과 재현, 전략 분리, 상위 5퍼센타일과 G0~G4 실패 차단을 검증한다.
