# DG0 범위 기준선 — Gate 판정 기록

> Gate: DG0 범위 기준선
> 판정일: 2026-08-25
> 판정: Go / 승인
> Owner (담당): 제품 책임자
> Approver (승인): 검토자

## 1. 판정 근거

- `docs/PRD.md` v1.0의 목표 시장(한국·미국), 핵심 전략(Momentum Acceleration, Oversold
  Recovery), 비목표(4.2절), 시장별 `Conditional Go` 규칙(5.2절)과 Gate 구조(11장)를
  검토함.
- `docs/ROADMAP.md` v1.0의 Task 001~014 실행 순서, Gate 정의(4장)와 8주 실행
  캘린더(13장)를 검토함.
- 독립 재검토(re-review)에서 Critical 또는 Major 결함 없이 APPROVE 판정을 받음. Minor
  리스크 1건(W2/W3 일정이 타이트하나 의존성 순서와는 상충하지 않음)만 확인됨.
- `docs/PRD.md` 16.2절과 `docs/ROADMAP.md` 14.1절의 AC 단위 추적표에서 총 50개 AC
  ID가 Task 002~014와 상호 추적 가능함을 확인함. Task 001은 개별 AC를 충족시키지
  않는 DG0 거버넌스 전제조건(범위 동결)이며 AC 추적 대상에서 제외됨.

## 2. 동결 범위 (Frozen at DG0)

다음 항목은 이번 DG0 승인으로 기준선(baseline)으로 동결되며, PRD 버전 변경 없이는
바꾸지 않는다.

- 목표 시장: 한국·미국 ETF (PRD 5.1절)
- 전략 스코어카드: Momentum Acceleration, Oversold Recovery (PRD 4.1절, 5.1절)
- 비목표: PRD 4.2절 전체 항목(실계좌 자동매매, 수익률 보장·개인화 투자자문,
  레버리지·인버스 기본 추천, 환헤지 실행 등)
- 시장별 `Conditional Go` 규칙: PRD 5.2절 — 한국 또는 미국이 DG1을 통과하지 못하면
  해당 시장을 임의의 대체 데이터로 포함하지 않음
- Gate 구조: PRD 11장·ROADMAP 4장의 DG0~DG5 순서와 각 Gate의 Owner/Approver 역할
  분리

## 3. 보류 항목 (Open Questions — 기존 Gate 유지)

PRD 14장의 Open Questions #1~#10은 이번 DG0 판정으로 확정되지 않으며, 각 항목에
이미 배정된 확정 시점(DG1, DG2·DG3 등)을 그대로 유지한다.

## 4. 미충족 항목

없음.

## 5. 예외 및 만료일

없음(Conditional Go 조건 없이 승인).

## 6. 재검토 트리거

다음 중 하나가 발생하면 DG0을 재검토한다.

- 목표 시장, 전략, 위험 한도 또는 Gate 구조 변경
- 비목표 항목의 변경 또는 추가
- Gate 순서나 Owner/Approver 역할 구조 변경

고정된 재검토 날짜는 없으며, 위 트리거가 발생할 때만 재검토한다.

## 7. 다음 단계

DG0 승인에 따라 Task 001을 완료로 표시하며, 다음 실행 단계는 Task 002·003을 통한
DG1(데이터·권한 Reality Check)이다. 이 판정은 DG1 승인이 아니며, Kiwoom 데이터
수집 능력이 검증되었음을 의미하지 않는다. DG1 통과 전에는 영구 스키마 확정이나
전체 UI 본개발을 시작하지 않는다.
