# ETF Price Signal MVP — 구현 방법론 최종 권장안

**기준 문서:** `ETF_Price_Signal_MVP_PRD_v1_7_Final.md` (구현 기준 확정본)  
**참고:** [https://github.com/github/spec-kit](https://github.com/github/spec-kit) · [https://github.com/obra/superpowers](https://github.com/obra/superpowers)  
**비교 대안:** ① Spec Kit 단독 ② Superpowers 단독 ③ 혼합 → **③ 혼합(경량형) 채택**

* * *

## 결론

**혼합 — 단, "경량 Spec Kit + 전담 Superpowers" 형태.**
Spec Kit은 헌법·게이트·대조 기능만 쓰고, 계획 생성과 실행은 Superpowers에 맡긴다. 풀 스택 Spec Kit(specify→plan→research→tasks→implement) 혼합은 이 PRD에는 과하다.

* * *

## 근거 — PRD의 세 가지 결정 요인

| PRD의 사실 | 결론에 미치는 영향 |
| --- | --- |
| **스펙은 이미 끝났다.** v1.7은 "구현 기준 확정본"이고 부록 A/B에 산식·배점·상태전이까지 고정 | Spec Kit의 `specify / clarify / plan` 생성 단계는 가치가 거의 없고 재서술 위험만 있음 → 생략. Superpowers `brainstorming`도 생략 |
| **위험은 실행 단계에 있다.** 100% 재현성(P0-07), 미래정보 차단(§4.4), 결측 0 대체 금지, 상태 enum 분리 금지(§9.3), 회귀 테스트 14개(§12.2) | 태스크별 격리 + RED 확인 + 스펙준수 리뷰가 강제되는 Superpowers가 실행을 전담. `/speckit-implement`는 쓰지 않음 |
| **게이트는 문서로 남겨야 한다.** DG0~DG4 6개(§11), 수용기준 15개(§15), 정책값/검증값 구분(§0.1), 버전별 정정 이력(§9.1), DG2.5 실패 시 "자동 튜닝 금지·새 버전 재실행" | 수작업 체크리스트로는 요구 수준의 추적이 흐트러짐 → Spec Kit의 `constitution / analyze / converge`만 채택 (Gate 조건 대조 표는 Gate 문서) |

* * *

## 채택 범위

### Spec Kit — 쓰는 것 (3개)

*   `constitution.md` — §0.1, §4.4, §9.3, §9.4, §11 자동튜닝 금지, §15 전체 + "승인 상태 전이·정책값 변경은 사람만" 조항
    
*   `/speckit-analyze` — DG 계획 승인 전·DG 종료 시 PRD(spec)·DG 계획(plan/tasks)·헌법 정합성 보조 점검
    
*   `/speckit-converge` — DG 종료 시 코드와 PRD·DG 계획 대조, DG2.5 실패 후 잔여 갭을 새 `rule_version` 태스크로 추가
    

### Spec Kit — 쓰지 않는 것

*   `specify`, `clarify`, `plan`, `research`, `quickstart`, `implement`, `checklist` (Spec Kit 1.0.6의 checklist는 요구사항 문서 품질 점검용이며 코드·Gate 조건을 대조하지 않는다)
    
*   `spec.md` 자리에는 PRD v1.7 원문을 그대로 둠 (재작성 금지)
    
*   §13 미결 항목(`stk_cls`, `drng`, KRX 호출 제한)은 PRD가 이미 "계산 미사용"으로 처리 규칙을 정했으므로 clarify 불필요
    

### Superpowers — 쓰는 것

*   `writing-plans` — PRD를 Spec으로 지정, §14 구현 순서(11단계)에 따라 **DG 단위 플랜 여러 개**로 분해. Global Constraints = 헌법 발췌
    
*   `using-git-worktrees` **→** `subagent-driven-development` **→** `test-driven-development` (§12.2 14개를 RED로 선배치) → `requesting-code-review` → `finishing-a-development-branch`
    
*   `systematic-debugging` — DG2.5 재현 실패 시
    

### Superpowers — 억제하는 것

*   `brainstorming` 자동 발동 — 첫 메시지에 "스펙은 PRD v1.7로 확정, 재설계 금지" 명시
    
*   "Rulings, not stalls" — 헌법에 정지 조건 추가: `CALC_APPROVED` 승격, `PUBLISH_PENDING→NON_TRADING` 확정, 임계값(theta/epsilon) 변경, `DRAFT→PUBLISHED`는 에이전트가 ruling으로 대체할 수 없음
    

* * *

## 판단을 바꿀 조건

*   **Superpowers 단독으로 축소:** Spec Kit 3개 기능이 DG 두 단계를 지나도록 실질적 갭을 한 번도 잡아내지 못하거나, 두 도구 관리가 개발 시간의 20%를 넘을 때
    
*   **Spec Kit 비중 확대:** 운영 중 정책 변경(rules_v2)이 잦아져 "무엇이 왜 바뀌었나"를 코드 커밋만으로 추적하기 어려워질 때
    

* * *

## 첫 행동

`constitution.md` **작성.** Spec Kit 쪽에서는 게이트의 근거, Superpowers 쪽에서는 모든 서브에이전트 브리프의 Global Constraints가 되는 **유일한 공통 자산**. PRD §15·§0.1·§4.4·§9.3·§9.4를 조항으로 옮기는 것부터 시작한다.
