# DG0 v1.7 Contract Unification Implementation Plan

> **For agentic workers:** This DG0 evidence-only plan follows the complete sequence in `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`: `using-git-worktrees` → `subagent-driven-development` → `test-driven-development` → `requesting-code-review` → `finishing-a-development-branch`. It does not authorize DG1 implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce reviewable, evidence-backed classification of all pre-v1.7 implementation assets, so a human can decide DG0 without treating legacy behavior as v1.7 completion.

**Architecture:** This DG changes no domain behavior. It compares the legacy implementation surface with the v1.7 contract, records the classification in the DG0 Gate evidence, and preserves old artifacts as historical inputs. A later DG1 plan will introduce the required RED tests only after a human has accepted this boundary.

**Tech Stack:** Markdown evidence records, Git, Node test runner, TypeScript, Next.js build harness.

**Spec:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`; `docs/constitution.md`; `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`.

## Global Constraints

- 스펙은 PRD v1.7 Final로 확정됐으며, 재설계·재서술하지 않는다.
- `docs/constitution.md` Article I~IX의 국내 ETF 범위, 사람 전용 승인, 상태 분리, 미래정보 차단, 불변성 및 결정성 제약을 따른다.
- DG0은 증거를 제출할 뿐 Gate 통과를 선언하지 않는다. 사람의 DG0 판정 전 DG1 구현을 시작하지 않는다.
- 기존 코드·테스트의 통과는 v1.7 계약 충족 증거가 아니다.
- 제품 사실은 PRD, DG 순서는 ROADMAP, 기술 경계는 architecture, 실제 Gate 증거는 `docs/plan/gates/`에만 둔다.

---

### Task 1: Legacy asset contract matrix

**Files:**

- Modify: `docs/plan/gates/DG0-v17-contract-unification.md`
- Inspect: `src/lib/etf/**`, `test/**`, `migrations/**`, `scripts/**`, legacy `docs/plan/gates/DG*.md`

**Interfaces:**

- Consumes: PRD §2, §3, §4, §9, §11, §12.2, §15.
- Produces: Each legacy asset is labelled `REUSE_AFTER_DG1_TEST`, `MODIFY_OR_REPLACE`, or `OUT_OF_SCOPE_OR_HISTORICAL`, with a path-specific reason.

- [ ] **Step 1: Capture the audited implementation inventory**

Run: `rg --files src/lib/etf test migrations scripts | sort`

Expected: the complete legacy implementation and test surface is available for classification.

- [ ] **Step 2: Record the contract matrix**

Add one table row per coherent asset family. State the v1.7 constraint, legacy fact, classification, and the next allowed action. Do not describe a classified asset as a completed v1.7 feature.

- [ ] **Step 3: Verify no legacy completion is inherited**

Run: `npm run status:check`

Expected: PASS; the status guard continues to point to the v1.7 canonical sources.

- [ ] **Step 4: Commit**

```bash
git add docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md
git commit -m "docs: record DG0 v1.7 contract audit"
```

### Task 2: DG0 verification evidence and human decision packet

**Files:**

- Modify: `docs/plan/gates/DG0-v17-contract-unification.md`

**Interfaces:**

- Consumes: Task 1 matrix and baseline command output.
- Produces: A dated evidence packet that links §11 DG0 and each §15 acceptance criterion to its present status, without creating a Gate decision.

- [ ] **Step 1: Run the baseline quality suite**

Run: `npm run check-all`

Expected: PASS, recorded with command date and commit SHA.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: record either PASS output or the exact environmental failure. Never infer GREEN from a different runtime.

- [ ] **Step 3: Add the DG0 decision packet**

Record: the §11 DG0 checklist, §15 15-item analysis status, command results, unresolved human decisions, and the explicit stop condition: DG1 remains blocked until an Approver records DG0 Go.

- [ ] **Step 4: Validate the documentation change**

Run: `npm run check-all`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/plan/gates/DG0-v17-contract-unification.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-dg0.md
git commit -m "docs: add DG0 decision packet"
```

## Plan Self-Review

- PRD §11 DG0 is addressed by the asset matrix and human decision packet.
- PRD §2, §3, §4, §9, §12.2, and §15 have explicit audit/analysis destinations.
- No code implementation or DG1 Gate claim is included before the required human decision.
- The only new documents are the execution plan and DG0 actual evidence, preserving One Fact, One Home.
