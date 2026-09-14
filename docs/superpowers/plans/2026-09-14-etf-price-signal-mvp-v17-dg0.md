# DG0 v1.7 계약 통일 실행 계획

> **에이전트 작업자용:** 이 DG0 증거 전용 계획은 `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`의 전체 순서, 즉 `using-git-worktrees` → `subagent-driven-development` → `test-driven-development` → `requesting-code-review` → `finishing-a-development-branch`를 따른다. 이 계획은 DG1 구현을 허가하지 않는다. 진행 상태는 체크박스(`- [ ]`)로 기록한다.

**목표:** 레거시 동작을 v1.7 완료로 오인하지 않도록, v1.7 이전 구현 자산 전체를 검토 가능한 증거와 함께 분류하여 사람이 DG0을 판정할 수 있게 한다.

**아키텍처:** 이 DG는 도메인 동작을 변경하지 않는다. 레거시 구현 표면을 v1.7 계약과 대조하고 분류 결과를 DG0 Gate 증거에 기록하며, 이전 자산은 역사적 입력으로 보존한다. 사람이 이 경계를 수락한 후에만 후속 DG1 계획에서 필수 RED 테스트를 추가한다.

**기술 스택:** Markdown 증거 기록, Git, Node 테스트 러너, TypeScript, Next.js 빌드 하네스.

**스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`; `docs/constitution.md`; `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`.

## 전역 제약

- 스펙은 PRD v1.7 Final로 확정됐으며, 재설계·재서술하지 않는다.
- `docs/constitution.md` 제I~IX조의 국내 ETF 범위, 사람 전용 승인, 상태 분리, 미래정보 차단, 불변성 및 결정성 제약을 따른다.
- DG0은 증거를 제출할 뿐 Gate 통과를 선언하지 않는다. 사람의 DG0 판정 전 DG1 구현을 시작하지 않는다.
- 기존 코드·테스트의 통과는 v1.7 계약 충족 증거가 아니다.
- 제품 사실은 PRD, DG 순서는 ROADMAP, 기술 경계는 아키텍처 기준선, 실제 Gate 증거는 `docs/plan/gates/`에만 둔다.

---

### 작업 1: 레거시 자산 계약 매트릭스

**파일:**

- 변경: `docs/plan/gates/DG0-v17-contract-unification.md`
- 검사: `src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**`, 이전 `docs/plan/gates/DG*.md`

**인터페이스:**

- 입력: PRD §2, §3, §4, §9, §11, §12.2, §15.
- 출력: 모든 레거시 자산에 경로별 근거와 함께 `REUSE_AFTER_DG1_TEST`, `MODIFY_OR_REPLACE`, `OUT_OF_SCOPE_OR_HISTORICAL` 중 하나를 부여한다.

- [ ] **1단계: 감사 대상 구현 인벤토리 수집**

실행: `rg --files src/lib/etf test migrations scripts | sort`

기대 결과: 분류 가능한 레거시 구현 및 테스트 전체 표면을 확보한다.

- [ ] **2단계: 계약 매트릭스 기록**

의미상 일관된 자산군마다 표 한 행을 추가한다. v1.7 제약, 레거시 사실, 분류, 다음에 허용된 조치를 기록한다. 분류된 자산을 v1.7 완료 기능으로 표현하지 않는다.

- [ ] **3단계: 레거시 완료 표기가 승계되지 않는지 검증**

실행: `npm run status:check`

기대 결과: PASS; 상태 검사가 계속 v1.7 정본을 가리킨다.

- [ ] **4단계: 커밋**

```bash
git add docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md
git commit -m "문서: DG0 v1.7 계약 감사 기록"
```

### 작업 2: DG0 검증 증거와 사람 판정 패킷

**파일:**

- 변경: `docs/plan/gates/DG0-v17-contract-unification.md`

**인터페이스:**

- 입력: 작업 1 매트릭스와 기준선 명령 출력.
- 출력: Gate 판정을 만들지 않고 §11 DG0과 §15의 각 수용 기준을 현재 상태에 연결하는 날짜 포함 증거 패킷.

- [ ] **1단계: 기준선 품질 검사 실행**

실행: `npm run check-all`

기대 결과: PASS, 명령 실행일과 commit SHA를 함께 기록한다.

- [ ] **2단계: 프로덕션 빌드 실행**

실행: `npm run build`

기대 결과: PASS 출력 또는 정확한 환경 실패를 기록한다. 다른 실행 환경 결과로 GREEN을 추정하지 않는다.

- [ ] **3단계: DG0 판정 패킷 추가**

기록: §11 DG0 체크리스트, §15의 15개 항목 분석 상태, 명령 결과, 미해결 사람 전용 결정, 그리고 Approver가 DG0 Go를 기록하기 전까지 DG1이 차단된다는 명시적 중단 조건.

- [ ] **4단계: 문서 변경 검증**

실행: `npm run check-all`

기대 결과: PASS.

- [ ] **5단계: 커밋**

```bash
git add docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md
git commit -m "문서: DG0 판정 패킷 추가"
```

## 계획 자체 검토

- PRD §11 DG0은 자산 매트릭스와 사람 판정 패킷으로 다룬다.
- PRD §2, §3, §4, §9, §12.2, §15에는 명시적인 감사·분석 위치가 있다.
- 필요한 사람 판정 전에는 코드 구현 또는 DG1 Gate 주장을 포함하지 않는다.
- 실행 계획과 DG0 실제 증거만 새 문서로 추가하여 사실별 정본 원칙을 보존한다.
