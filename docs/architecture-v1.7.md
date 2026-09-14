# ETF Price Signal MVP v1.7 아키텍처 기준선

> **상태 (2026-09-14):** DG0에서 수립한 현행 기술 경계. 구현 상세와 저장 모델은 DG별 계획·테스트가 확정할 때만 추가한다.<br>
> **제품 스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`<br>
> **전역 제약:** `docs/constitution.md`

## 범위와 경계

이 MVP는 국내 상장 ETF의 KRX 종가 기반 수집·지표·Scanner·주간 후보·과거 재현을 제공한다. UI는 도메인 읽기 모델만 표시한다. 미국 ETF, 환율·분배금·총수익, 산업/뉴스/LLM 판단, 주문·자동매매, 가상 포지션 및 전향 평가 자동화는 이 기준선의 범위 밖이다.

## 계층

```text
KRX 정본 + 허용된 키움 보조 조회 (서버 전용)
  → redacted raw snapshot + ingestion/checkpoint
  → 날짜·필드·식별자 검증 및 승인 상태
  → 관측 유니버스·가격 지표·품질/분배 의심
  → Scanner A/B + 공통 선정 엔진
  → 신호 재현 (as-of 제한) / 평가 (미래 가격 허용)
  → 불변 주간 카드 읽기 모델
  → Next.js Server Component UI
```

## 핵심 불변 조건

- 과거 신호 모듈은 기준일 이후 가격, 현재 마스터, 현재 명칭/지수에 접근할 수 없다. 평가 모듈만 이후 가격을 읽는다.
- 상태 축은 필드·날짜·종목 가용성·계산·가격 확보·품질로 분리한다. 결측은 0으로 대체하지 않고, `NON_TRADING`은 시계열 행으로 저장하지 않는다.
- 계산에는 `CALC_APPROVED` 필드만 사용한다. 승인 기록 및 비교 가능성 승격은 사람 전용이다.
- raw 응답과 계산/발행 입력은 불변 버전이며, 모든 계산 결과는 PRD §9.1/헌법 Article V.2의 출처·날짜·버전·hash·run ID로 역추적 가능해야 한다.
- 동일 input manifest·calendar/rule version은 결정적으로 동일 결과를 낸다. UI와 과거 재현은 같은 선정 엔진을 호출한다.

## 구현 상태의 해석

`src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**`에 존재하는 이전 구현은 DG0 매핑의 감사 대상이다. 파일 존재나 기존 테스트 통과는 v1.7 계약 충족 또는 Gate 통과를 의미하지 않는다. DG별 RED→GREEN 회귀 테스트, `npm run check-all`, `npm run build`, 그리고 사람의 Gate 판정이 새 증거가 된다.
