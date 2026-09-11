# Repository Changes Commit Decomposition Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to apply this plan task-by-task with review checkpoints.

**Goal:** Split the current mixed working tree into reviewable, dependency-ordered commits without including generated artifacts or unrelated files.

**Architecture:** Keep repository tooling/configuration, domain implementation, tests, UI, and documentation in separate commits. Stage files explicitly rather than using `git add .`; preserve the existing working tree and review ambiguous generated assets before staging.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Node test runner, Playwright, Zod, ESLint, Prettier, Husky.

**Spec:** Current repository state from `git status`, `git diff`, and the existing PRD/architecture documents.

## Global Constraints

- Do not overwrite or add `AGENTS.md`; the existing root file is unchanged.
- Do not stage `_workspace/`, `design/*.pdf`, `design/*.webp`, `design/*.zip`, or `.opencode/` until their ownership and intended distribution are confirmed.
- Do not stage secrets, raw evidence, local captures, or generated browser output.
- Run targeted tests after each implementation commit and `npm run check-all` plus `npm run build` before the final integration commit.

### Task 1: Repository tooling and validation configuration

**Files:** `.gitignore`, `.prettierignore`, `.husky/pre-commit`, `.vscode/settings.json`, `package.json`, `tsconfig.json`, `.github/workflows/quality.yml`, `playwright.config.ts`.

- Review each file for only tooling-related changes.
- Stage exactly these files and inspect `git diff --cached`.
- Run `npm run typecheck`, `npm run lint`, and `npm run format:check`.
- Commit: `chore: align repository validation and tooling`.

### Task 2: ETF domain and data-ingestion implementation

**Files:** `src/lib/etf/types.ts`, `normalize.ts`, `repository.ts`, `collection.ts`, `bounded-concurrency.ts`, `krx-etf-daily-market-data.ts`, `kiwoom-etf-historical-daily.ts`, `kiwoom-etf-historical-daily-run.ts`, `krx-dg2-adapter.ts`, `krx-dg3-adapter.ts`, `kiwoom-dg2-distribution-adapter.ts`, `migrations/*.sql`.

- Stage only these domain, adapter, and schema files.
- Verify the ingestion contract with `npm run test:dg2-adapter`, `npm run test:dg3-adapter`, `npm run test:kiwoom-dg2-distribution`, `npm run test:kiwoom-etf-historical-daily`, `npm run test:kiwoom-etf-historical-daily-run`, and `npm run test:krx-etf-daily-market-data`.
- Commit: `feat: add ETF market data ingestion and evidence adapters`.

### Task 3: Strategy, evidence, risk, and research services

**Files:** `src/lib/etf/strategy.ts`, `backtest.ts`, `risk.ts`, `scanner.ts`, `dg2-evidence.ts`, `dg3-evidence.ts`, `gate-validation.ts`, `forward-validation.ts`, `src/lib/research/*.ts`, `src/lib/env.ts`, `scripts/capture-*.ts`.

- Stage strategy/evaluation logic, research normalization, environment schema, and capture scripts together because they share the domain interfaces from Task 2.
- Run `npm run test:dg2-evidence`, `npm run test:dg3-evidence`, `npm run test:bounded-concurrency`, `npm run test:forward-validation`, and `npm run test:gate-validation`.
- Commit: `feat: add ETF strategy evaluation and validation services`.

### Task 4: Unit and integration test suite

**Files:** `test/*.test.ts`, `tests/e2e/dashboard.spec.ts`.

- Stage tests only after Tasks 2–3 are committed; keep each test aligned with its implementation area.
- Run the complete Node test set through `npm run check-all` and run `npm run test:e2e` when the local app is available.
- Commit: `test: cover ETF pipeline and product validation flows`.

### Task 5: Product dashboard and application shell

**Files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/layout/header.tsx`, `src/components/product-dashboard.tsx`.

- Stage only the application shell and dashboard UI. Keep the existing shadcn components unchanged unless the dashboard requires a documented change.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Commit: `feat: replace starter homepage with Signal Guide dashboard`.

### Task 6: Product, gate, and evidence documentation

**Files:** tracked changes in `docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`, existing gate/reference reports, and reviewed Markdown/JSON files under `docs/plan/` and `docs/jobs/`.

- Group documents by one fact/one home; do not duplicate canonical requirements across reports.
- Exclude binary `.docx` references and evidence bundles unless explicitly approved for version control.
- Review the staged list and commit: `docs: record ETF product and validation evidence`.

### Task 7: Optional agent/runtime configuration review

**Files:** `.opencode/**`, `opencode.json`, `_workspace/**`, `design/**`.

- Do not stage automatically. Decide separately whether these are intended repository assets or local/generated runtime state.
- If approved, split them into `chore: add project agent harness configuration` and `docs: add dashboard design references`; otherwise leave them untracked and add appropriate ignore rules in Task 1.

## Final Verification and Commit Order

1. Execute Tasks 1–6 in order; each commit must contain only its listed paths.
2. After Task 6, run `npm run check-all` and `npm run build`.
3. Review `git status --short`, `git log --oneline -7`, and `git diff HEAD~6..HEAD --stat`.
4. Confirm no credentials, raw evidence, generated runtime files, or unrelated pre-existing changes were staged.
