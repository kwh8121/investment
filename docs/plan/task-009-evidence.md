# Task 009 — Scanner·Top 3·Radar 증거

## 구현 범위

- `src/lib/etf/scanner.ts`에서 전략별 Scanner 입력을 분리한다.
- G0~G4 실패, Thesis 누락, 포트폴리오 중복률·상관계수 초과 후보를 제외 사유와 함께 기록한다.
- 초기 후보는 최대 3개만 선택하며 통과 후보가 부족하면 결과를 억지로 채우지 않는다.
- 기존 Top 3는 동일 전략 안에서 유지하고, Challenger가 2주 연속 기존 3위보다 높은 퍼센타일을 기록한 경우에만 교체한다.
- Core 산업 중복 제한을 적용하고, Emerging Radar의 승격·유지·강등 상태와 근거를 반환한다.

## 조건부 범위

DG2가 Conditional Go이고 실제 분배금·펀더멘털 입력 검증이 남아 있으므로 이 구현은 Scanner 판정 계약과 테스트까지 포함한다. 실제 전체 유니버스 연결과 화면 확장은 DG2 조건을 해소한 뒤 진행한다.

## 검증 명령

```text
npm run test:task-009
npm run test:task-008
npm run test:task-007
npm run test:task-006
npm run test:task-005
npm run typecheck
npm run lint
npm run build
```

테스트는 초기 Top 3, 후보 부족, G4 제외, 2주 교체, Radar 유지, 전략 혼합 차단을 검증한다.
