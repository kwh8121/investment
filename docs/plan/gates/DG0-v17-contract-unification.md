# DG0 v1.7 계약 통일 — 증거 준비 기록

> **Gate:** DG0 계약 통일<br>
> **기준 스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`<br>
> **상태 (2026-09-14):** 증거 준비 중 — 판정 없음<br>
> **Owner:** 미지정<br>
> **Approver:** 미지정

## 확인된 정합성 상태

| 영역           | 직접 관찰한 증거                                                                        | v1.7 해석                              | 필요한 조치                                  |
| -------------- | --------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| 현행 제품 스펙 | `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`는 v1.7 Final이며 P0-01~07, DG0~DG4를 정의 | 현행 정본                              | 변경 없음                                    |
| 이전 PRD       | `docs/PRD.md`는 v1.2, P0-01~10, 한·미 ETF, 환율·분배금·총수익을 정의                    | 역사적 참조                            | v1.7 정본을 가리키는 상태 표기 완료          |
| 이전 실행 원장 | `docs/ROADMAP.md`는 DG0~DG5, Task 001~014 및 기존 완료 상태를 선언                      | v1.7 Gate 증거로 재사용 불가           | 현행 `docs/ROADMAP-v1.7.md` 생성 완료        |
| 이전 기술 경계 | `docs/architecture.md`는 기존 Task 005~014, G0~G4, Research/Forward Validation을 기술   | v1.7 기술 정본이 아님                  | `docs/architecture-v1.7.md` 기준선 생성 완료 |
| 기존 Gate 기록 | `DG0-scope-baseline.md`, `DG1-data-rights.md`는 이전 범위/판정 기반                     | 역사적 판정                            | 보존, v1.7 판정에 사용 금지                  |
| 코드·테스트    | `src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**`가 기존 Task 기반으로 존재    | 호환성 감사 전에는 v1.7 완료 증거 아님 | PRD §12.2/§15 매핑 및 RED 테스트 계획 필요   |

## DG0 통과 전 남은 증거

- PRD §2·§3·§4·§9·§11·§12.2·§15의 요구사항을 기존 코드·테스트·migration·script에 행 단위로 매핑한다.
- 기존 자산을 **재사용 가능**, **수정 필요**, **범위 밖/격리**로 분류하고 근거를 기록한다.
- 국내 가격·거래대금 KRX 정본, selection source, 기존 충돌 계약의 폐기/수정 여부를 코드와 문서에서 확인한다.
- PRD §12.2의 14개 필수 회귀 테스트 중 v1.7 증거가 없는 항목을 RED로 선배치하는 DG1 계획을 작성한다.
- `/speckit.checklist`와 `/speckit.analyze` 결과, `npm run check-all`, `npm run build` 실행 결과를 이 기록에 연결한다.

## 판정 경계

이 문서는 증거 준비 기록일 뿐 DG0 `Go` 판정이 아니다. DG0 통과/반려는 Approver가 수행하며, 그 전에는 DG1 이상의 Gate 의존 구현을 시작하거나 기존 완료 표기를 승계하지 않는다.
