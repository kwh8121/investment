# Vercel + Supabase Private Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the private Next.js application through Vercel Git integration and define Supabase as the managed data boundary without a container or self-hosted server.

**Architecture:** GitHub retains source, PR, and quality-Gate evidence. Vercel imports the repository, creates protected Preview deployments for PRs, and deploys `main` to protected Production; Vercel rollback restores a prior deployment. Supabase will hold Postgres, Auth, and private Storage when DG1 implements the data contract. No scheduler is registered before then.

**Tech Stack:** Next.js 16, GitHub, Vercel Git integration, Supabase Postgres/Auth/Storage, Vercel Cron (DG1-gated).

**Spec:** `docs/guides/one-fact-one-home.md`, `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`, `docs/constitution.md`.

## Global Constraints

- The application is private and non-commercial. Never publish raw market data, API keys, or internal UI without authentication.
- GitHub Actions `quality.yml` remains a quality gate; it does not deploy the application.
- Vercel Preview and Production are protected, and server-only secrets never use the `NEXT_PUBLIC_` prefix.
- Supabase raw-data Storage remains private; data recovery needs separate human approval.
- The scheduler is unavailable until DG1 validates collection and date-state contracts.
- This configuration does not claim DG4 completion or replace human Gate decisions.

## File Structure

| Path                                        | Responsibility                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `.github/workflows/quality.yml`             | Retain source quality checks separately from deployment.                   |
| `docs/manual/vercel-supabase-deployment.md` | Vercel/Supabase configuration, rollout, rollback, scheduler prerequisites. |
| `docs/guides/one-fact-one-home.md`          | Link Stage 5 to the deployment-runbook canonical source.                   |
| `test/deployment-config.test.ts`            | Lock selected platform boundary and reject obsolete container artifacts.   |

## Tasks

### Task 1: Replace obsolete deployment artifacts

**Files:** `next.config.ts`, `Dockerfile`, `.dockerignore`, `compose.production.yaml`, `.github/workflows/publish-image.yml`, `.github/workflows/deploy-production.yml`, `deploy/systemd/stock-market-collector.service`, `deploy/systemd/stock-market-collector.timer`

**Consumes:** The approved GitHub + Vercel + Supabase deployment decision.

**Produces:** A repository with no container, GHCR, self-hosted runner, Compose, or systemd deployment contract.

- [ ] **Step 1: Delete only the uncommitted Docker, Compose, GHCR, self-hosted deployment, and systemd artifacts created by the superseded plan.**
- [ ] **Step 2: Remove `output: 'standalone'` from `next.config.ts`, because Vercel builds the Next.js project directly.**
- [ ] **Step 3: Preserve `.github/workflows/quality.yml` unchanged.**

### Task 2: Record the managed deployment contract

**Files:** `docs/manual/vercel-supabase-deployment.md`, `docs/guides/one-fact-one-home.md`

**Consumes:** Task 1's deleted server-deployment boundary.

**Produces:** One canonical runbook for Vercel/Supabase setup and a single Stage-5 harness link.

- [ ] **Step 1: Document GitHub repository import, `main` Production Branch, Vercel Preview/Production protection, and Vercel rollback.**
- [ ] **Step 2: Document Supabase Postgres/Auth/private Storage responsibility, Preview/Production environment separation, and the server-only key boundary.**
- [ ] **Step 3: Document `supabase/migrations/` and the mandatory `supabase db push --dry-run` before a remote migration.**
- [ ] **Step 4: Add only a runbook link and concise platform summary to Stage 5; do not duplicate operational facts in the harness.**

### Task 3: Defer scheduling until its implementation contract exists

**Files:** `docs/manual/vercel-supabase-deployment.md`

**Consumes:** PRD's weekday 19:00 KST initial collection attempt and DG1 prerequisite.

**Produces:** An explicit no-scheduler policy before DG1 and an exact future schedule.

- [ ] **Step 1: State that no Cron is registered before DG1 implements and validates the collector/date-state contract.**
- [ ] **Step 2: Specify future Vercel Cron as `0 10 * * 1-5` UTC and require route authorization with `CRON_SECRET`, idempotency, checkpoints, and private raw-data Storage.**
- [ ] **Step 3: Require a new approved design if Vercel function limits require Supabase Cron/Edge Function or a separate worker.**

### Task 4: Verify and hand off

**Files:** `test/deployment-config.test.ts`, all Task 1–3 files

**Consumes:** Tasks 1–3 artifacts.

**Produces:** Repeatable evidence that the repository matches the selected platform boundary.

- [ ] **Step 1: Update the static deployment test to require the Vercel/Supabase runbook, `0 10 * * 1-5`, and retained `quality.yml`, and to reject the four obsolete Docker/workflow files.**
- [ ] **Step 2: Run `npm run test:deployment-config`, `npm run check-all`, and `npm run build`. Distinguish user-owned formatting failures and sandbox limits from deployment-boundary failures.**
- [ ] **Step 3: Manually import the GitHub repository in Vercel and configure the Supabase project after merge; attach only links and results to Linear. Do not mark DG4 passed.**

## Self-review

- The plan covers deletion, Vercel deployment, Supabase responsibility, scheduler deferral, regression verification, and Linear handoff.
- All platform facts live in the runbook; the harness contains a link only.
- No Docker, GHCR, self-hosted runner, or systemd dependency remains in the target architecture.
